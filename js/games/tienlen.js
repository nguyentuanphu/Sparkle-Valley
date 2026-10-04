// Tiến Lên (southern style, "Tiến Lên miền Nam"), played at the card table on Two Homes Street with anh Ba and
// his friend Con Vật. 13 cards each; 3 is the lowest card and 2 the highest; suits ♠ < ♣ < ♦ < ♥.
// You may play one card, a pair, three or four of a kind, a run of 3+ cards in a row (sảnh, no 2s) or 3+ pairs
// in a row (đôi thông). Beat what is on the table with the same kind of play, higher; or pass, and you sit out
// until someone starts again. "Chặt": four of a kind or three pairs in a row can beat a 2.
// The first to play all their cards wins the hand. Hints light up a good play, and little ones always get one.
import { register } from './frame.js';
import { el } from '../util.js';
import { T } from '../i18n.js';

const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'], SUITS = ['♠', '♣', '♦', '♥'];
const card = (r, s) => ({ r, s, v: r * 4 + s });
const byV = (a, b) => a.v - b.v;

// what kind of play these cards are (or null if they are not a play)
export function classify(cs) {
  const c = [...cs].sort(byV), n = c.length; if (!n) return null;
  const top = c[n - 1].v, same = c.every(x => x.r === c[0].r);
  if (n === 1) return { type: 'single', n, top, r: c[0].r };
  if (same) return n === 2 ? { type: 'pair', n, top, r: c[0].r } : n === 3 ? { type: 'triple', n, top, r: c[0].r } : n === 4 ? { type: 'quad', n, top, r: c[0].r } : null;
  if (n >= 3 && c.every((x, i) => x.r < 12 && (i === 0 || x.r === c[i - 1].r + 1))) return { type: 'run', n, top, r: c[n - 1].r };
  if (n >= 6 && n % 2 === 0) {
    let ok = true; for (let i = 0; i < n; i += 2) { if (c[i].r !== c[i + 1].r || c[i].r >= 12 || (i && c[i].r !== c[i - 2].r + 1)) { ok = false; break; } }
    if (ok) return { type: 'pairs', n, len: n / 2, top, r: c[n - 1].r };
  }
  return null;
}
// can play a beat play b (b null: a new round, anything goes)
export function beats(a, b) {
  if (!a) return false; if (!b) return true;
  if (a.type === b.type && a.n === b.n) return a.top > b.top;
  if (b.type === 'single' && b.r === 12) return a.type === 'quad' || (a.type === 'pairs' && a.len >= 3);
  if (b.type === 'pair' && b.r === 12) return a.type === 'quad' || (a.type === 'pairs' && a.len >= 4);
  if (b.type === 'quad') return a.type === 'pairs' && a.len >= 4;
  if (b.type === 'pairs' && b.len === 3) return a.type === 'quad' || (a.type === 'pairs' && a.len >= 4);
  return false;
}
// every play that can be made from a hand
function allPlays(hand) {
  const out = [], byR = {}; hand.forEach(c => (byR[c.r] = byR[c.r] || []).push(c));
  const sub = (arr, k, start = 0, cur = [], res = []) => { if (cur.length === k) { res.push([...cur]); return res; } for (let i = start; i < arr.length; i++) { cur.push(arr[i]); sub(arr, k, i + 1, cur, res); cur.pop(); } return res; };
  for (const c of hand) out.push([c]);
  for (const r in byR) for (let k = 2; k <= byR[r].length; k++) sub(byR[r].sort(byV), k).forEach(x => out.push(x));
  // runs: lowest card of each rank, and every suit for the top card
  for (let s = 0; s < 11; s++) for (let e = s + 2; e < 12; e++) {
    let ok = true; for (let r = s; r <= e; r++) if (!byR[r]) { ok = false; break; } if (!ok) break;
    const base = []; for (let r = s; r < e; r++) base.push([...byR[r]].sort(byV)[0]);
    byR[e].forEach(t => out.push([...base, t]));
  }
  // pairs in a row
  for (let s = 0; s < 11; s++) for (let e = s + 2; e < 12; e++) {
    let ok = true; for (let r = s; r <= e; r++) if (!byR[r] || byR[r].length < 2) { ok = false; break; } if (!ok) break;
    const p = []; for (let r = s; r <= e; r++) { const q = [...byR[r]].sort(byV); p.push(...(r === e ? q.slice(-2) : q.slice(0, 2))); }
    out.push(p);
  }
  return out.map(cs => ({ cs, k: classify(cs) })).filter(x => x.k);
}
const BOMB = k => k.type === 'quad' || (k.type === 'pairs' && k.len >= 3);
// a sensible play for a computer player (or a hint for the child): null = pass
export function choose(hand, table, { strong = false, others = 13 } = {}) {
  const plays = allPlays(hand).filter(p => beats(p.k, table));
  if (!plays.length) return null;
  if (!table) {
    // lead with the lowest card, in the biggest group it belongs to (keep 2s and bombs for later)
    const low = [...hand].sort(byV)[0];
    const withLow = plays.filter(p => p.cs.includes(low) && !BOMB(p.k) && p.cs.every(c => c.r < 12));
    const pool = withLow.length ? withLow : plays;
    pool.sort((a, b) => b.k.n - a.k.n || a.k.top - b.k.top); return pool[0].cs;
  }
  const normal = plays.filter(p => p.k.type === table.type && p.k.n === table.n).sort((a, b) => a.k.top - b.k.top);
  // don't throw a 2 or break up a bomb early unless someone is about to win
  const cheap = normal.filter(p => p.cs.every(c => c.r < 12) || others <= 3 || hand.length <= 4);
  if (cheap.length) return cheap[0].cs;
  if (normal.length && (strong || others <= 4)) return normal[0].cs;
  const bombs = plays.filter(p => BOMB(p.k)).sort((a, b) => a.k.top - b.k.top);
  if (bombs.length && (strong || others <= 4)) return bombs[0].cs;
  return null;
}

