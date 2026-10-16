// Pop-ups shared by every screen: windows (modal), the villagers' speech box (dialog), the reward pop-up and confetti.
// Moved out of ui.js and fun.js in architecture step 2, so files that only need to show a speech box or a reward
// (regions.js, snacks.js, fun.js…) no longer import the whole of ui.js, which imported them back (import circles).
// It imports only lower layers: words, voice, sound, settings, pictures and small helpers.
import { T, nm } from './i18n.js';
import { say, setSpeaker } from './voice.js';
import { SFX } from './audio.js';
import { settings, reduceMotion } from './state.js';
import { labelArt } from './art.js';
import { el, esc, pick, clamp } from './util.js';

// ---------- confetti ----------
const COLORS = ['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a', '#ff9f43', '#a66bff'];
export function confetti(rect, n = 60) {
  if (reduceMotion()) n = 16;
  const r = rect || { x: 0, y: 0, w: innerWidth, h: innerHeight };
  const box = el('div', 'confetti'); Object.assign(box.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
  for (let i = 0; i < n; i++) {
    const c = el('i'); const x = Math.random() * 100, d = 1.6 + Math.random() * 1.4, dx = (Math.random() - .5) * 160;
    c.style.cssText = `left:${x}%;background:${pick(COLORS)};animation-duration:${d}s;animation-delay:${Math.random() * .35}s;--dx:${dx}px;--rot:${Math.random() * 900 - 450}deg;${i % 3 ? '' : 'border-radius:50%;'}`;
    box.appendChild(c);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3600);
}

// The Save / Done / Close / Back row at the end of any window floats at the bottom while the page scrolls, and the
// ✕ stays at the top, so they can always be reached without scrolling (this runs for every window, also ones
// drawn again later).
const ENDWORDS = /\b(save|done|close|back|cancel|exit|ok|finish|bye)\b|lưu|xong|đóng|quay lại|hủy|thoát|tạm biệt|💾|✅/i;
function floatEnds(card) {
  const kids = [...card.children].filter(e => !e.hidden && e.offsetParent !== null && !e.classList.contains('x'));
  const last = kids[kids.length - 1]; if (!last) return;
  const isEnd = e => (e.matches('button, .btn, .actions, .bar, .row') && ENDWORDS.test(e.textContent || ''));
  if (isEnd(last) && !last.classList.contains('floatbar')) { if (last.matches('button, .btn')) last.classList.add('floatbtn'); else last.classList.add('actions', 'floatbar'); }
}
const floatWatch = new MutationObserver(list => { const seen = new Set(); for (const r of list) { const c = r.target.closest && r.target.closest('.modal .card'); if (c && !seen.has(c)) { seen.add(c); floatEnds(c); } } });
floatWatch.observe(document.documentElement, { childList: true, subtree: true });
export function modal(cls, html) {
  const m = el('div', 'modal ' + (cls || ''), `<div class="card">${html}</div>`);
  dispatchEvent(new Event('sv-hide-caption')); document.body.appendChild(m); requestAnimationFrame(() => floatEnds(m.querySelector('.card')));
  m.close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 200); };
  return m;
}

// ---------- NPC dialogue (BotW-style box with a name tag) ----------
// main.js fills these in so villagers' speech boxes get a "💬 Chat" button
export const dialogHooks = {};
export function dialog(name, lines, choices) {
  return new Promise(res => {
    const little = dialogHooks.little && dialogHooks.little();
    const d = el('div', 'dialog' + (little ? ' little' : ''), `<div class="dname">${esc(nm(name))}</div><div class="dtext"></div><div class="dchoices"></div><div class="dnext">▼</div>`);
    if (dialogHooks.canChat && dialogHooks.canChat(name)) {
      const ask = el('button', 'dask', '💬 ' + T('Chat', 'Trò chuyện')); d.appendChild(ask);
      ask.onclick = e => { e.stopPropagation(); SFX.tap(); close(-1); dialogHooks.chat(name); };
    }
    document.body.appendChild(d);
    let i = 0;
    const text = d.querySelector('.dtext'), ch = d.querySelector('.dchoices'), next = d.querySelector('.dnext');
    const show = () => {
      // (a line [en, vi, sayEn, sayVi] shows its words but speaks the recordable ones: names can't be recorded)
      const [en, vi, sEn, sVi] = lines[i]; text.textContent = T(en, vi); setSpeaker(name); say(sEn || en, sVi || vi);
      const last = i === lines.length - 1;
      ch.innerHTML = ''; next.hidden = last && choices && choices.length;
      if (last && choices && choices.length) choices.forEach((c, k) => { const b = el('button', 'dch', labelArt(T(c[0], c[1]), esc)); b.onclick = e => { e.stopPropagation(); SFX.tap(); close(k); }; ch.appendChild(b); });
    };
    let closed = false;
    const close = k => { if (closed) return; closed = true; setSpeaker(null); d.classList.add('out'); setTimeout(() => d.remove(), 200); res(k); };
    // walking away closes the conversation by itself
    d._autoClose = () => close(-1); d._from = dialogHooks.where ? dialogHooks.where() : null;
    d.onclick = () => { if (choices && i === lines.length - 1 && choices.length) return; SFX.tap(); if (i < lines.length - 1) { i++; show(); } else close(-1); };
    // (round R, owner: "there shouldn't be any repeats, the child just taps the speech box as OK") no Hear-again or OK
    // buttons, for any age: a tap anywhere on the box is the OK
    show();
  });
}

// ---------- reward pop-up ----------
export function reward(big, line, sub) {
  confetti();
  const r = el('div', 'reward', `<div class="rbig">${big}</div><p>${esc(line)}</p>${sub ? `<small>${esc(sub)}</small>` : ''}`);
  document.body.appendChild(r); SFX.secret();
  return new Promise(res => { const go = () => { r.classList.add('out'); setTimeout(() => { r.remove(); res(); }, 250); }; r.onclick = go; setTimeout(go, 2600); });
}

// ---------- press and hold: the grown-up gate ----------
// (round R privacy, 9 Oct) moved here from ui.js so any window (the real place's map too) can ask a grown-up first
export function holdButton(b, fn) {
  let t = null, start = 0, raf = 0;
  const ring = b.querySelector('.ring');
  const tick = () => { const k = clamp((performance.now() - start) / 1600, 0, 1); ring.style.setProperty('--p', k * 100 + '%'); if (k >= 1) { stop(); fn(); } else raf = requestAnimationFrame(tick); };
  const stop = () => { cancelAnimationFrame(raf); ring.style.setProperty('--p', '0%'); t = null; };
  b.addEventListener('pointerdown', e => { e.preventDefault(); start = performance.now(); t = 1; tick(); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(k => b.addEventListener(k, () => { if (t) stop(); }));
  b.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
}
