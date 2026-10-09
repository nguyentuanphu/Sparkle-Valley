// A panel of big controls at the bottom of the child's own half (round R, owner 9 Oct: "more doing, less watching"):
// big buttons to tap or hold and tall handles to drag, sized for a 4-year-old. Used by the yard (js/yard.js) and the
// story (js/lanterns.js). data-hp on each control names it (the checks press them like a child would).
export const pad = html => { const d = document.createElement('div'); d.className = 'handpad'; d.innerHTML = `<div class="hp-in">${html}</div>`; document.body.appendChild(d); return d; };
// run fn(dt) every frame until it returns true
export const frames = fn => new Promise(res => { let last = performance.now(); const f = now => { const dt = Math.min(.1, (now - last) / 1000); last = now; if (fn(dt)) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
// whether a button is being held down
export const holdable = b => { const st = { down: false }; const on = e => { e.preventDefault(); st.down = true; b.classList.add('on'); }, off = () => { st.down = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off); return st; };
// a handle in a tall slot: v goes from 0 (top) to 1 (bottom) as it is dragged
export const slot = el => { const st = { v: 0, dragging: false }; const at = e => { const r = el.getBoundingClientRect(); st.v = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); el.style.setProperty('--v', st.v); };
  el.addEventListener('pointerdown', e => { e.preventDefault(); st.dragging = true; try { el.setPointerCapture(e.pointerId); } catch (x) { } at(e); });
  el.addEventListener('pointermove', e => { if (st.dragging) at(e); }); el.addEventListener('pointerup', () => { st.dragging = false; }); el.addEventListener('pointercancel', () => { st.dragging = false; }); return st; };
