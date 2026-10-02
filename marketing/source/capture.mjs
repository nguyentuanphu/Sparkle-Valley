// Takes fresh 1080×1920 stills of the game for the ads: node capture.mjs [only,names]  (game served on :8765)
// Uses the test harness to open the game at phone size (360×640 at 3× = 1080×1920) with full graphics.
import { launch, open, clear } from '../../tests/harness.mjs';
import fs from 'fs';
const DIR = new URL('./stills/', import.meta.url).pathname, only = (process.argv[2] || '').split(',').filter(Boolean);
const want = n => !only.length || only.includes(n);
const b = await launch();
const shot = async (page, name) => { await page.screenshot({ path: DIR + name + '.jpg', type: 'jpeg', quality: 90 }); console.log('saved', name); };
const game = async lang => {
  const P = await open(b, { w: 360, h: 640, dpr: 3, lang, touch: true, fast: false, settings: { quality: 'high', alwaysDay: true, captions: false } });
  await clear(P.page); await P.page.evaluate(() => { window.__sv.renderer.setPixelRatio(3); dispatchEvent(new Event('resize')); });
  return P;
};
const quiet = page => page.evaluate(() => { document.querySelectorAll('.toast, .region-banner, .banner, .vc-pop').forEach(e => e.remove()); });
// a view of the world: stand at (x, z), camera on the side camYaw, a little zoomed out
async function view(page, name, x, z, camYaw, zoom = 1.5, wait = 4500) {
  await clear(page);
  await page.evaluate(([x, z, c, zm]) => { const G = window.__sv, h = G.heroes[0]; h.place(x, z); h.yaw = c + Math.PI; h.camYaw = c; h.zoom = zm; h.manualCamT = 30; }, [x, z, camYaw, zoom]);
  await page.waitForTimeout(wait); await quiet(page); await shot(page, name);
}

// title and who's playing
for (const lang of ['en', 'vi']) {
  if (!want('title-' + lang) && !want('who-' + lang)) continue;
  const P = await open(b, { w: 360, h: 640, dpr: 3, lang, touch: true, fast: false, play: false, settings: { quality: 'high', alwaysDay: true } });
  await P.page.evaluate(() => { window.__sv.renderer.setPixelRatio(3); dispatchEvent(new Event('resize')); });
  await P.page.waitForTimeout(3000); if (want('title-' + lang)) await shot(P.page, 'title-' + lang);
  if (want('who-' + lang)) { await P.page.click('.screen.title .press', { force: true }); await P.page.waitForSelector('.screen.who'); await P.page.locator('.pick[data-id]').nth(0).click(); await P.page.waitForTimeout(800); await shot(P.page, 'who-' + lang); }
  await P.ctx.close();
}

const { page, ctx } = await game('en');
const V = [
  ['city-hanoi', 84, -21, 0], ['city-bacninh', 48, -103, 0], ['city-dragon', 62, -61, Math.PI / 2, 1.7], ['city-saigon', -8, 67, Math.PI],
  ['city-sydney', -70, -13, 0], ['city-brisbane', -15, 52, Math.PI / 2], ['city-melbourne', -123, 66, Math.PI / 2],
  ['road-village', 70, 31, -Math.PI / 2, 1.8], ['road-town', 2, 47, -Math.PI / 2, 1.6], ['road-farm', -23, 90, Math.PI, 1.6]
];
for (const [n, x, z, c, zm] of V) if (want(n)) await view(page, n, x, z, c, zm);
// the whistling kite in the meadow
if (want('kite')) { await page.evaluate(() => { const G = window.__sv, p = G.heroes[0].profile; p.kite = true; p.kiteOn = true; G.kites.sync(); }); await view(page, 'kite', -30, 20, Math.PI * .8, 1.4, 6000); }
// a kiosk: food and a saying
if (want('kiosk')) {
  await view(page, 'kiosk-bg', 84, -26, 0, 1, 2500);
  await page.evaluate(() => { const G = window.__sv, it = G.interactables.find(i => i.id === 'v_k_bunca'); G.heroes[0].place(it.x, it.z); it.act(G.heroes[0], G); });
  await page.waitForTimeout(1500); await quiet(page); await shot(page, 'kiosk');
}
// the map with roads, and the Games hub
if (want('map')) { await clear(page); await page.evaluate(() => window.__sv.openPad(0, 'map')); await page.waitForTimeout(1500); await shot(page, 'map'); }
if (want('hub')) { await clear(page); await page.evaluate(() => window.__sv.openGamesHub(0)); await page.waitForTimeout(1500); await shot(page, 'hub'); }
// city games
for (const g of ['puppets', 'dongho', 'traffic', 'koala', 'tram', 'ferries']) if (want('g-' + g)) { await clear(page); await page.evaluate(g => window.__sv.playGame(0, g, 'replay'), g); await page.waitForTimeout(3500); await shot(page, 'g-' + g); await page.evaluate(() => { document.querySelector('.gl .gl-x')?.click(); }); await page.waitForTimeout(800); await clear(page); }
// a fairy tale in the tale theatre, English then Vietnamese
for (const [lang, n] of [['en', 'tale-en'], ['vi', 'tale-vi']]) if (want(n)) {
  const Q = lang === 'en' ? { page } : await game('vi');
  await clear(Q.page);
  await Q.page.evaluate(async () => { const T = await import('/js/tales.js'); const D = await import('/js/talesdata.js'); const tale = D.MORE_TALES[0]; T.openTheatre(tale, { name: 'Na', startPage: 1 }); });
  await Q.page.waitForTimeout(3500); await shot(Q.page, n); if (Q.ctx) await Q.ctx.close();
}
await ctx.close(); await b.close();
