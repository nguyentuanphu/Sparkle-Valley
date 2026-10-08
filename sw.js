// Offline support: cache the whole game on first visit, then serve from the cache.
// Bump VERSION whenever files change so devices pick up the update. Updates only replace the game's files:
// saved progress (localStorage, IndexedDB, and the 'sv-save' copy) and the voice pack are never deleted.
const VERSION = 'sv-2026-10-08-r47';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'vendor/three.module.js', 'vendor/peerjs.min.js', 'vendor/RoomEnvironment.js', 'css/fonts.css',
  'fonts/Fredoka-latin-500.woff2', 'fonts/Fredoka-latin-ext-500.woff2', 'fonts/Baloo2-latin-600.woff2', 'fonts/Baloo2-latin-ext-600.woff2', 'fonts/Baloo2-vietnamese-600.woff2',
  'js/main.js', 'js/util.js', 'js/state.js', 'js/i18n.js', 'js/money.js', 'js/audio.js', 'js/voice.js', 'js/gfx.js',
  'js/world.js', 'js/avatar.js', 'js/player.js', 'js/input.js', 'js/net.js', 'js/hud.js', 'js/ui.js', 'js/data.js',
  'js/farm.js', 'js/places.js', 'js/story.js', 'js/recorder.js', 'js/secrets.js', 'js/credits.js', 'js/howto.js', 'js/chat.js',
  'js/listen.js', 'js/install.js', 'js/gather.js', 'js/trade.js', 'js/asia.js', 'js/heritage.js', 'js/pets.js', 'js/ferry.js', 'js/passport.js', 'js/festivals.js', 'js/weather.js', 'js/fun.js', 'js/learn.js', 'js/packhash.js', 'js/showcase.js', 'js/games/music.js', 'js/icons.js', 'js/words2.js', 'js/games/asia.js', 'js/houses.js', 'js/commands.js', 'js/extras.js', 'js/town.js', 'js/powerlines.js', 'js/regions.js', 'js/words.js', 'js/games/folk.js', 'js/games/folk2.js', 'js/roads.js', 'js/cities.js', 'js/games/cities.js', 'js/chatter.js', 'js/tales.js', 'js/talesdata.js', 'js/kite.js', 'js/relay.js','js/hawkers.js', 'js/snacks.js', 'js/animals.js', 'js/homes.js', 'js/art.js', 'js/suburbs.js', 'js/games/learning.js', 'js/games/all.js', 'js/cartoon.js', 'js/games/tienlen.js', 'js/realworld.js', 'js/symbols.js', 'js/games/more.js', 'js/regionsites.js', 'js/vnfun.js', 'js/custom.js', 'content/custom.json', 'js/build.js', 'js/worldedit.js', 'js/folkshow.js', 'js/ads.js', 'js/solids.js', 'js/players.js', 'js/packbar.js', 'js/roomcode.js', 'js/photos.js', 'js/netmsg.js', 'js/lotus.js', 'js/worldcache.js', 'js/core/ids.js', 'js/core/events.js', 'js/core/rng.js', 'js/core/geo.js', 'js/placebook.js', 'js/familycards.js', 'js/myhouse.js', 'js/popups.js', 'js/vendors.js', 'js/games/registry.js', 'js/content/rules.js', 'js/report.js', 'js/coop.js', 'js/netgames.js', 'js/twinchests.js', 'js/claims.js', 'js/simple.js', 'js/songs.js', 'js/content/songs.js', 'js/content/activities.js',
  'js/games/frame.js', 'js/games/thinking.js', 'js/games/strategy.js', 'js/games/vietnam.js', 'js/games/market.js', 'js/games/farmgames.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'sv-voices' && k !== 'sv-save' && k !== 'sv-photos').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // the voice pack: kept in its own cache (it survives game updates) and stored as lines are played
  if (url.pathname.endsWith('/voices/manifest.json')) { // the saved list at once (slow phone data must never mean the phone's voice), refreshed behind
    e.respondWith(caches.open('sv-voices').then(c => c.match(req).then(hit => { const fresh = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }); if (hit) { e.waitUntil(fresh.catch(() => { })); return hit; } return fresh.catch(() => new Response('{}', { status: 404 })); })));
    return;
  }
  // the family's content pack (Sparkle Studio): the newest when online, the saved copy when offline
  if (url.pathname.includes('/content/')) {
    e.respondWith(caches.open(VERSION).then(c => fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => c.match(req, { ignoreSearch: true }).then(hit => hit || new Response('{}', { headers: { 'Content-Type': 'application/json' } })))));
    return;
  }
  // real photos of the landmarks saved with the game (Sparkle Studio → Photos): the list newest-first, photos kept once seen
  if (url.pathname.endsWith('/photos/index.json')) {
    e.respondWith(caches.open('sv-photos').then(c => fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => c.match(req).then(hit => hit || new Response('{}', { headers: { 'Content-Type': 'application/json' } })))));
    return;
  }
  if (url.pathname.includes('/photos/')) {
    e.respondWith(caches.open('sv-photos').then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  if (url.pathname.includes('/voices/') && url.pathname.endsWith('.mp3')) {
    e.respondWith(caches.open('sv-voices').then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
