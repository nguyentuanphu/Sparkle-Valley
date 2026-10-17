// Trading with friends in the same online room: pick a friend, choose what to give (things from your
// backpack or coins) and what you would like back, and send the offer. The friend sees it and taps
// "Deal!" or "No thanks". Things only change hands when both sides still have them.
import type { TradeSide } from '../types/net';
import type { Profile } from '../types/save';
// an offer being made on the stall: what is given or wanted (types/net.d.ts TradeSide, with items and coins always there)
type Offer = { items: Record<string, number>, coins: number, clothes?: string[] };
import { T } from './i18n.js';
import { Net } from './net.js';
import { ITEMS } from './data.js';
import { ITEM, CLOTHES, owns, setOf, forSet, clothesOk } from './content/shop.js';
import { farm, saveFarm } from './state.js';
import { fmt } from './money.js';
import { SFX } from './audio.js';
import { say } from './voice.js';
import { el, esc } from './util.js';
import { modal } from './ui.js';

const COIN_STEPS = [0, 10, 20, 50, 100];   // in game coins (10 = $1)
// (Round V, owner 13 Oct: "clothes can be gifted to the other sex or traded with the same sex") clothes the child owns and
// is not wearing can go in a trade: with a friend of the same set (girl or boy) both ways; to a friend of the other set
// only as a gift (nothing asked back) and only clothes made for that friend's set
const wearing = (p, id) => !!p.look && Object.values(p.look).includes(id);
export const spareClothes = p => CLOTHES.filter(it => owns(p, it.id) && !wearing(p, it.id) && !it.tester).map(it => it.id);
// (r79, owner 16 Oct) clothes of the other set are wrapped gift boxes (owned.gifts): a friend of that set can be given one
const gifts = (p: Profile): string[] => (p.owned && Array.isArray(p.owned.gifts) ? p.owned.gifts : []);
const has = (p, want) => Object.entries(want.items || {}).every(([k, n]) => (p.inv[k] || 0) >= n) && farm.coins >= (want.coins || 0) && (want.clothes || []).every(id => (owns(p, id) && !wearing(p, id)) || gifts(p).includes(id));
function move(p: Profile, take: TradeSide, give: TradeSide) {
  for (const [k, n] of Object.entries(take.items || {})) p.inv[k] = (p.inv[k] || 0) - n;
  for (const [k, n] of Object.entries(give.items || {})) p.inv[k] = (p.inv[k] || 0) + n;
  farm.coins += (give.coins || 0) - (take.coins || 0); saveFarm();
  p.owned = p.owned || {}; p.owned.gifts = gifts(p).slice();
  // a gift box given away leaves the Backpack (one box); other clothes leave the wardrobe
  for (const id of take.clothes || []) { const k = p.owned.gifts.indexOf(id); if (k >= 0) p.owned.gifts.splice(k, 1); else p.owned.clothes = (p.owned.clothes || []).filter(x => x !== id); }
  p.owned.clothes = p.owned.clothes || [];
  for (const id of give.clothes || []) { if (ITEM[id] && !forSet(ITEM[id], setOf(p.look))) p.owned.gifts.push(id); else if (!p.owned.clothes.includes(id)) p.owned.clothes.push(id); }
}
const label = side => [...Object.entries(side.items || {}).map(([k, n]) => `${n} ${ITEMS[k] ? ITEMS[k].icon : '❔'}`), ...(side.clothes || []).map(id => ITEM[id] ? T(ITEM[id].en, ITEM[id].vi) : ''), side.coins ? fmt(side.coins) : ''].filter(Boolean).join(' + ') || T('nothing', 'không gì');
const ALL_WANT = () => Object.keys(ITEMS);
// a friend's clothes set (girl or boy): from their character in the valley, else from the room's list
const setOfFriend = (G, id) => setOf(((G.partners || {})[id] || {}).look || (Net.remotes[id] || {}).look);

