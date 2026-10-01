// A shared frame for every mini-game: the full-screen layer, the title bar, progress dots,
// gentle feedback (no losing — mistakes just say "try again") and the win celebration.
import { T } from '../i18n.js';
import { say } from '../voice.js';
import { SFX, Music } from '../audio.js';
import { el, wait, esc } from '../util.js';

export const GAMES = {};
export const register = def => { GAMES[def.id] = def; };

let current = null;
export const gameOpen = () => !!current;

// players: array of profiles (1 or 2); level: 1..5; style: 'shrine' | 'village'
export function openGame(id, { players, level = 1, style = 'shrine', partnerName = null }) {
  const def = GAMES[id]; if (!def) return Promise.resolve({ won: false });
  if (current) current.close(false);
  return new Promise(resolve => {
    const layer = el('div', 'gl gl-' + style);
    layer.innerHTML = `
      <div class="gl-head">
        <button class="gl-x" aria-label="${T('Leave', 'Rời đi')}">✕</button>
        <div class="gl-title"><span class="gl-icon">${def.icon}</span><span>${esc(def.name())}</span></div>
        <div class="gl-dots"></div>
      </div>
      <div class="gl-help"></div>
      <div class="gl-stage"></div>`;
    document.body.appendChild(layer);
    const stage = layer.querySelector('.gl-stage'), dots = layer.querySelector('.gl-dots'), help = layer.querySelector('.gl-help');
    const cleanups = [];
    let closed = false;
    const prevMusic = Music.key; Music.play('game');
    const api = {
      stage, level, players, two: players.length > 1, partnerName, T, el,
      say: (en, vi) => { help.textContent = T(en, vi); say(en, vi); },
      // Show text without speaking it.
      show: (en, vi) => { help.textContent = T(en, vi); },
      sfx: SFX, wait,
      onCleanup: f => cleanups.push(f),
      dots(n, done) { dots.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join(''); },
      right(e) { SFX.ok(); if (e) { e.classList.remove('wrong'); e.classList.add('right'); } },
      wrong(e, en = 'Try again!', vi = 'Thử lại nhé!') { SFX.no(); if (e) { e.classList.remove('wrong'); void e.offsetWidth; e.classList.add('wrong'); } say(en, vi); },
      praise() { const p = [['Great job!', 'Giỏi quá!'], ['Well done!', 'Làm tốt lắm!'], ['Yes! Clever!', 'Đúng rồi! Thông minh quá!'], ['Super!', 'Tuyệt vời!'], ['You got it!', 'Con làm được rồi!']]; const [e, v] = p[Math.floor(Math.random() * p.length)]; say(e, v); },
      get closed() { return closed; },
      async win(extra = {}) {
        if (closed) return;
        SFX.fanfare();
        const c = el('div', 'gl-win', `<div class="gl-win-star">🌟</div><p>${esc(extra.title || T('You did it!', 'Con làm được rồi!'))}</p>`);
        layer.appendChild(c); say(extra.title || 'You did it!', extra.titleVi || 'Con làm được rồi!');
        burstConfetti(layer);
        await wait(2400); finish(true, extra);
      }
    };
    function finish(won, extra = {}) {
      if (closed) return; closed = true; current = null;
      cleanups.forEach(f => { try { f(); } catch (e) { } });
      layer.classList.add('out'); setTimeout(() => layer.remove(), 300);
      Music.play(prevMusic || 'field');
      resolve(Object.assign({ won }, extra));
    }
    current = { close: finish };
    layer.querySelector('.gl-x').onclick = () => { SFX.tap(); finish(false); };
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
