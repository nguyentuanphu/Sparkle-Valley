// A shared frame for every mini-game: the full-screen layer, the title bar, progress dots,
// gentle feedback (no losing — mistakes just say "try again") and the win celebration.
import { T } from '../i18n.js';
import { say } from '../voice.js';
import { SFX, Music } from '../audio.js';
import { el, wait, esc } from '../util.js';
import { openHowTo } from '../howto.js';

export const GAMES = {};
// Each kind of game has its own song.
const GAME_MUSIC = {
  music: 'none', firstwords: 'twinkle', tangram: 'think', snakes: 'party2', rangoli: 'twinkle',
  pattern: 'think', counting: 'twinkle', letters: 'twinkle', numbers: 'think', shapes: 'think', colors: 'twinkle', sorting: 'think', memory: 'twinkle',
  hanoi: 'strategy', robot: 'strategy', maze: 'strategy', goat: 'folk', oanquan: 'strategy', caro: 'strategy', hopscotch: 'folk', tug: 'village2', mrwolf: 'folk', datnieu: 'folk', kite: 'fly', chichi: 'folk', sackrace: 'party2', cricket: 'village2', parcel: 'party1', words: 'twinkle', snap: 'village2', dacau: 'party2', chuyen: 'village2', dragon: 'folk', marbles: 'strategy', skipping: 'party2',
  market: 'money', order: 'farm', sortout: 'money', bunny: 'farm', jigsaw: 'twinkle', oddone: 'pond', tower: 'think', duckmaze: 'pond',
  balloon: 'fly', bubbles: 'party2', tune: 'none',
  clock: 'think', sums: 'twinkle', opposites: 'think', animalsounds: 'farm', phonics: 'twinkle', feelings: 'twinkle'
};
export const register = def => { GAMES[def.id] = def; };
const PRIZES = ['🦄', '🦖', '🚀', '🧸', '🎈', '🍭', '🪁', '🐬', '🌈', '👑', '🎨', '🛼', '🪀', '🍦', '🐼'];

let current = null;
export const gameOpen = () => !!current;

