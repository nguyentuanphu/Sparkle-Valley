// Paint the Welcome shell before importing the world. Keep recovery reachable even if an import fails.
const shell = document.getElementById('boot');
const words = [
  ['Welcome to Sparkle Valley', 'Chào mừng đến Thung Lũng Lấp Lánh'],
  ['Opening the game…', 'Đang mở trò chơi…'],
  ['The game could not finish loading. Check your connection and try again.', 'Trò chơi chưa tải xong. Kiểm tra kết nối rồi thử lại nhé.'],
  ['Try again', 'Thử lại'],
  ['A new update is available. Your progress stays saved.', 'Có bản cập nhật mới. Tiến trình của con vẫn được lưu.'],
  ['Update now', 'Cập nhật'],
  ['Sparkle Valley is open in another tab or window, so this one has stopped to keep your progress safe.', 'Thung Lũng Lấp Lánh đang mở ở một thẻ hoặc cửa sổ khác, nên thẻ này dừng lại để giữ tiến trình của con.'],
  ['Play here', 'Chơi ở đây']
];
let lang = 'en'; try { lang = JSON.parse(localStorage.getItem('sv2_settings') || '{}').lang === 'vi' ? 'vi' : 'en'; } catch {}
const text = words.map(pair => pair[lang === 'vi' ? 1 : 0]);
shell.querySelector('h1').textContent = text[0]; shell.querySelector('p').textContent = text[1];
window.svLaunchProgress = (value, total, label) => {
  let meter = document.querySelector('.launch-progress');
  if (!meter) { meter = document.createElement('div'); meter.className = 'launch-progress'; meter.innerHTML = '<progress></progress><span role="status"></span>'; (document.querySelector('.screen.title, .bootwait') || shell).appendChild(meter); }
  meter.querySelector('progress').max = total; meter.querySelector('progress').value = value;
  meter.querySelector('span').textContent = label;
  if (value >= total) meter.remove();
};
// (owner point 10) the notice never sits over an activity: it waits while a game, talk, story or film is open (it had
// covered a game's close button), and shows again when the child is back in the valley
const busy = () => { const g = window.__sv; return !!(g?.heroes?.length && (g.paused || document.querySelector('.gl, .dialog, .storybook, .theatre'))); };
window.svOfferUpdate = () => {
  if (document.querySelector('.update-notice')) return;
  const n = document.createElement('aside'); n.className = 'update-notice'; n.setAttribute('role', 'status');
  const label = document.createElement('span'); label.textContent = text[4];
  const button = document.createElement('button'); button.textContent = text[5];
  button.onclick = async () => { const g = window.__sv; if (busy()) { label.textContent = lang === 'vi' ? 'Đóng hoạt động trước khi cập nhật nhé.' : 'Close the activity before updating.'; return; } g?.save?.(); const reg = await navigator.serviceWorker?.getRegistration(); if (reg?.waiting) { navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true }); reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } else location.reload(); };
  const close = document.createElement('button'); close.textContent = '×'; close.setAttribute('aria-label', lang === 'vi' ? 'Để sau' : 'Later'); close.onclick = () => { clearInterval(watch); n.remove(); };
  n.append(label, button, close); document.body.appendChild(n); n.hidden = busy();
  const watch = setInterval(() => { if (!n.isConnected) return clearInterval(watch); const b = busy(); if (n.hidden !== b) { n.hidden = b; if (!b) label.textContent = text[4]; } }, 500);
};
// (owner point 10) a newer tab took over (js/state.js): this one stops and offers to play here, which reloads the newest save
addEventListener('sv-held', () => {
  const g = window.__sv; if (g) g.paused = true; document.querySelector('.update-notice')?.remove();
  const n = document.createElement('div'); n.className = 'tab-held'; n.setAttribute('role', 'alertdialog'); n.setAttribute('aria-modal', 'true');
  const card = document.createElement('div'), p = document.createElement('p'), b = document.createElement('button');
  p.textContent = text[6]; b.textContent = text[7]; b.onclick = () => location.reload();
  card.append(p, b); n.append(card); document.body.appendChild(n); b.focus();
});
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
