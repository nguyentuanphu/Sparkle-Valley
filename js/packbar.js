// The recorded voices getting ready: a small, quiet note at the bottom of the screen while the voice pack downloads
// to the device ("Getting the voices ready… 45%" with a thin bar), "Voices ready" for a moment when it is done, and
// "waiting for the internet" if it stops. Nothing shows when everything is already on the device.
// Never in the way: it can't be tapped, sits between the joystick and the buttons, and fades when idle.
import { T } from './i18n.js';
import { onPackProgress } from './voice.js';

let box = null, hideT = 0;
const show = (text, pct) => {
  if (!box) { box = document.createElement('div'); box.className = 'packbar'; box.setAttribute('role', 'status'); box.innerHTML = '<span></span><i><b></b></i>'; document.body.appendChild(box); }
  clearTimeout(hideT); box.classList.remove('out');
  box.querySelector('span').textContent = text;
  box.querySelector('i').style.display = pct == null ? 'none' : '';
  if (pct != null) box.querySelector('b').style.width = Math.max(3, Math.min(100, pct)) + '%';
};
const hide = (after = 0) => { clearTimeout(hideT); hideT = setTimeout(() => { if (box) box.classList.add('out'); }, after); };

export function startPackBar() {
  onPackProgress(e => {
    if (e.state === 'loading') show(T('Getting the voices ready…', 'Đang tải giọng đọc…') + ' ' + Math.floor(e.done / e.total * 100) + '%', e.done / e.total * 100);
    else if (e.state === 'ready') { if (e.quiet) { if (box) hide(); return; } show(T('Voices ready', 'Giọng đọc đã sẵn sàng') + ' ✓', 100); hide(3000); }
    else if (e.state === 'waiting') { show(T('Voices will finish when the internet is back', 'Giọng đọc sẽ tải tiếp khi có mạng'), null); hide(6000); }
  });
}
