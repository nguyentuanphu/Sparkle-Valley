// Paint the Welcome shell before importing the world. Keep recovery reachable even if an import fails.
const shell = document.getElementById('boot');
const words = [
  ['Welcome to Sparkle Valley', 'Chào mừng đến Thung Lũng Lấp Lánh'],
  ['Opening the game…', 'Đang mở trò chơi…'],
  ['The game could not finish loading. Check your connection and try again.', 'Trò chơi chưa tải xong. Kiểm tra kết nối rồi thử lại nhé.'],
  ['Try again', 'Thử lại'],
  ['A new update is available. Your progress stays saved.', 'Có bản cập nhật mới. Tiến trình của con vẫn được lưu.'],
  ['Update now', 'Cập nhật']
];
let lang = 'en'; try { lang = JSON.parse(localStorage.getItem('sv2_settings') || '{}').lang === 'vi' ? 'vi' : 'en'; } catch {}
const text = words.map(pair => pair[lang === 'vi' ? 1 : 0]);
shell.querySelector('h1').textContent = text[0]; shell.querySelector('p').textContent = text[1];
window.svLaunchProgress = (value, total, label) => {
  let meter = document.querySelector('.launch-progress');
  if (!meter) { meter = document.createElement('div'); meter.className = 'launch-progress'; meter.innerHTML = '<progress></progress><span role="status"></span>'; (document.querySelector('.who-body, .screen.title, .who-card, .bootwait') || shell).appendChild(meter); }
  meter.querySelector('progress').max = total; meter.querySelector('progress').value = value;
  meter.querySelector('span').textContent = label;
  if (value >= total) meter.remove();
};
window.svOfferUpdate = () => {
  if (document.querySelector('.update-notice')) return;
  const n = document.createElement('aside'); n.className = 'update-notice'; n.setAttribute('role', 'status');
  const label = document.createElement('span'); label.textContent = text[4];
  const button = document.createElement('button'); button.textContent = text[5];
  button.onclick = async () => { const g = window.__sv; if (g?.heroes.length && (g.paused || document.querySelector('.gl, .dialog, .storybook, .theatre'))) { label.textContent = lang === 'vi' ? 'Đóng hoạt động trước khi cập nhật nhé.' : 'Close the activity before updating.'; return; } g?.save?.(); const reg = await navigator.serviceWorker?.getRegistration(); if (reg?.waiting) { navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true }); reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } else location.reload(); };
  const close = document.createElement('button'); close.textContent = '×'; close.setAttribute('aria-label', lang === 'vi' ? 'Để sau' : 'Later'); close.onclick = () => n.remove();
  n.append(label, button, close); document.body.appendChild(n);
};
// Begin saving the shell and assets while the world builds, rather than waiting for it to finish.
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !/localhost|127\.0\.0\.1/.test(location.hostname)) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    if (reg.waiting) window.svOfferUpdate();
    reg.addEventListener('updatefound', () => { const next = reg.installing; next?.addEventListener('statechange', () => { if (next.state === 'installed' && navigator.serviceWorker.controller) window.svOfferUpdate(); }); });
  }).catch(() => {});
}
addEventListener('unhandledrejection', e => { if (/import.*module|module.*fetch|module script/i.test(String(e.reason?.message || e.reason))) window.svOfferUpdate(); });
await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
try { await import('./main.js'); }
catch (error) {
  console.error(error); document.body.appendChild(shell); shell.hidden = false; shell.querySelector('p').textContent = text[2];
  shell.querySelector('progress').removeAttribute('value'); const retry = document.createElement('button'); retry.textContent = text[3]; retry.onclick = () => location.reload(); shell.appendChild(retry);
}