let pending = {}; // my sent offers: id -> {to, give, want}
export function setupTrading(G) {
  const hero = () => G.heroes[0];
  Net.on('offer', d => {
    const h = hero(); if (!h || !d.give || !d.want) return;
    if (!clothesOk(d.give, d.want, setOfFriend(G, d.from), setOf(h.profile.look))) { Net.send({ t: 'tradeNo', to: d.from, id: d.id }); return; }
    const who = (Net.remotes[d.from] || {}).name || T('A friend', 'Một bạn');
    SFX.chime(); say(`${who} wants to trade!`, `${who} muốn đổi đồ!`);
    const m = modal('tradein', `<h2>🔄 ${T('Trade from', 'Đổi đồ với')} ${esc(who)}</h2>
      <div class="tr-deal"><div><small>${T('You get', 'Con nhận')}</small><b>${label(d.give)}</b></div><span>⇄</span><div><small>${T('You give', 'Con đưa')}</small><b>${label(d.want)}</b></div></div>
      <div class="actions center"><button class="btn big primary" id="trYes">🤝 ${T('Deal!', 'Đồng ý!')}</button><button class="btn big" id="trNo">${T('No thanks', 'Không, cảm ơn')}</button></div>`);
    m.querySelector('#trNo').onclick = () => { Net.send({ t: 'tradeNo', to: d.from, id: d.id }); m.close(); };
    m.querySelector('#trYes').onclick = () => {
      if (!has(h.profile, d.want)) { G.toast(h, T("You don't have those any more.", 'Con không còn đủ đồ đó nữa.')); Net.send({ t: 'tradeNo', to: d.from, id: d.id }); m.close(); return; }
      Net.send({ t: 'tradeYes', to: d.from, id: d.id }); m.close();
      // the offerer confirms they still have their side, then both swap
      Net.on('tradeDone', function done(r) { if (r.id !== d.id) return; Net.off('tradeDone', done); if (r.ok) { move(h.profile, d.want, d.give); G.save(); SFX.coin(); G.toast(h, '🤝 ' + T('Traded! ', 'Đổi xong! ') + label(d.give)); say('Great trade!', 'Đổi đồ vui quá!'); } });
    };
  });
  Net.on('tradeYes', d => {
    const o = pending[d.id], h = hero(); if (!o || !h) return; delete pending[d.id];
    const ok = has(h.profile, o.give);
    Net.send({ t: 'tradeDone', to: d.from, id: d.id, ok });
    if (ok) { move(h.profile, o.give, o.want); G.save(); SFX.coin(); G.toast(h, '🤝 ' + T('Traded! ', 'Đổi xong! ') + label(o.want)); say('Your friend said yes!', 'Bạn đồng ý rồi!'); }
  });
  Net.on('tradeNo', d => { const h = hero(); if (pending[d.id]) { delete pending[d.id]; h && G.toast(h, T('Your friend said no thanks.', 'Bạn nói không, cảm ơn.')); } });
}

