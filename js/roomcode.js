// Room codes for children who can't read numbers yet, and for grown-ups in a hurry.
// The code is always the same 4 digits; it can also be shown and typed as 4 animal pictures (0 = dog … 9 = fish),
// or scanned as a QR code (a link to the game with ?room=1234, which knocks on that room straight away).
// Nothing here changes who can come in: a newcomer still knocks, and the room's starter lets them in (net.js).
import qrcode from '../vendor/qrcode.js';
import { pic } from './art.js';
import { T } from './i18n.js';

export const ANIMALS = ['🐶', '🐱', '🐰', '🐻', '🐸', '🐵', '🦆', '🐘', '🐢', '🐟'];
export const ANIMAL_NAMES = [['dog', 'chó'], ['cat', 'mèo'], ['bunny', 'thỏ'], ['bear', 'gấu'], ['frog', 'ếch'], ['monkey', 'khỉ'], ['duck', 'vịt'], ['elephant', 'voi'], ['turtle', 'rùa'], ['fish', 'cá']];
export const animalSay = code => [...String(code)].map(d => T(...ANIMAL_NAMES[+d])).join(', ');
export const okRoom = c => /^\d{4}$/.test(String(c || ''));
export const roomURL = code => location.origin + location.pathname + '?room=' + code;
export function qrSVG(code) {
  try { const q = qrcode(0, 'M'); q.addData(roomURL(code)); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) { return ''; }
}
// the code as digits with an animal under each one, and a button that shows the QR code
export const codeHTML = code => `<div class="rcode"><div class="rdigits" aria-label="${T('Room code', 'Mã phòng')} ${code}">${[...String(code)].map(d => `<span class="rd"><b>${d}</b>${pic(ANIMALS[+d], 'ranimal')}</span>`).join('')}</div>
  <button class="btn rqrb" type="button">▦ ${T('Show the QR code', 'Hiện mã QR')}</button><div class="rqr" hidden>${qrSVG(code)}<small>${T('Scan with the other phone’s camera to knock on this room', 'Quét bằng camera máy kia để gõ cửa phòng này')}</small></div></div>`;
export function bindCode(root) {
  root.querySelectorAll('.rqrb').forEach(b => b.onclick = () => { const q = b.nextElementSibling; q.hidden = !q.hidden; b.classList.toggle('on', !q.hidden); });
}
// the join pad: numbers, or animal pictures (the choice is remembered on the device)
export function padHTML(animals) {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'back', 0, 'ok'];
  return `<div class="padmode"><button type="button" class="btn ${animals ? '' : 'on'}" data-mode="num">123</button><button type="button" class="btn ${animals ? 'on' : ''}" data-mode="ani">${pic('🐶', 'ranimal')} ${T('Animals', 'Con vật')}</button></div>
    <div class="codebox"></div>
    <div class="numpad${animals ? ' ani' : ''}">${keys.map(k => k === 'back' ? `<button data-v="back" aria-label="${T('Delete', 'Xóa')}">⌫</button>` : k === 'ok' ? `<button data-v="ok" aria-label="OK">✓</button>` : `<button data-v="${k}" aria-label="${animals ? T(...ANIMAL_NAMES[k]) : k}">${animals ? pic(ANIMALS[k], 'ranimal') : k}</button>`).join('')}</div>`;
}
export const boxHTML = (code, animals) => [0, 1, 2, 3].map(i => i < code.length ? `<span class="cb">${animals ? pic(ANIMALS[+code[i]], 'ranimal') : code[i]}</span>` : '<span class="cb empty">_</span>').join('');
