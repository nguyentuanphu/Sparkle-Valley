// "Add to Home Screen": one tap on Android / Chrome / Edge (the browser's own install prompt),
// a picture guide on iPhone / iPad (Apple does not let web pages install themselves).
import { T } from './i18n.js';
import { el } from './util.js';

interface InstallPromptEvent extends Event { prompt(): Promise<unknown>; userChoice: Promise<{outcome: string}> }
declare global { interface WindowEventMap { beforeinstallprompt: InstallPromptEvent } }
let deferred: InstallPromptEvent | null = null;
const listeners: (() => void)[] = [];
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; listeners.forEach(f => f()); });
window.addEventListener('appinstalled', () => { deferred = null; try { localStorage.setItem('sv-installed', '1'); } catch (e) { } listeners.forEach(f => f()); });

const ua = navigator.userAgent;
const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(ua);

export const isInstalled = () => navigator.standalone === true || ['fullscreen', 'standalone', 'minimal-ui'].some(m => matchMedia(`(display-mode: ${m})`).matches);
export const canOfferInstall = () => !isInstalled() && location.protocol.startsWith('http');
export const onInstallChange = f => listeners.push(f);

const SHARE_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>`;
const PLUS_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>`;
const DOTS_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="#333"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;

function guide() {
  const steps = isIOS ? [
    [SHARE_SVG, T('Tap the Share button', 'Bấm nút Chia sẻ'), T('At the bottom of Safari (top right on iPad).', 'Ở cuối màn hình Safari (góc trên bên phải trên iPad).')],
    [PLUS_SVG, T('Choose “Add to Home Screen”', 'Chọn “Thêm vào MH chính”'), T('Scroll down the list if you can’t see it.', 'Kéo danh sách xuống nếu chưa thấy.')],
    ['<b style="font-size:20px;color:#1a73e8">Add</b>', T('Tap “Add”', 'Bấm “Thêm”'), T('Sparkle Valley appears on your home screen and works offline.', 'Thung Lũng Lấp Lánh sẽ có trên màn hình chính và chơi được khi không có mạng.')]
  ] : isAndroid ? [
    [DOTS_SVG, T('Tap the ⋮ menu', 'Bấm menu ⋮'), T('Top right of the browser.', 'Góc trên bên phải trình duyệt.')],
    [PLUS_SVG, T('Choose “Install app” or “Add to Home screen”', 'Chọn “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”'), ''],
    ['<b style="font-size:20px;color:#1a73e8">OK</b>', T('Tap “Install”', 'Bấm “Cài đặt”'), T('Then open it from your home screen.', 'Rồi mở từ màn hình chính.')]
  ] : [
    [PLUS_SVG, T('Click the install icon', 'Bấm biểu tượng cài đặt'), T('In the address bar (Chrome / Edge), or the browser menu → “Install Sparkle Valley”.', 'Trên thanh địa chỉ (Chrome / Edge), hoặc menu trình duyệt → “Cài đặt Sparkle Valley”.')],
    ['<b style="font-size:20px;color:#1a73e8">OK</b>', T('Click “Install”', 'Bấm “Cài đặt”'), T('It opens in its own window and works offline.', 'Trò chơi mở trong cửa sổ riêng và chơi được khi không có mạng.')]
  ];
  const m = el('div', 'modal installguide', `<div class="card">
    <h2>${T('Put Sparkle Valley on your home screen', 'Đưa Thung Lũng Lấp Lánh ra màn hình chính')}</h2>
    <p class="ig-why">${T('Full screen, no browser bars, starts with one tap — even with no internet.', 'Toàn màn hình, không có thanh trình duyệt, một chạm là chơi — kể cả khi không có mạng.')}</p>
    <ol class="ig-steps">${steps.map(([icon, h, p], i) => `<li><span class="ig-n">${i + 1}</span><span class="ig-ic">${icon}</span><span><b>${h}</b>${p ? `<small>${p}</small>` : ''}</span></li>`).join('')}</ol>
    ${isIOS ? `<div class="ig-arrow" aria-hidden="true">↓</div>` : ''}
    <button class="btn primary wide big ig-ok">${T('Got it', 'Đã hiểu')}</button></div>`);
  document.body.appendChild(m);
  const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 200); };
  m.querySelector('.ig-ok').onclick = close;
  m.addEventListener('click', e => { if (e.target === m) close(); });
}

// Native prompt when the browser offers one, otherwise the picture guide.
export async function installApp() {
  if (deferred) {
    const d = deferred; deferred = null;
    try { d.prompt(); const r = await d.userChoice; if (r && r.outcome === 'accepted') localStorage.setItem('sv-installed', '1'); } catch (e) { guide(); }
    listeners.forEach(f => f());
    return;
  }
  guide();
}

// One listener for every install button. Closed windows and replaced title cards must not stay reachable.
const installButtons = new Set<WeakRef<HTMLButtonElement>>();
function updateInstallButtons() {
  const installed = isInstalled();
  for (const ref of installButtons) {
    const button = ref.deref();
    if (!button || !button.isConnected) { installButtons.delete(ref); continue; }
    if (installed) { button.remove(); installButtons.delete(ref); }
  }
}
onInstallChange(updateInstallButtons);

// A small chip for the title screen and the grown-ups page.
export function installButton(cls = 'installchip'): HTMLButtonElement | null {
  if (!canOfferInstall()) return null;
  const b: HTMLButtonElement = el('button', cls, `<span aria-hidden="true">📲</span> ${T('Add to Home Screen', 'Thêm vào màn hình chính')}`);
  b.onclick = e => { e.stopPropagation(); installApp(); };
  updateInstallButtons();
  installButtons.add(new WeakRef(b));
  return b;
}
