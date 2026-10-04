// Pop-ups shared by every screen: windows (modal), the villagers' speech box (dialog), the reward pop-up and confetti.
// Moved out of ui.js and fun.js in architecture step 2, so files that only need to show a speech box or a reward
// (regions.js, snacks.js, fun.js…) no longer import the whole of ui.js, which imported them back (import circles).
// It imports only lower layers: words, voice, sound, settings, pictures and small helpers.
import { T, nm } from './i18n.js';
import { say, setSpeaker } from './voice.js';
import { SFX } from './audio.js';
import { settings } from './state.js';
import { labelArt } from './art.js';
import { el, esc, pick } from './util.js';

// ---------- confetti ----------
const COLORS = ['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a', '#ff9f43', '#a66bff'];
export function confetti(rect, n = 60) {
  if (settings.calm) n = 16;
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
  document.body.appendChild(m); requestAnimationFrame(() => floatEnds(m.querySelector('.card')));
  m.close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 200); };
  return m;
}

// ---------- NPC dialogue (BotW-style box with a name tag) ----------
// main.js fills these in so villagers' speech boxes get a "💬 Chat" button
export const dialogHooks = {};
export function dialog(name, lines, choices) {
  return new Promise(res => {
    const little = dialogHooks.little && dialogHooks.little();
    const d = el('div', 'dialog' + (little ? ' little' : ''), `<div class="dname">${esc(nm(name))}</div><div class="dtext"></div><div class="dchoices"></div><div class="dnext">▼</div>${little ? `<div class="dpics"><button class="dpic again" aria-label="${T('Hear it again', 'Nghe lại')}">🔁</button><button class="dpic ok" aria-label="${T('OK', 'Được')}">👍</button></div>` : ''}`);
    if (dialogHooks.canChat && dialogHooks.canChat(name)) {
      const ask = el('button', 'dask', '💬 ' + T('Chat', 'Trò chuyện')); d.appendChild(ask);
      ask.onclick = e => { e.stopPropagation(); SFX.tap(); close(-1); dialogHooks.chat(name); };
    }
    document.body.appendChild(d);
    let i = 0;
    const text = d.querySelector('.dtext'), ch = d.querySelector('.dchoices'), next = d.querySelector('.dnext');
    let show = () => {
      const [en, vi] = lines[i]; text.textContent = T(en, vi); setSpeaker(name); say(en, vi);
      const last = i === lines.length - 1;
      ch.innerHTML = ''; next.hidden = last && choices && choices.length;
      if (last && choices && choices.length) choices.forEach((c, k) => { const b = el('button', 'dch', labelArt(T(c[0], c[1]), esc)); b.onclick = e => { e.stopPropagation(); SFX.tap(); close(k); }; ch.appendChild(b); });
    };
    let closed = false;
    const close = k => { if (closed) return; closed = true; setSpeaker(null); d.classList.add('out'); setTimeout(() => d.remove(), 200); res(k); };
    // walking away closes the conversation by itself
    d._autoClose = () => close(-1); d._from = dialogHooks.where ? dialogHooks.where() : null;
    d.onclick = () => { if (choices && i === lines.length - 1 && choices.length) return; SFX.tap(); if (i < lines.length - 1) { i++; show(); } else close(-1); };
    if (little) {
      d.querySelector('.again').onclick = e => { e.stopPropagation(); SFX.tap(); const [en, vi] = lines[i]; setSpeaker(name); say(en, vi); };
      const ok = d.querySelector('.ok'); ok.onclick = e => { e.stopPropagation(); d.onclick(); };
      const upd = () => { ok.hidden = !!(choices && choices.length && i === lines.length - 1); }; const s0 = show; show = () => { s0(); upd(); };
    }
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

