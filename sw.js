// Offline support: cache the whole game on first visit, then serve from the cache.
// Bump VERSION whenever files change so devices pick up the update.
const VERSION = 'sv-2026-10-01-1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'vendor/three.module.js', 'vendor/peerjs.min.js',
  'js/main.js', 'js/util.js', 'js/state.js', 'js/i18n.js', 'js/money.js', 'js/audio.js', 'js/voice.js', 'js/gfx.js',
  'js/world.js', 'js/avatar.js', 'js/player.js', 'js/input.js', 'js/net.js', 'js/hud.js', 'js/ui.js', 'js/data.js',
  'js/games/frame.js', 'js/games/thinking.js', 'js/games/strategy.js', 'js/games/vietnam.js', 'js/games/market.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Google Fonts: cache as we go so the font works offline after the first visit.
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) {
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }).catch(() => hit))));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