register({
  id: 'tienlen', icon: '🎴', origin: 'vn', name: () => T('Tiến Lên (cards)', 'Tiến Lên miền Nam'),
  async run(api) {
    const little = api.little, strong = api.strong;
    api.say('Tiến Lên! Beat the cards on the table with the same kind of play, but higher. 3 is the lowest, 2 is the highest. Play all your cards first to win!',
      'Tiến Lên! Đánh bài cao hơn bài trên bàn, cùng một kiểu. 3 nhỏ nhất, 2 lớn nhất. Ai đánh hết bài trước là thắng!');
    const t = el('div', 'tl', `<div class="tl-opp"></div><div class="tl-table"><div class="tl-who"></div><div class="tl-pile"></div></div><div class="tl-msg"></div><div class="tl-hand"></div>
      <div class="tl-btns"><button class="tl-b hint">💡 ${T('Hint', 'Gợi ý')}</button><button class="tl-b pass">✋ ${T('Pass', 'Bỏ lượt')}</button><button class="tl-b play">▶ ${T('Play', 'Đánh')}</button></div>`);
    api.stage.appendChild(t);
    const oppEl = t.querySelector('.tl-opp'), pileEl = t.querySelector('.tl-pile'), whoEl = t.querySelector('.tl-who'), msgEl = t.querySelector('.tl-msg'), handEl = t.querySelector('.tl-hand');
    const bPlay = t.querySelector('.play'), bPass = t.querySelector('.pass'), bHint = t.querySelector('.hint');
    const names = [T('You', 'Con'), T('Big Brother Ba', 'Anh Ba'), 'Con Vật'], faces = ['🙂', '🧑🏻', '👦🏻'];
    const cardHTML = (c, cls = '') => `<div class="tl-card ${c.s >= 2 ? 'red' : ''} ${cls}" data-v="${c.v}"><b>${RANKS[c.r]}</b><i>${SUITS[c.s]}</i></div>`;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const HANDS = little ? 2 : 3;
    let hands, table, lastBy, passed, turn, sel, finished, game = 0, firstHand = true, shown = null; // shown: cards dealt so far, while dealing

    const say = (en, vi) => { msgEl.textContent = T(en, vi); };
    function drawOpp() {
      oppEl.innerHTML = [1, 2].map(i => `<div class="tl-p ${turn === i ? 'on' : ''} ${passed.has(i) ? 'out' : ''}"><span class="f">${faces[i]}</span><b>${names[i]}</b><span class="n">🂠 ${shown ? shown[i] : hands[i].length}</span>${passed.has(i) ? `<small>${T('passed', 'bỏ')}</small>` : ''}</div>`).join('');
    }
    function drawHand() {
      handEl.innerHTML = (shown ? hands[0].slice(0, shown[0]) : hands[0]).map(c => cardHTML(c, sel.has(c.v) ? 'sel' : '')).join('');
      handEl.querySelectorAll('.tl-card').forEach(e => { e.onclick = () => { if (turn !== 0) return; const v = +e.dataset.v; sel.has(v) ? sel.delete(v) : sel.add(v); api.sfx.tap(); drawHand(); updateBtns(); }; });
      t.classList.toggle('mine', turn === 0);
    }
    function drawTable() {
      pileEl.innerHTML = table ? table.cs.map(c => cardHTML(c)).join('') : `<span class="tl-free">${T('New round: play anything!', 'Vòng mới: đánh gì cũng được!')}</span>`;
      whoEl.textContent = table ? names[lastBy] : '';
    }
    function updateBtns() {
      const cs = hands[0].filter(c => sel.has(c.v)), k = classify(cs), ok = turn === 0 && beats(k, table && table.k);
      bPlay.disabled = !ok; bPass.disabled = turn !== 0 || !table; bHint.disabled = turn !== 0;
      t.classList.toggle('canplay', ok);
    }
    function hint() {
      const cs = choose(hands[0], table && table.k, { strong: true, others: Math.min(hands[1].length, hands[2].length) });
      sel = new Set(cs ? cs.map(c => c.v) : []); drawHand(); updateBtns();
      if (!cs) say('Nothing beats it. Tap Pass!', 'Không có bài nào chặn được. Bấm Bỏ lượt nhé!');
    }
    // dealing, the way it is done at the table: a deck in the middle, one card at a time to each player in turn
    // (owner, round G: "Tiến Lên should show the cards being dealt"); little ones get a quicker deal
    async function dealCards() {
      shown = [0, 0, 0]; drawOpp(); drawHand();
      const deckEl = el('div', 'tl-deck', '<div class="tl-card back"></div><div class="tl-card back"></div><div class="tl-card back"></div>'); t.appendChild(deckEl);
      const box = t.getBoundingClientRect(), mid = (e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top]; });
      const from = mid(deckEl), to = [() => mid(handEl), () => mid(oppEl.children[0] || oppEl), () => mid(oppEl.children[1] || oppEl)];
      const gap = little ? 28 : 45;
      for (let k = 0; k < 39 && !api.closed; k++) {
        const who = (turn + k) % 3, fly = el('div', 'tl-card back tl-fly'); fly.style.left = from[0] + 'px'; fly.style.top = from[1] + 'px'; t.appendChild(fly);
        const [x, y] = to[who](); requestAnimationFrame(() => { fly.style.transform = `translate(${x - from[0]}px, ${y - from[1]}px) rotate(${(who - 1) * 12}deg) scale(.8)`; fly.style.opacity = '.2'; });
        setTimeout(() => { fly.remove(); shown[who]++; if (who === 0) drawHand(); else drawOpp(); }, 320);
        if (k % 3 === 0) api.sfx.tap();
        await sleep(gap);
      }
      await sleep(360); deckEl.remove(); shown = null;
    }
    async function deal() {
      const deck = []; for (let r = 0; r < 13; r++) for (let s = 0; s < 4; s++) deck.push(card(r, s));
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      hands = [0, 1, 2].map(i => deck.slice(i * 13, i * 13 + 13).sort(byV));
      table = null; lastBy = -1; passed = new Set(); sel = new Set(); finished = [];
      // the first hand starts with whoever has the lowest card; after that the winner starts
      if (firstHand) { const low = hands.map(h => h[0].v); turn = low.indexOf(Math.min(...low)); }
      drawTable(); await dealCards(); if (api.closed) return;
      drawOpp(); drawHand(); drawTable(); updateBtns();
    }
    function nextTurn() {
      let n = turn;
      for (let k = 0; k < 3; k++) {
        n = (n + 1) % 3;
        if (hands[n].length === 0) continue;
        if (n === lastBy) { // everyone else passed: the last player starts a new round
          table = null; passed.clear(); turn = n; return;
        }
        if (!passed.has(n)) { turn = n; return; }
      }
      table = null; passed.clear(); turn = lastBy >= 0 && hands[lastBy].length ? lastBy : n;
    }
    function play(i, cs) {
      const set = new Set(cs.map(c => c.v)); hands[i] = hands[i].filter(c => !set.has(c.v));
      table = { cs: [...cs].sort(byV), k: classify(cs) }; lastBy = i;
      const bomb = BOMB(table.k); api.sfx.pop(bomb ? 6 : 3);
      if (i !== 0) say(`${names[i]}: ${describe(table.k)}`, `${names[i]}: ${describe(table.k)}`);
      if (bomb) { t.classList.remove('chop'); void t.offsetWidth; t.classList.add('chop'); }
      if (!hands[i].length) finished.push(i);
    }
    function describe(k) {
      const n = { single: T('one card', 'một lá'), pair: T('a pair', 'một đôi'), triple: T('three of a kind', 'sám cô'), quad: T('four of a kind!', 'tứ quý!'), run: T(`a run of ${k.n}`, `sảnh ${k.n} lá`), pairs: T(`${k.len} pairs in a row!`, `${k.len} đôi thông!`) };
      return n[k.type];
    }
    let resolveTurn = null;
    bPlay.onclick = () => { if (turn !== 0 || !resolveTurn) return; const cs = hands[0].filter(c => sel.has(c.v)); if (!beats(classify(cs), table && table.k)) return; sel = new Set(); play(0, cs); api.right(pileEl); resolveTurn && resolveTurn(); };
    bPass.onclick = () => { if (turn !== 0 || !table || !resolveTurn) return; passed.add(0); sel = new Set(); api.sfx.tap(); say('You pass. Wait for the next round!', 'Con bỏ lượt. Chờ vòng sau nhé!'); resolveTurn && resolveTurn(); };
    bHint.onclick = () => { if (turn !== 0) return; api.sfx.tap(); hint(); };

    let wins = 0;
    for (game = 0; game < HANDS && !api.closed; game++) {
      await deal(); firstHand = false; if (api.closed) return;
      api.dots(HANDS, game);
      while (!api.closed && finished.length === 0) {
        drawOpp(); drawTable(); drawHand(); updateBtns();
        if (turn === 0) {
          if (!table) say('Your turn: start a new round with any play.', 'Tới lượt con: đánh gì cũng được.'); else say('Your turn: beat it, or pass.', 'Tới lượt con: chặn bài, hay bỏ lượt.');
          if (little || api.level <= 1) hint();
          await new Promise(r => { resolveTurn = r; }); resolveTurn = null;
        } else {
          await sleep(little ? 1200 : 900); if (api.closed) return;
          const lazy = !strong && Math.random() < (little ? .45 : [.3, .2, .12, .06, 0][api.level - 1]);
          const cs = table && lazy ? null : choose(hands[turn], table && table.k, { strong, others: Math.min(...[0, 1, 2].filter(j => j !== turn).map(j => hands[j].length || 99)) });
          if (cs) play(turn, cs); else { if (!table) play(turn, [hands[turn][0]]); else { passed.add(turn); say(`${names[turn]} passes.`, `${names[turn]} bỏ lượt.`); } }
        }
        if (finished.length) break;
        nextTurn();
      }
      if (api.closed) return;
      const w = finished[0]; turn = -1;
      drawOpp(); drawTable(); drawHand(); updateBtns();
      if (w === 0) { wins++; api.right(handEl); api.say('You played all your cards! You win this hand!', 'Con đánh hết bài rồi! Con thắng ván này!'); }
      else api.say(`${names[w]} played all their cards first. Good game! Next hand!`, `${names[w]} đánh hết bài trước. Ván hay lắm! Ván tiếp nào!`);
      turn = w; await sleep(2200);
      if (wins >= (little ? 1 : 2)) break;
    }
    if (api.closed) return;
    api.dots(HANDS, HANDS);
    return api.win({ title: wins ? T(`You won ${wins} hand${wins > 1 ? 's' : ''} of Tiến Lên!`, `Con thắng ${wins} ván Tiến Lên!`) : T('Great games of Tiến Lên with anh Ba and Phong!', 'Chơi Tiến Lên với anh Ba và Phong vui quá!') });
  }
});
