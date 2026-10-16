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
  const quest = anchor?.closest('.hud')?.querySelector('.quest');
  const m = document.createElement('div'); m.className = 'audio-tray soundsheet'; m.setAttribute('role', 'group'); m.setAttribute('aria-label', T('Audio', 'Âm thanh'));
  m.innerHTML = SWITCHES.map(([k, icon, name]) => `<button class="ss-sw" data-k="${k}" aria-label="${T(...name)}"><span>${pic(icon)}</span><b>${T(...name)}</b><i></i></button>`).join('');
  dispatchEvent(new Event('sv-hide-caption')); document.body.appendChild(m);
  // (r79 A5, owner 16 Oct: the three opened to the LEFT of the speaker, not lined up) they open in one row directly UNDER
  // the speaker and the chat button beside it, right-aligned with them; only when there is no room below do they go above
  const rowOf = () => { const r = anchor?.getBoundingClientRect(); if (!r) return null;
    const mates = [...(anchor.parentElement?.querySelectorAll(':scope > .dk') || [])].filter(b => b !== anchor && !b.hidden && b.getClientRects().length).map(b => b.getBoundingClientRect()).filter(b => Math.abs(b.top - r.top) < 8 && Math.min(Math.abs(b.left - r.right), Math.abs(r.left - b.right)) < 24);
    return mates.reduce((u, b) => ({ left: Math.min(u.left, b.left), right: Math.max(u.right, b.right), top: Math.min(u.top, b.top), bottom: Math.max(u.bottom, b.bottom) }), { left: r.left, right: r.right, top: r.top, bottom: r.bottom }); };
  const place = () => {
    const v=visualViewport, y=v?.offsetTop||0, x=v?.offsetLeft||0, h=v?.height||innerHeight, w=v?.width||innerWidth, r=rowOf();
    m.style.right='auto'; m.style.width='max-content'; m.style.maxHeight=Math.max(44,h-24)+'px'; m.style.maxWidth=Math.max(44,w-24)+'px';
    const below = !r || r.bottom + 8 + m.offsetHeight <= y + h - 12;
    const top = r ? below ? r.bottom + 4 : r.top - m.offsetHeight - 4 : y+100;
    // (the switches' round faces, not their wider tap areas, line up with the buttons' right edge)
    const last = m.querySelector('.ss-sw:last-child > span'), inset = last ? m.getBoundingClientRect().right - last.getBoundingClientRect().right : 0;
    const left = r ? r.right - m.offsetWidth + inset : x+w-m.offsetWidth-12;
    let placedTop=Math.max(y+4,Math.min(y+h-m.offsetHeight-4,top));
    const placedLeft=Math.max(x+4,Math.min(x+w-m.offsetWidth+inset-4,left)), q=quest && !quest.hidden ? quest.getBoundingClientRect() : null;
    if(q && placedLeft < q.right+8 && placedLeft+m.offsetWidth > q.left-8 && placedTop < q.bottom+8 && placedTop+m.offsetHeight > q.top-8) {
      placedTop=q.bottom+8+m.offsetHeight <= y+h-12 ? q.bottom+8 : Math.max(y+12,q.top-m.offsetHeight-8);
    }
    m.style.top=placedTop+'px'; m.style.left=placedLeft+'px';
  };
  place();
  const sizeWatch = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (m.isConnected) place(); }) : null; sizeWatch?.observe(m); if (quest) sizeWatch?.observe(quest);
  document.fonts?.ready.then(() => { if (m.isConnected) place(); });
  const paint = () => { m.querySelectorAll('.ss-sw').forEach(b => { const on = !!settings[b.dataset.k]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.querySelector('i').textContent = on ? T('On', 'Bật') : T('Off', 'Tắt'); b.title=b.getAttribute('aria-label')+' · '+b.querySelector('i').textContent; }); place(); };
  m.querySelectorAll('.ss-sw').forEach(b => b.onclick = () => { G.setAudio(b.dataset.k, !settings[b.dataset.k]); if (settings.sound) SFX.tap(); paint(); });
  const outside = e => { if (!m.contains(e.target) && e.target !== anchor && !anchor?.contains(e.target)) close(); };
  const key = e => { if (e.key === 'Escape') { close(); anchor?.focus({ preventScroll: true }); } };
  const close = () => { clearTimeout(bindTimer); sizeWatch?.disconnect(); m.remove(); removeEventListener('pointerdown', outside, true); removeEventListener('keydown', key); removeEventListener('resize',place); visualViewport?.removeEventListener('resize',place);visualViewport?.removeEventListener('scroll',place); anchor?.setAttribute('aria-expanded', 'false'); };
  m.close = close;
  const bindTimer=setTimeout(() => { if(m.isConnected) {addEventListener('pointerdown', outside, true); addEventListener('keydown', key);addEventListener('resize',place);visualViewport?.addEventListener('resize',place);visualViewport?.addEventListener('scroll',place);} }, 0); anchor?.setAttribute('aria-expanded', 'true'); paint(); return m;
}