// players: array of profiles (1 or 2); level: 1..5; style: 'shrine' | 'village'
export function openGame(id, { players, level = 1, style = 'shrine', partnerName = null, little = true, strong = false }) {
  const def = GAMES[id]; if (!def) return Promise.resolve({ won: false });
  if (current) current.close(false);
  return new Promise(resolve => {
    const layer = el('div', 'gl gl-' + style);
    layer.innerHTML = `
      <div class="gl-head">
        <button class="gl-x" aria-label="${T('Leave', 'Rời đi')}">✕</button>
        <div class="gl-title"><span class="gl-icon">${def.icon}</span><span>${esc(def.name())}</span></div>
        <div class="gl-dots"></div>
        <button class="gl-how" aria-label="${T('How to play', 'Cách chơi')}">📺</button>
      </div>
      <div class="gl-help"></div>
      <div class="gl-stage"></div>
      <div class="starbox">⭐ <b>0</b></div>
      <div class="mascot">🦉</div><div class="mascot-say"></div>`;
    document.body.appendChild(layer);
    const stage = layer.querySelector('.gl-stage'), dots = layer.querySelector('.gl-dots'), help = layer.querySelector('.gl-help');
    const cleanups = [];
    let closed = false;
    const prevMusic = Music.key; Music.play(GAME_MUSIC[id] || 'think');
    const api = {
      stage, level, players, two: players.length > 1, partnerName, T, el,
      little,   // under-5 mode: everything gentle, nobody can lose
      strong,   // computer opponents play to win (big kids on medium or hard)
      say: (en, vi) => { const t = T(en, vi); help.textContent = t.charAt(0).toUpperCase() + t.slice(1); say(en, vi); },
      // Show text without speaking it.
      show: (en, vi) => { help.textContent = T(en, vi); },
      sfx: SFX, wait,
      onCleanup: f => cleanups.push(f),
      dots(n, done) { dots.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join(''); },
      right(e) { SFX.ok(); if (e) { e.classList.remove('wrong'); e.classList.add('right'); } reward(e); streak++; rights++; if (streak >= 3) combo(streak); else if (Math.random() < .08) lucky(); },
      wrong(e, en = 'Try again!', vi = 'Thử lại nhé!') { SFX.no(); streak = 0; misses++; if (e) { e.classList.remove('wrong'); void e.offsetWidth; e.classList.add('wrong'); } mascot('hmm', T('Hmm… try again!', 'Ừm… thử lại nhé!')); say(en, vi); },
      praise() { const p = [['Great job!', 'Giỏi quá!'], ['Well done!', 'Làm tốt lắm!'], ['Yes! Clever!', 'Đúng rồi! Thông minh quá!'], ['Super!', 'Tuyệt vời!'], ['You got it!', 'Con làm được rồi!']]; const [e, v] = p[Math.floor(Math.random() * p.length)]; say(e, v); mascot('cheer', T(e, v)); },
      get closed() { return closed; },
      async win(extra = {}) {
        if (closed) return;
        SFX.fanfare();
        // 1 to 3 stars (little ones always get 3), then a treasure chest pops open with a surprise
        const n = little ? 3 : misses <= 1 ? 3 : misses <= 4 ? 2 : 1, prize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
        const c = el('div', 'gl-win', `<div class="gl-stars">${[0, 1, 2].map(k => `<i class="${k < n ? 'on' : ''}" style="--d:${k * .25}s">⭐</i>`).join('')}</div>
          <div class="gl-chest"><span class="lid">🎁</span><span class="prize">${prize}</span></div><p>${esc(extra.title || T('You did it!', 'Con làm được rồi!'))}</p>`);
        layer.appendChild(c); say(extra.title || 'You did it!', extra.titleVi || 'Con làm được rồi!');
        burstConfetti(layer);
        setTimeout(() => { c.querySelector('.gl-chest').classList.add('open'); SFX.coin(); }, 1100);
        await new Promise(r => { const t = setTimeout(r, 3400); c.onclick = () => { clearTimeout(t); r(); }; }); finish(true, Object.assign({ stars: n }, extra));
      }
    };
    let streak = 0, rights = 0, misses = 0;
    // three right in a row: a combo with extra stars
    function combo(k) {
      const b = el('div', 'gl-combo', `🔥 ${T('Combo', 'Liên tiếp')} ×${k}`); layer.appendChild(b); setTimeout(() => b.remove(), 1100);
      stars += 1; starEl.textContent = stars; SFX.chime();
    }
    // now and then a lucky golden star bursts out
    function lucky() {
      const b = el('div', 'gl-combo lucky', `🌟 ${T('Lucky star! +3', 'Sao may mắn! +3')}`); layer.appendChild(b); setTimeout(() => b.remove(), 1300);
      stars += 3; starEl.textContent = stars; SFX.secret && SFX.secret();
    }
    // Ông Cú cheers in the corner; every right answer sends a star flying to the star counter.
    let stars = 0;
    const mascotEl = layer.querySelector('.mascot'), bubbleEl = layer.querySelector('.mascot-say'), starEl = layer.querySelector('.starbox b');
    function mascot(kind, text) {
      mascotEl.classList.remove('cheer', 'hmm'); void mascotEl.offsetWidth; mascotEl.classList.add(kind);
      if (text) { bubbleEl.textContent = text; bubbleEl.classList.add('on'); clearTimeout(mascot._t); mascot._t = setTimeout(() => bubbleEl.classList.remove('on'), 1400); }
    }
    function reward(e) {
      const r = e && e.getBoundingClientRect ? e.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, cols = ['#ffd23f', '#ff6fae', '#5fd3ff', '#7ee35a', '#b598ff'];
      for (let k = 0; k < 14; k++) { const sp = el('i', 'spark'); const a = k / 14 * Math.PI * 2, d = 50 + Math.random() * 50; sp.style.left = cx + 'px'; sp.style.top = cy + 'px'; sp.style.background = cols[k % cols.length]; sp.style.setProperty('--sx', Math.cos(a) * d + 'px'); sp.style.setProperty('--sy', Math.sin(a) * d + 'px'); layer.appendChild(sp); setTimeout(() => sp.remove(), 800); }
      const st = el('i', 'flystar', '⭐'); st.style.left = cx - 17 + 'px'; st.style.top = cy - 17 + 'px'; layer.appendChild(st);
      const box = layer.querySelector('.starbox').getBoundingClientRect();
      requestAnimationFrame(() => { st.style.transform = `translate(${box.left + 10 - cx}px, ${box.top - cy}px) scale(.6)`; st.style.opacity = '.3'; });
      setTimeout(() => { st.remove(); stars++; starEl.textContent = stars; SFX.coin(); }, 800);
      const lines = [['Yay!', 'Hoan hô!'], ['Great!', 'Giỏi quá!'], ['Wow!', 'Oa!'], ['Clever!', 'Thông minh!'], ['Yes!', 'Đúng rồi!']];
      const l = lines[Math.floor(Math.random() * lines.length)]; mascot('cheer', T(l[0], l[1]));
    }
    function finish(won, extra = {}) {
      if (closed) return; closed = true; current = null;
      cleanups.forEach(f => { try { f(); } catch (e) { } });
      layer.classList.add('out'); setTimeout(() => layer.remove(), 300);
      Music.play(prevMusic || 'field');
      resolve(Object.assign({ won }, extra));
    }
    current = { close: finish };
    layer.querySelector('.gl-x').onclick = () => { SFX.tap(); finish(false); };
    layer.querySelector('.gl-how').onclick = () => { SFX.tap(); const pm = Music.key; openHowTo(id, { onClose: () => Music.play(pm) }); };
    Promise.resolve(def.run(api)).catch(e => { console.error(e); finish(false); });
  });
}

export function burstConfetti(parent) {
  const cols = ['#ff4f9a', '#ffd23f', '#3cc7e8', '#a66bff', '#5fd39a', '#ff9f43'];
  for (let i = 0; i < 60; i++) {
    const p = el('i', 'confetti'); p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % cols.length];
    p.style.animationDelay = Math.random() * .6 + 's'; p.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
    parent.appendChild(p); setTimeout(() => p.remove(), 3200);
  }
}

// Helper: wait for one of the given elements to be tapped. Returns the element.
export function tapOne(els) {
  return new Promise(res => {
    const h = e => { els.forEach(x => x.removeEventListener('click', h)); res(e.currentTarget); };
    els.forEach(x => x.addEventListener('click', h));
  });
}
// Keep asking until the right one is tapped. check(el) -> boolean.
export async function untilRight(api, els, check) {
  for (;;) {
    const e = await tapOne(els);
    if (api.closed) return null;
    if (check(e)) { api.right(e); return e; }
    api.wrong(e);
  }
}
export function choiceButtons(api, items, render, cls = 'choice') {
  const row = el('div', 'choices');
  const els = items.map(it => { const b = el('button', cls); b.innerHTML = render(it); b._v = it; row.appendChild(b); return b; });
  api.stage.appendChild(row);
  return els;
}
