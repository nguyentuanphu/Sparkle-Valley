// The recorded voices getting ready: a small, quiet note at the bottom of the screen while the voice pack downloads
// to the device ("Getting the voices ready… 45%" with a thin bar), "Voices ready" for a moment when it is done, and
// "waiting for the internet" if it stops. Once the pack is on the device a start shows nothing (round O, owner: it
// looked as if the voices loaded every time); it says when this address can't keep the voices or no recorded voices
// were found.
// Never in the way: it can't be tapped, sits between the joystick and the buttons, and fades when idle.
import { T } from './i18n.js';
import { onPackProgress, allowMobilePack } from './voice.js';

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
    if (e.state === 'ask') { ask(e.mb); return; }
    if (e.state === 'loading') show(T('Getting the voices ready…', 'Đang tải giọng đọc…') + ' ' + Math.floor(e.done / e.total * 100) + '%', e.done / e.total * 100);
    else if (e.state === 'ready' && e.known) { /* already on the device from an earlier start: nothing to say (round O) */ }
    else if (e.state === 'ready') { show(T('Voices ready', 'Giọng đọc đã sẵn sàng') + ' ✓' + (e.total ? ` (${e.total.toLocaleString()})` : ''), 100); hide(e.quiet ? 2500 : 3000); }
    else if (e.state === 'nostore') { show(T('Voices play from the internet here: this address can’t keep them on the device (use the https website to keep them)', 'Ở địa chỉ này giọng đọc phát qua mạng, không lưu được trên máy (dùng trang https để lưu)'), null); hide(8000); }
    else if (e.state === 'nopack') { show(T('No recorded voices found: the device’s own voice is used', 'Không tìm thấy giọng đọc ghi sẵn: dùng giọng của máy'), null); hide(8000); }
    else if (e.state === 'waiting') { show(T('Voices will finish when the internet is back', 'Giọng đọc sẽ tải tiếp khi có mạng'), null); hide(6000); }
  });
}

// (round R item 12, owner 10 Oct: "wifi should automatically, ask user to allow download over mobile") the core voices
// are on the device; on mobile data the rest waits for a grown-up: a small card asks, and Yes needs a press and hold so
// a little one can't say yes by accident. Not now asks again in a week; Grown-ups → voices can change it any time.
let card = null;
function ask(mb) {
  if (card) return;
  card = document.createElement('div'); card.className = 'packask'; card.setAttribute('role', 'dialog');
  card.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 76px);transform:translateX(-50%);z-index:70;width:min(360px,calc(100% - 32px));box-sizing:border-box;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.96);box-shadow:0 6px 24px rgba(60,30,90,.25);color:#3a2a20;font:600 14px/1.35 var(--font);text-align:center';
  const p = document.createElement('p'); p.style.margin = '0 0 10px';
  p.textContent = T(`Download the rest of the voices on mobile data? About ${mb} MB. On Wi-Fi they download by themselves.`, `Tải phần giọng đọc còn lại bằng dữ liệu di động? Khoảng ${mb} MB. Khi có Wi-Fi giọng đọc tự tải.`);
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap';
  const btn = (text, bg) => { const b = document.createElement('button'); b.type = 'button'; b.style.cssText = `position:relative;overflow:hidden;min-height:48px;min-width:120px;flex:1 1 130px;padding:6px 12px;border:0;border-radius:12px;font:700 14px/1.2 var(--font);color:#fff;background:${bg};touch-action:none`; b.innerHTML = '<span style="position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(255,255,255,.35)"></span><span style="position:relative"></span>'; b.lastChild.textContent = text; return b; };
  const yes = btn(T('Grown-ups: hold for Yes', 'Người lớn: giữ để đồng ý'), 'var(--purple, #8a5cf6)'), no = btn(T('Not now', 'Để sau'), '#9a8aa8');
  const fill = yes.firstChild; let t = 0;
  const stop = () => { clearTimeout(t); fill.style.transition = 'none'; fill.style.width = '0'; };
  yes.addEventListener('pointerdown', ev => { ev.preventDefault(); fill.style.transition = 'width 1.2s linear'; fill.style.width = '100%'; t = setTimeout(() => { close(); allowMobilePack(true); }, 1200); });
  for (const k of ['pointerup', 'pointerleave', 'pointercancel']) yes.addEventListener(k, stop);
  yes.addEventListener('contextmenu', ev => ev.preventDefault());
  no.onclick = () => { close(); allowMobilePack(false); };
  row.append(yes, no); card.append(p, row); document.body.appendChild(card);
}
const close = () => { if (card) { card.remove(); card = null; } };
