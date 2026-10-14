// (Round U, owner 11 Oct: "there are no sounds and voices option to turn on and off") Three big switches, the same on
// the Simple screen and in the valley (the dock's Sound button): music, sound effects and the talking voice, each on its
// own. The keyboard keys N and O still flip music and all sound at once.
import { T } from './i18n.js';
import { pic } from './art.js';
import { settings } from './state.js';
import { SFX } from './audio.js';

const SWITCHES = [['music', '🎵', ['Music', 'Nhạc']], ['sound', '🔔', ['Sounds', 'Âm thanh']], ['voice', '🗣️', ['Voice', 'Giọng nói']]];
export function openSoundSheet(G, anchor) {
  const existing = document.querySelector('.audio-tray'); if (existing) { existing.close(); return; }
  document.querySelectorAll('.zoomer.open').forEach(x => { x.classList.remove('open'); x.querySelector('.z-tray')?.setAttribute('aria-expanded', 'false'); });
  const m = document.createElement('div'); m.className = 'audio-tray soundsheet'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', T('Audio', 'Âm thanh'));
  m.innerHTML = SWITCHES.map(([k, icon, name]) => `<button class="ss-sw" data-k="${k}"><span>${pic(icon)}</span><b>${T(...name)}</b><i></i></button>`).join('') + `<button class="ss-songs">${pic('🎵')} ${T('Songs','Bài hát')}</button><button class="ss-done">${T('Done', 'Xong')}</button>`;
  dispatchEvent(new Event('sv-hide-caption')); document.body.appendChild(m);
  const place = () => { const v=visualViewport, y=v?.offsetTop||0, x=v?.offsetLeft||0, h=v?.height||innerHeight, w=v?.width||innerWidth; const r=anchor?.getBoundingClientRect(); m.style.maxHeight=Math.max(44,h-24)+'px'; m.style.maxWidth=Math.max(44,w-24)+'px'; m.style.top=Math.max(y+12,Math.min(y+h-m.offsetHeight-12,r?r.bottom+8:y+100))+'px'; m.style.left=Math.max(x+12,Math.min(x+w-m.offsetWidth-12,r?r.left:x+w-m.offsetWidth-12))+'px'; m.style.right='auto'; };
  place();
  const paint = () => m.querySelectorAll('.ss-sw').forEach(b => { const on = !!settings[b.dataset.k]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.querySelector('i').textContent = on ? T('On', 'Bật') : T('Off', 'Tắt'); });
  m.querySelectorAll('.ss-sw').forEach(b => b.onclick = () => { G.setAudio(b.dataset.k, !settings[b.dataset.k]); if (settings.sound) SFX.tap(); paint(); });
  const outside = e => { if (!m.contains(e.target) && e.target !== anchor && !anchor?.contains(e.target)) close(); };
  const key = e => { if (e.key === 'Escape') close(); };
  const close = () => { clearTimeout(bindTimer); m.remove(); removeEventListener('pointerdown', outside, true); removeEventListener('keydown', key); removeEventListener('resize',place); visualViewport?.removeEventListener('resize',place); anchor?.setAttribute('aria-expanded', 'false'); };
  m.querySelector('.ss-done').onclick = close; m.close = close;
  m.querySelector('.ss-songs').onclick=()=>{close();G.openSongs?.();};
  const bindTimer=setTimeout(() => { if(m.isConnected) {addEventListener('pointerdown', outside, true); addEventListener('keydown', key);addEventListener('resize',place);visualViewport?.addEventListener('resize',place);} }, 0); anchor?.setAttribute('aria-expanded', 'true'); paint(); return m;
}