// The stall: choose a friend, what you give and what you want.
export function openTrade(G, h, toId) {
  const ids = Object.keys(Net.remotes);
  const m = modal('trade', ''), card = m.querySelector('.card');
  const st: { to: string, give: Offer, want: Offer } = { to: toId && Net.remotes[toId] ? toId : ids[0], give: { items: {}, coins: 0 }, want: { items: {}, coins: 0 } };
  const draw = () => {
    if (!Net.connected || !ids.length) {
      card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🏪 ${T('My market stall', 'Sạp hàng của con')}</h2>
        <p class="note">${T('Trade with friends who are playing with you online. Open the Sparkle Pad → 👫 Friends to start or join a room, then come back to your stall.', 'Đổi đồ với các bạn đang chơi cùng qua mạng. Mở Sổ Lấp Lánh → 👫 Bạn bè để tạo hoặc vào phòng, rồi quay lại sạp nhé.')}</p>
        <button class="btn big primary wide" id="trOnline">👫 ${T('Play online', 'Chơi qua mạng')}</button>`;
      card.querySelector('.x').onclick = () => { m.close(); G.paused = false; };
      card.querySelector('#trOnline').onclick = () => { m.close(); G.paused = false; G.openPad && G.openPad(h.i, 'friend'); };
      return;
    }
    const inv = Object.entries((h.profile as Profile).inv || {}).filter(([k, n]) => n > 0 && ITEMS[k]);
    const mine = setOf(h.profile.look), theirs = setOfFriend(G, st.to), same = mine === theirs, spare = same ? spareClothes(h.profile) : [...new Set(gifts(h.profile))].filter(id => ITEM[id] && forSet(ITEM[id], theirs));
    const clothesPic = it => G.shop && G.shop.itemSVG ? G.shop.itemSVG(it) : '👕';
    const chip = (side, k) => { const n = st[side].items[k] || 0; return n ? `<b class="tr-n">${n}</b>` : ''; };
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🏪 ${T('My market stall', 'Sạp hàng của con')}</h2>
      <h3>${T('Trade with', 'Đổi với')}</h3><div class="tr-who">${ids.map(id => `<button data-to="${id}" class="${st.to === id ? 'on' : ''}">🧒 ${esc(Net.remotes[id].name)}</button>`).join('')}</div>
      <h3>${T('I give', 'Con đưa')} <small>(${T('tap to add, tap again for more', 'chạm để thêm')})</small></h3>
      <div class="bigpick tr-pick">${inv.map(([k, n]) => `<button data-give="${k}"><span>${ITEMS[k].icon}</span><small>${n}</small>${chip('give', k)}</button>`).join('') || `<p class="note">${T('Your backpack is empty.', 'Ba lô trống.')}</p>`}</div>
      <div class="tr-coins">💰 <button data-gc="-1">−</button><b>${fmt(st.give.coins)}</b><button data-gc="1">+</button></div>
      ${spare.length ? `<h3>${T('Clothes I can give', 'Quần áo con có thể tặng')} <small>${same ? T('trade with your friend', 'đổi với bạn') : T('a gift for your friend', 'quà tặng cho bạn')}</small></h3><div class="bigpick tr-pick">${spare.map(id => `<button data-givec="${id}" class="${(st.give.clothes || []).includes(id) ? 'on' : ''}" aria-label="${esc(T(ITEM[id].en, ITEM[id].vi))}">${clothesPic(ITEM[id])}<small>${esc(T(ITEM[id].en, ITEM[id].vi))}</small></button>`).join('')}</div>` : ''}
      <h3>${T('I would like', 'Con muốn')}</h3>
      <div class="bigpick tr-pick">${ALL_WANT().map(k => `<button data-want="${k}"><span>${ITEMS[k].icon}</span>${chip('want', k)}</button>`).join('')}</div>
      <div class="tr-coins">💰 <button data-wc="-1">−</button><b>${fmt(st.want.coins)}</b><button data-wc="1">+</button></div>
      ${same ? `<h3>${T('Clothes I would like', 'Quần áo con muốn')}</h3><div class="bigpick tr-pick">${CLOTHES.filter(it => !it.tester && forSet(it, mine) && !owns(h.profile, it.id)).slice(0, 18).map(it => `<button data-wantc="${it.id}" class="${(st.want.clothes || []).includes(it.id) ? 'on' : ''}" aria-label="${esc(T(it.en, it.vi))}">${clothesPic(it)}</button>`).join('')}</div>` : `<p class="note">${T('Your friend wears the other set of clothes: clothes go to them as a gift, with nothing asked back.', 'Bạn mặc bộ quần áo khác: quần áo chỉ là quà tặng, không đổi lấy gì.')}</p>`}
      <div class="tr-deal"><div><small>${T('You give', 'Con đưa')}</small><b>${label(st.give)}</b></div><span>⇄</span><div><small>${T('You get', 'Con nhận')}</small><b>${label(st.want)}</b></div></div>
      <div class="actions center"><button class="btn" id="trClear">↩️ ${T('Start over', 'Làm lại')}</button><button class="btn big primary" id="trSend">📨 ${T('Send offer', 'Gửi đề nghị')}</button></div>`;
    card.querySelector('.x').onclick = () => { m.close(); G.paused = false; };
    card.querySelectorAll('[data-to]').forEach(b => b.onclick = () => { st.to = b.dataset.to; draw(); });
    card.querySelectorAll('[data-give]').forEach(b => b.onclick = () => { const k = b.dataset.give, n = (st.give.items[k] || 0) + 1; st.give.items[k] = n > (h.profile.inv[k] || 0) ? 0 : n; SFX.tap(); draw(); });
    card.querySelectorAll('[data-want]').forEach(b => b.onclick = () => { const k = b.dataset.want, n = (st.want.items[k] || 0) + 1; st.want.items[k] = n > 5 ? 0 : n; SFX.tap(); draw(); });
    const step = (side, dir) => { const i = Math.max(0, Math.min(COIN_STEPS.length - 1, COIN_STEPS.indexOf(st[side].coins) + dir)); st[side].coins = COIN_STEPS[i]; if (side === 'give' && st.give.coins > farm.coins) st.give.coins = 0; draw(); };
    card.querySelectorAll('[data-gc]').forEach(b => b.onclick = () => step('give', +b.dataset.gc));
    card.querySelectorAll('[data-wc]').forEach(b => b.onclick = () => step('want', +b.dataset.wc));
    const flip = (side, id) => { const a = st[side].clothes = st[side].clothes || []; const k = a.indexOf(id); if (k >= 0) a.splice(k, 1); else if (a.length < 6) a.push(id); SFX.tap(); draw(); };
    card.querySelectorAll('[data-givec]').forEach(b => b.onclick = () => flip('give', b.dataset.givec));
    card.querySelectorAll('[data-wantc]').forEach(b => b.onclick = () => flip('want', b.dataset.wantc));
    card.querySelector('#trClear').onclick = () => { st.give = { items: {}, coins: 0 }; st.want = { items: {}, coins: 0 }; draw(); };
    card.querySelector('#trSend').onclick = () => {
      const clean = (s: Offer): Offer => ({ items: Object.fromEntries(Object.entries(s.items).filter(([, n]) => n > 0)), coins: s.coins, ...((s.clothes || []).length ? { clothes: s.clothes.slice() } : {}) });
      const give = clean(st.give), want = clean(st.want);
      if (!Object.keys(give.items).length && !give.coins && !(give.clothes || []).length) return G.toast(h, T('Choose something to give first.', 'Hãy chọn đồ để đưa trước nhé.'));
      if (!clothesOk(give, want, setOf(h.profile.look), setOfFriend(G, st.to))) return G.toast(h, T('Clothes for a friend who wears the other set are a gift: ask for nothing back.', 'Quần áo cho bạn mặc bộ khác là quà tặng: đừng xin lại gì nhé.'));
      const id = Math.random().toString(36).slice(2, 9);
      pending[id] = { to: st.to, give, want };
      Net.send({ t: 'offer', to: st.to, id, give, want });
      SFX.whoosh ? SFX.whoosh() : SFX.tap(); G.toast(h, '📨 ' + T('Offer sent!', 'Đã gửi đề nghị!')); m.close(); G.paused = false;
    };
  };
  G.paused = true; draw();
}
