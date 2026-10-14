// Offline support: cache the whole game on first visit, then serve from the cache.
// Bump VERSION whenever files change so devices pick up the update. Updates only replace the game's files:
// saved progress (localStorage, IndexedDB, and the 'sv-save' copy) and the voice pack are never deleted.
const VERSION = 'sv-2026-10-14-repair9-r76';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'vendor/three.module.js', 'vendor/peerjs.min.js', 'vendor/RoomEnvironment.js', 'css/fonts.css',
  'fonts/Fredoka-latin-500.woff2', 'fonts/Fredoka-latin-ext-500.woff2', 'fonts/Baloo2-latin-600.woff2', 'fonts/Baloo2-latin-ext-600.woff2', 'fonts/Baloo2-vietnamese-600.woff2',
  'js/main.js', 'js/rideview.js', 'js/launch.js', 'js/screencapture.js', 'js/familydevices.js', 'js/family-backup.js', 'js/util.js', 'js/state.js', 'js/i18n.js', 'js/money.js', 'js/audio.js', 'js/voice.js', 'js/gfx.js',
  'js/world.js', 'js/avatar.js', 'js/player.js', 'js/input.js', 'js/net.js', 'js/mictest.js', 'js/hud.js', 'js/ui.js', 'js/data.js',
  'js/farm.js', 'js/places.js', 'js/story.js', 'js/recorder.js', 'js/secrets.js', 'js/credits.js', 'js/howto.js', 'js/chat.js',
  'js/listen.js', 'js/install.js', 'js/gather.js', 'js/trade.js', 'js/asia.js', 'js/heritage.js', 'js/pets.js', 'js/ferry.js', 'js/passport.js', 'js/festivals.js', 'js/weather.js', 'js/fun.js', 'js/learn.js', 'js/packhash.js', 'js/showcase.js', 'js/games/music.js', 'js/icons.js', 'js/words2.js', 'js/games/asia.js', 'js/houses.js', 'js/commands.js', 'js/extras.js', 'js/town.js', 'js/powerlines.js', 'js/viwords.js', 'js/vehicles.js', 'js/traffic.js', 'js/film.js', 'js/content/films.js', 'js/content/talefilms.js', 'js/content/films/kit.js', 'js/content/films/rongtien.js', 'js/content/films/caytre.js', 'js/content/films/tamcam.js', 'js/content/films/sodua.js', 'js/content/films/thachsanh.js', 'js/content/films/chucuoi.js', 'js/content/films/cockien.js', 'js/content/films/vusua.js', 'js/content/films/baluoiriu.js', 'js/content/films/quabau.js', 'js/content/films/thayboi.js', 'js/content/films/nhacmeo.js', 'js/content/films/ongtao.js', 'js/content/films/cachep.js', 'js/content/films/sontinh.js', 'js/content/films/rainbowserpent.js', 'js/content/films/emu.js', 'js/content/films/dotkangaroo.js', 'js/content/films/birdcolours.js', 'js/content/films/magicpudding.js', 'js/content/films/tiddalik.js', 'js/content/films/greatrace.js', 'js/content/films/maliang.js', 'js/content/films/weaver.js', 'js/content/films/nian.js', 'js/content/films/kongrong.js', 'js/content/films/change.js', 'js/content/films/crow.js', 'js/content/films/lionrabbit.js', 'js/content/films/ganesha.js', 'js/content/films/bluejackal.js', 'js/content/films/elephantmice.js', 'js/content/films/monkey.js', 'js/lanterns.js', 'js/companion.js', 'js/dinh.js', 'js/content/chapters.js', 'js/content/chapter2hanoi.js', 'js/content/chapter2props.js', 'js/content/chapter2films.js', 'js/content/chapter2text.js', 'js/yard.js', 'js/content/yard.js', 'js/content/map.js', 'js/openspot.js', 'js/handpad.js', 'js/kidplay.js', 'js/hoilang.js', 'js/surprises.js', 'js/parents.js', 'js/content/hoilang.js', 'js/content/surprises.js', 'js/content/parents.js', 'js/lunar.js', 'js/content/festcal.js', 'js/content/releases.js', 'js/emojiswap.js', 'js/regions.js', 'js/words.js', 'js/games/folk.js', 'js/games/folk2.js', 'js/roads.js', 'js/signposts.js', 'js/nametags.js', 'js/cities.js', 'js/games/cities.js', 'js/chatter.js', 'js/tales.js', 'js/talesdata.js', 'js/kite.js', 'js/relay.js', 'js/hawkers.js', 'js/snacks.js', 'js/animals.js', 'js/homes.js', 'js/art.js', 'js/suburbs.js', 'js/games/learning.js', 'js/games/all.js', 'js/cartoon.js', 'js/games/tienlen.js', 'js/games/tienlenrules.js', 'js/realworld.js', 'js/symbols.js', 'js/games/more.js', 'js/regionsites.js', 'js/vnfun.js', 'js/custom.js', 'content/custom.json', 'js/build.js', 'js/worldedit.js', 'js/folkshow.js', 'js/ads.js', 'js/solids.js', 'js/players.js', 'js/packbar.js', 'js/roomcode.js', 'js/photos.js', 'js/netmsg.js', 'js/lotus.js', 'js/worldcache.js', 'js/core/ids.js', 'js/core/events.js', 'js/core/rng.js', 'js/core/geo.js', 'js/placebook.js', 'js/familycards.js', 'js/myhouse.js', 'js/popups.js', 'js/vendors.js', 'js/games/registry.js', 'js/content/rules.js', 'js/report.js', 'js/coop.js', 'js/netgames.js', 'js/twinchests.js', 'js/claims.js', 'js/simple.js', 'js/songs.js', 'js/content/songs.js', 'js/content/activities.js', 'js/festdecor.js', 'js/festhunt.js', 'js/content/festhunt.js', 'js/seethrough.js', 'js/content/chapter3sydney.js', 'js/content/chapter3props.js', 'js/content/chapter3films.js', 'js/content/chapter3text.js', 'js/voicepack.js', 'js/autoplay.js', 'js/content/autoplay.js', 'js/testergate.js', 'js/tester.js', 'js/tester-detection.js', 'js/report-outbox.js', 'js/testerrewards.js', 'js/content/tester.js', 'js/plots.js', 'js/reeds.js', 'js/scrollhelp.js', 'js/chipinfo.js', 'js/soundsheet.js', 'js/content/familymissions.js', 'js/villagertalk.js', 'js/content/villagerlines.js', 'js/owlguide.js', 'js/pricetags.js', 'js/content/owllessons.js', 'js/jobs.js', 'js/content/jobs.js', 'js/wayfind.js', 'js/dayplan.js', 'js/animalhomes.js', 'js/keepcopy.js', 'js/content/devname.js',
  'js/games/money.js', 'js/games/moneylogic.js', 'js/games/frame.js', 'js/games/thinking.js', 'js/games/bigthinkers.js', 'js/games/strategy.js', 'js/games/vietnam.js', 'js/games/market.js', 'js/games/farmgames.js',
  'js/shop.js', 'js/content/shop.js', 'js/boxes.js', 'js/content/boxes.js', // (round S: the clothes shop, mystery boxes, rankings, collectibles)
  'js/games/readingmenu.js', 'js/games/reading.js', 'js/content/reading.js', // (Play reading trial)
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'
];
// (Analytics & Infra, 10 Oct, owner: "can't even play offline when there is no internet") the newest copy when the
// network answers quickly, otherwise the saved copy after a short wait: a connection that never answers (Wi-Fi with no
// internet, weak phone signal) must never keep the game from starting. The network's answer still refreshes the copy.
const QUICK = 1500;
function quick(e, cacheName, req, fallback) {
  return caches.open(cacheName).then(c => {
    const net = fetch(req).then(r => { if (r.ok) return c.put(req, r.clone()).catch(() => { }).then(() => r); return r; });
    e.waitUntil(net.catch(() => { })); // (the refresh finishes even when the saved copy answered)
    const saved = () => c.match(req, { ignoreSearch: true });
    return new Promise(done => {
      let over = false;
      const giveSaved = () => saved().then(hit => { if (hit) { over = true; done(hit); } else if (!over) net.then(done, () => done(fallback())); });
      const t = setTimeout(giveSaved, QUICK);
      net.then(r => { if (over) return; clearTimeout(t); if (r.ok) { over = true; done(r); } else giveSaved(); }, () => { clearTimeout(t); if (!over) giveSaved(); });
    });
  });
}
const emptyJSON = () => new Response('{}', { headers: { 'Content-Type': 'application/json' } });
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); });
self.addEventListener('message', e => { if (e.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => { const old = keys.filter(k => k !== 'sv-family' && /^sv-20/.test(k) && k !== VERSION); const keep = old.slice(-1); return Promise.all(old.filter(k => !keep.includes(k)).map(k => caches.delete(k))); }).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // (round R privacy, 9 Oct) family photos (api/family/…) are private: never kept here, straight to the network (the
  // game keeps its own copy in the "sv-family" cache); nor anything else under api/
  if (url.pathname.includes('/api/')) return;
  // Hashed chunks are immutable. An open previous-version game may still need its own lazy chunks.
  if (url.pathname.includes('/bundle/')) { e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) e.waitUntil(caches.open(VERSION).then(c => c.put(req, r.clone()))); return r; }))); return; }
  // the voice pack: kept in its own cache (it survives game updates) and stored as lines are played
  if (url.pathname.endsWith('/voices/manifest.json')) { // the saved list at once (slow phone data must never mean the phone's voice), refreshed behind
    e.respondWith(caches.open('sv-voices').then(c => c.match(req).then(hit => { const fresh = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }); if (hit) { e.waitUntil(fresh.catch(() => { })); return hit; } return fresh.catch(() => new Response('{}', { status: 404 })); })));
    return;
  }
  // the family's content pack (Sparkle Studio): the newest when online, the saved copy when offline
  // (audit, 9 Oct) js/content/*.js is game code: it stays with the rest of the game's files, never fetched on its own
  if (url.pathname.includes('/content/') && !url.pathname.includes('/js/content/')) {
    e.respondWith(quick(e, VERSION, req, emptyJSON));
    return;
  }
  // real photos of the landmarks saved with the game (Sparkle Studio → Photos): the list newest-first, photos kept once seen
  if (url.pathname.endsWith('/photos/index.json')) {
    e.respondWith(quick(e, 'sv-photos', req, emptyJSON));
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
