// Three discreet Audio icons, like the camera pop-out: background music, effects and recorded voice.
// Each switch is independent; bilingual accessible labels describe the icon and its current state.
import { T } from './i18n.js';
import { pic } from './art.js';
import { settings } from './state.js';
import { SFX } from './audio.js';

const SWITCHES = [['music', '🎵', ['Music', 'Nhạc']], ['sound', '🔔', ['Sounds', 'Âm thanh']], ['voice', '🗣️', ['Voice', 'Giọng nói']]];
export function openSoundSheet(G, anchor) {
  const existing = document.querySelector('.audio-tray'); if (existing) { existing.close(); return; }
  document.querySelectorAll('.zoomer.open').forEach(x => { x.classList.remove('open'); x.querySelector('.z-tray')?.setAttribute('aria-expanded', 'false'); });
  const m = document.createElement('div'); m.className = 'audio-tray soundsheet'; m.setAttribute('role', 'group'); m.setAttribute('aria-label', T('Audio', 'Âm thanh'));
  m.innerHTML = SWITCHES.map(([k, icon, name]) => `<button class="ss-sw" data-k="${k}" aria-label="${T(...name)}"><span>${pic(icon)}</span><b>${T(...name)}</b><i></i></button>`).join('');
  dispatchEvent(new Event('sv-hide-caption')); document.body.appendChild(m);
  const place = () => {
    const v=visualViewport, y=v?.offsetTop||0, x=v?.offsetLeft||0, h=v?.height||innerHeight, w=v?.width||innerWidth, r=anchor?.getBoundingClientRect();
    m.style.right='auto'; m.style.width='max-content'; m.style.maxHeight=Math.max(44,h-24)+'px'; m.style.maxWidth=Math.max(44,w-24)+'px';
    const beside = r && r.left - x - 12 >= m.offsetWidth + 8;
    const top = r ? beside ? r.top + (r.height - m.offsetHeight)/2 : r.bottom + 8 : y+100;
    const left = r ? beside ? r.left - m.offsetWidth - 8 : r.left + (r.width - m.offsetWidth)/2 : x+w-m.offsetWidth-12;
    m.style.top=Math.max(y+12,Math.min(y+h-m.offsetHeight-12,top))+'px';
    m.style.left=Math.max(x+12,Math.min(x+w-m.offsetWidth-12,left))+'px';
  };
  place();
  const sizeWatch = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (m.isConnected) place(); }) : null; sizeWatch?.observe(m);
  document.fonts?.ready.then(() => { if (m.isConnected) place(); });
  const paint = () => { m.querySelectorAll('.ss-sw').forEach(b => { const on = !!settings[b.dataset.k]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.querySelector('i').textContent = on ? T('On', 'Bật') : T('Off', 'Tắt'); b.title=b.getAttribute('aria-label')+' · '+b.querySelector('i').textContent; }); place(); };
  m.querySelectorAll('.ss-sw').forEach(b => b.onclick = () => { G.setAudio(b.dataset.k, !settings[b.dataset.k]); if (settings.sound) SFX.tap(); paint(); });
  const outside = e => { if (!m.contains(e.target) && e.target !== anchor && !anchor?.contains(e.target)) close(); };
  const key = e => { if (e.key === 'Escape') { close(); anchor?.focus({ preventScroll: true }); } };
  const close = () => { clearTimeout(bindTimer); sizeWatch?.disconnect(); m.remove(); removeEventListener('pointerdown', outside, true); removeEventListener('keydown', key); removeEventListener('resize',place); visualViewport?.removeEventListener('resize',place);visualViewport?.removeEventListener('scroll',place); anchor?.setAttribute('aria-expanded', 'false'); };
  m.close = close;
  const bindTimer=setTimeout(() => { if(m.isConnected) {addEventListener('pointerdown', outside, true); addEventListener('keydown', key);addEventListener('resize',place);visualViewport?.addEventListener('resize',place);visualViewport?.addEventListener('scroll',place);} }, 0); anchor?.setAttribute('aria-expanded', 'true'); paint(); return m;
}
