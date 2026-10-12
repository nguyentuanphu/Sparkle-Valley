// Sparkle Valley regression checks. Start the game first (python3 -m http.server 8765 in the repo), then:
//   cd tests && npm install && node run.mjs            all checks
//   node run.mjs games features                        only some
//   node run.mjs --update-contract                     re-record the UI structure (only when the owner asked for a UI change)
// Multiplayer runs when a local PeerJS server is up on 127.0.0.1:9000 (see the README in this folder).
import fs from 'fs';
import os from 'os';
import { launch, open, clear, start, URL, seedPlayers } from './harness.mjs';
import { groundAudit } from './world-audit.mjs';
import { studioCheck } from './studio-check.mjs';
// (round R privacy) friends save each other's device key when they first play together (＋👫); two test devices that are
// already friends by code get each other's key here, the way that first game would have given it
// the text of an element with each swapped drawing read back as its emoji (js/emojiswap.js keeps it in data-e)
const withEmo = `window.withEmo = el => [...el.childNodes].map(n => n.nodeType === 3 ? n.textContent : n.dataset && n.dataset.e ? n.dataset.e : window.withEmo(n)).join('');`;
async function pairKeys(A, B) {
  const pub = P => P.page.evaluate(async () => (await import('/js/net.js')).myPub());
  const [pa, pb] = [await pub(A), await pub(B)];
  const put = (P, other) => P.page.evaluate(async other => { const S = await import('/js/state.js'); (S.settings.friends || []).forEach(f => { f.pub = other; }); S.saveSettings(); window.__sv.listenFriends && window.__sv.listenFriends(); }, other);
  await put(A, pb); await put(B, pa);
}

const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
const want = k => !only.length || only.includes(k);
const results = [];
const check = async (name, fn) => {
  if (!want(name)) return;
  const t0 = Date.now();
  try { const note = await fn(); results.push([name, true, note || '']); console.log(`✅ ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s) ${note || ''}`); }
  catch (e) {
    results.push([name, false, e.message]); console.log(`❌ ${name}: ${e.message}`);
    // a picture of what was on screen when it failed (out/fail-<check>.png)
    try { const pg = b.contexts().flatMap(c => c.pages()).pop(); if (pg) await pg.screenshot({ path: `out/fail-${name}.png`, timeout: 10000 }); } catch (e2) { }
  }
  // (round R) close every window the check left open, passed or failed: a failed check's window kept drawing the valley
  // and slowed every later check until they timed out
  finally { for (const c of b.contexts()) await c.close().catch(() => { }); }
};
const ok = (c, msg) => { if (!c) throw new Error(msg); };
fs.mkdirSync('out', { recursive: true });
// ---- (Analytics & Infra, 11 Oct, #36) the packed copy the website serves (tools/bundle.mjs), built once a run in
// out/packed (the big folders are linked, not copied), and a little server for a folder on 127.0.0.2 (the game skips its
// service worker on localhost): compressed like Netlify when asked, and able to stop answering (a dead connection) ----
let packedDir = null;
async function packedSite() {
  if (packedDir) return packedDir;
  const path = await import('path'), { execFileSync } = await import('child_process'), dir = path.resolve('out/packed'), repo = path.resolve('..');
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (const f of ['index.html', 'sw.js']) fs.copyFileSync(path.join(repo, f), path.join(dir, f));
  for (const f of ['manifest.webmanifest', 'css', 'fonts', 'icons', 'js', 'vendor', 'content', 'videos', 'voices', 'photos']) if (fs.existsSync(path.join(repo, f))) fs.symlinkSync(path.join(repo, f), path.join(dir, f));
  execFileSync(process.execPath, [path.join(repo, 'tools/bundle.mjs'), dir], { encoding: 'utf8' });
  ok(fs.existsSync(path.join(dir, 'bundle')), 'the packed copy was not built (tools/bundle.mjs: esbuild missing?)');
  return (packedDir = dir);
}
async function serveFolder(root, { gzip = false } = {}) {
  const http = await import('http'), path = await import('path'), zlib = await import('zlib');
  const TY = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };
  const S = { hang: false };
  const srv = http.createServer((q, r) => {
    if (S.hang) return;
    let f = decodeURIComponent(q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; f = path.join(root, f);
    if (!f.startsWith(root) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); return r.end(); }
    const type = TY[path.extname(f)] || 'application/octet-stream', z = gzip && /text|javascript|json|manifest/.test(type) && /gzip/.test(q.headers['accept-encoding'] || '');
    r.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', ...(z ? { 'Content-Encoding': 'gzip' } : {}) });
    (z ? fs.createReadStream(f).pipe(zlib.createGzip()) : fs.createReadStream(f)).pipe(r);
  });
  await new Promise(res => srv.listen(0, '127.0.0.2', res));
  return Object.assign(S, { url: `http://127.0.0.2:${srv.address().port}/`, close: () => { srv.closeAllConnections(); srv.close(); } });
}
const b = await launch();

await check('boot', async () => {
  for (const [w, h, touch] of [[390, 844, true], [1024, 768, true], [1280, 800, false]]) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    const n = await P.page.evaluate(() => __sv.heroes.length); ok(n === 1, 'no hero');
    await P.page.screenshot({ path: `out/boot-${w}.png` });
    ok(!P.errors.length, `${w}px: ${P.errors.join(' | ')}`); await P.ctx.close();
  }
});

await check('spill', async () => {
  const bad = [];
  for (const lang of ['en', 'vi']) for (const [w, h, touch] of [[320, 640, true], [375, 812, true], [1024, 768, false]]) {
    const P = await open(b, { w, h, touch, lang }); await clear(P.page);
    // the keyboard badges poke out of the button corners on purpose
    await P.page.addStyleTag({ content: '.kb, .padkey { display: none !important; }' });
    const off = s => P.page.evaluate(sel => [...document.querySelectorAll(sel)].filter(e => e.offsetParent && (e.scrollWidth > e.clientWidth + 2 || e.getBoundingClientRect().right > innerWidth + 1 || e.getBoundingClientRect().left < -1)).map(e => (e.className || e.tagName) + ':' + e.textContent.trim().slice(0, 20)), s);
    bad.push(...(await off('.hud button, .hud .chip, .hud .q-text')).map(x => `${lang}${w} hud ${x}`));
    await P.page.evaluate(() => __sv.openPad(0, 'map')); await P.page.waitForTimeout(500);
    for (const t of ['map', 'bag', 'log', 'album', 'passport', 'games', 'cam', 'friend']) { await P.page.evaluate(t => document.querySelector(`.pad-tabs [data-t="${t}"]`)?.click(), t); await P.page.waitForTimeout(250); bad.push(...(await off('.pad-tabs small, .pad-body h3, .pad-body .btn')).map(x => `${lang}${w} pad-${t} ${x}`)); }
    await clear(P.page); await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForTimeout(500);
    bad.push(...(await off('.hub .hcard b, .hub .talecard small, .hub h3')).map(x => `${lang}${w} hub ${x}`));
    await P.ctx.close();
  }
  ok(!bad.length, bad.slice(0, 8).join(' · '));
});

await check('language', async () => {
  const P = await open(b, { w: 1024, h: 768, lang: 'vi' }); await clear(P.page);
  const txt = async () => P.page.evaluate(() => document.body.innerText);
  let all = await txt();
  await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForTimeout(500); all += await txt();
  const leftovers = ['Games', ' Map', ' Bag', 'Talk', 'Fairy tales', 'Tap a picture', 'In the cities', 'Run', 'Jump', 'Welcome'].filter(w => all.includes(w));
  await P.ctx.close();
  ok(!leftovers.length, 'English left in Vietnamese mode: ' + leftovers.join(', '));
});

await check('two-players', async () => {
  const P = await open(b, { w: 1280, h: 800, mode: 'split' }); await clear(P.page);
  const r = await P.page.evaluate(() => ({ heroes: __sv.heroes.length, huds: document.querySelectorAll('.hud').length, pets: __sv.pets.forHero(__sv.heroes[1]).length }));
  await P.page.screenshot({ path: 'out/two-players.png' }); await P.ctx.close();
  ok(r.heroes === 2 && r.huds === 2 && r.pets >= 1, JSON.stringify(r));
});

// Two players face to face (owner, round R): on a touch screen the far half (and the far player's controls and
// windows) are turned half a turn so each child at each end sees their half the right way up
await check('facetoface', async () => {
  const out = [];
  for (const [w, h] of [[820, 1180], [1180, 820]]) {
    const P = await open(b, { w, h, touch: true, mode: 'split' }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      const cv = __sv.renderer.domElement, I = await import('/js/input.js'), q = __sv.rects();
      const ev = (type, x, y, id) => cv.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: id, pointerType: 'touch', bubbles: true }));
      const far = q[1], near = q[0];
      ev('pointerdown', far.x + far.w - 60, far.y + far.h / 2, 7); ev('pointermove', far.x + far.w - 60, far.y + far.h / 2 + 40, 7); ev('pointermove', far.x + far.w - 60, far.y + far.h / 2 + 60, 7);
      const farMz = I.pads[1].mz; ev('pointerup', 0, 0, 7);
      ev('pointerdown', near.x + 60, near.y + near.h / 2, 8); ev('pointermove', near.x + 60, near.y + near.h / 2 - 40, 8); ev('pointermove', near.x + 60, near.y + near.h / 2 - 60, 8);
      const nearMz = I.pads[0].mz; ev('pointerup', 0, 0, 8);
      __sv.lastPlayer = 1; __sv.openPad(1, 'map'); await new Promise(r => setTimeout(r, 400));
      const turned = !!document.querySelector('.facewrap > *'); document.querySelectorAll('.modal').forEach(m => m.remove());
      return { rot: q.map(x => x.rot), farTop: far.y === 0, hudFar: __sv.huds[1].root.classList.contains('far'), farMz, nearMz, turned };
    });
    if (!(r.rot[0] === 0 && r.rot[1] === 180 && r.farTop && r.hudFar && r.farMz > .9 && r.nearMz > .9 && r.turned)) out.push(`${w}x${h} ${JSON.stringify(r)}`);
    if (P.errors.length) out.push(`${w}x${h}: ${P.errors.join(' | ')}`);
    await P.page.screenshot({ path: `out/facetoface-${w}.png` }); await P.ctx.close();
  }
  // the children choose: on "Who's playing?" with two players, and with the switch on the line while playing
  { const P = await open(b, { w: 820, h: 1180, touch: true, play: false });
    await P.page.click('.screen.title .press', { force: true }); await P.page.waitForSelector('.screen.who');
    await P.page.click('.modes button[data-m=split]');
    const views = await P.page.$$eval('.who .views button', bs => bs.map(x => x.dataset.v + (x.classList.contains('on') ? '*' : '')).join(','));
    await P.page.click('.who .views button[data-v=side]');
    const picked = await P.page.evaluate(async () => (await import('/js/state.js')).settings.twoView);
    if (views !== 'face*,side' || picked !== 'side') out.push(`who screen: ${views} → ${picked}`);
    await P.ctx.close(); }
  { const P = await open(b, { w: 820, h: 1180, touch: true, mode: 'split' }); await clear(P.page);
    const before = await P.page.evaluate(() => __sv.rects()[1].rot);
    await P.page.click('#split .viewsw'); await P.page.waitForTimeout(200);
    const after = await P.page.evaluate(() => __sv.rects().map(x => x.rot).join(','));
    await P.page.click('#split .viewsw'); await P.page.waitForTimeout(200);
    const back = await P.page.evaluate(() => __sv.rects()[1].rot);
    if (!(before === 180 && after === '0,0' && back === 180)) out.push(`switch: ${before} → ${after} → ${back}`);
    await P.ctx.close(); }
  // a computer keeps both halves the same way round, side by side
  const D = await open(b, { w: 1280, h: 800, mode: 'split' }); await clear(D.page);
  const side = await D.page.evaluate(() => __sv.rects().map(x => x.rot).join(',') + ' ' + __sv.rects()[1].x); await D.ctx.close();
  if (side !== '0,0 640') out.push('computer: ' + side);
  ok(!out.length, out.join(' · '));
  return 'tablet tall and wide: the far half, its buttons, joystick and windows face the far child; a computer stays side by side; children choose face to face or side by side on Who\'s playing? and with the switch on the line';
});

await check('games', async () => {
  const P = await open(b, { w: 1024, h: 768 }); await clear(P.page);
  const ids = await P.page.evaluate(async () => Object.keys((await import('/js/games/frame.js')).GAMES));
  const failed = [];
  for (const id of ids) {
    const r = await P.page.evaluate(async id => { __sv.playGame(0, id, 'replay'); await new Promise(r => setTimeout(r, 400)); const open = !!document.querySelector('.gl'); document.querySelector('.gl .gl-x')?.click(); await new Promise(r => setTimeout(r, 350)); return open; }, id);
    if (!r) failed.push(id);
  }
  const errs = P.errors.slice(); await P.ctx.close();
  ok(!failed.length && !errs.length, `did not open: ${failed.join(',')} ${errs.join(' | ')}`);
  return `${ids.length} games`;
});

await check('features', async () => {
  const P = await open(b, { w: 1024, h: 768 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], W = await import('/js/world.js'), R = await import('/js/regions.js'), { farm } = await import('/js/state.js');
    const o = {};
    o.cities = W.CITIES.length; o.roads = W.ROADS.length; o.landmarks = R.LANDMARKS.length;
    o.kiosks = G.interactables.filter(i => /^v_k_/.test(i.id)).length;
    o.hosts = ['puppets', 'dongho', 'dragonfire', 'traffic', 'kite', 'ferries', 'tram', 'koala'].filter(g => G.gameSpot(g)).length;
    o.house8 = !!G.interactables.find(i => i.id === 'house8');
    o.tales = G.TALES.length; o.vnTales = G.TALES.filter(t => t.flag === '🇻🇳').length;
    // the Dragon Bridge deck is walkable over the river
    { const D = W.DRAGON, u = (D.a0 + D.a1) / 2, [dx, dz] = D.axis === 'z' ? [D.c, u] : [u, D.c]; // (round T: the middle of the Dragon Bridge, from the map)
      o.deck = +G.world.groundAt(dx, dz, 20).toFixed(1); o.river = +W.heightAt(dx, dz).toFixed(1); }
    // pets: adopt, send to the yard, bring back
    farm.coins = 500; window.confirm = () => true;
    G.pets.openAdopt(h); document.querySelector('[data-ad="kitty"]').click(); document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
    G.pets.openAdopt(h); document.querySelector('[data-bye="0"]').click(); document.querySelector('[data-take="0"]').click(); document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
    o.pets = h.profile.pets.map(p => p.kind).sort().join('+'); o.petsVisible = G.pets.forHero(h).every(L => L.obj.visible);
    // a conversation closes by itself when you walk away
    G.dialog('Test', [['Hello there', 'Chào']]); h.place(h.pos.x + 20, h.pos.z);
    return o;
  });
  await P.page.waitForTimeout(800);
  r.dialogClosed = await P.page.evaluate(() => !document.querySelector('.dialog:not(.out)'));
  // keyboard: M opens the map, digits switch tabs, Escape closes; +/- zoom
  await clear(P.page); await P.page.keyboard.press('KeyM'); await P.page.waitForTimeout(400);
  r.keyMap = await P.page.evaluate(() => !!document.querySelector('.pad'));
  await P.page.keyboard.press('Digit2'); await P.page.waitForTimeout(300);
  r.keyTab = await P.page.evaluate(() => document.querySelector('.pad-tabs .on')?.dataset.t);
  await P.page.keyboard.press('Escape'); await P.page.waitForTimeout(300);
  // (the keys only work once the window has gone and the game runs again: wait for that, not a fixed time)
  await P.page.waitForFunction(() => !document.querySelector('.modal, .storybook, .vc-pop') && !__sv.paused, null, { timeout: 15000 }).catch(() => { });
  const z0 = await P.page.evaluate(() => __sv.heroes[0].zoom || 1); await P.page.keyboard.press('Minus'); r.zoom = (await P.page.evaluate(() => __sv.heroes[0].zoom)) > z0;
  // a fairy tale from the Games hub: fly to the storyteller, the theatre opens
  await clear(P.page); await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForTimeout(400);
  await P.page.evaluate(() => { document.querySelector('.hub [data-tab="tales"]').click(); document.querySelector('.hub [data-tale="tamcam"]').click(); }); await P.page.waitForTimeout(3500);
  r.theatre = await P.page.evaluate(() => !!document.querySelector('.theatre'));
  await P.page.evaluate(() => document.querySelector('.th-x')?.click());
  // tapping a game card flies to its host
  await clear(P.page); await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForTimeout(400);
  await P.page.evaluate(() => { document.querySelector('.hub [data-tab="places"]').click(); document.querySelector('[data-play="traffic"]').click(); }); await P.page.waitForTimeout(3500);
  r.flewToHost = await P.page.evaluate(() => { const it = __sv.gameSpot('traffic'), h = __sv.heroes[0]; return Math.hypot(it.x - h.pos.x, it.z - h.pos.z) < 6 && !!document.querySelector('.gl'); });
  // folk-game friends chat: a bubble shows within a few seconds near the playground
  await P.page.evaluate(async () => { document.querySelector('.gl .gl-x')?.click(); const PG = (await import('/js/world.js')).PLAYGROUND; __sv.heroes[0].place(PG.x, PG.z + 4); });
  let seen = false; for (let k = 0; k < 14 && !seen; k++) { await P.page.waitForTimeout(500); seen = await P.page.evaluate(() => { let v = false; __sv.scene.traverse(o => { if (o.isSprite && o.renderOrder === 5 && o.visible) v = true; }); return v; }); }
  r.chatter = seen;
  const errs = P.errors.slice(); await P.ctx.close();
  const fails = [];
  // (round T3: Bà Rịa–Vũng Tàu is the eighth city, Anh Hai's kites its host; two more kiosks)
  if (r.cities !== 8) fails.push('cities'); if (r.kiosks < 28) fails.push('kiosks'); if (r.hosts !== 8) fails.push('hosts'); if (r.landmarks < 47) fails.push('landmarks');
  if (!r.house8) fails.push('house8'); if (r.tales < 32 || r.vnTales < 18) fails.push('tales'); if (!(r.deck > r.river + 3)) fails.push('dragon deck');
  if (r.pets !== 'kitty+puppy' && r.pets !== 'puppy+kitty' && r.pets.split('+').length !== 2) fails.push('pets ' + r.pets); if (!r.petsVisible) fails.push('pets hidden');
  for (const k of ['dialogClosed', 'keyMap', 'zoom', 'theatre', 'flewToHost', 'chatter']) if (!r[k]) fails.push(k);
  if (r.keyTab !== 'bag') fails.push('keyTab');
  if (errs.length) fails.push(errs.join(' | '));
  ok(!fails.length, fails.join(', ') + ' ' + JSON.stringify(r));
  return JSON.stringify(r);
});

await check('camera', async () => {
  // at every landmark sign, facing four ways, the camera must not end up inside a building
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  const stuck = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], R = await import('/js/regions.js'), THREE = (await import('/vendor/three.module.js'));
    const out = [], ray = new THREE.Raycaster();
    for (const lm of R.LANDMARKS) for (const yaw of [0, 1.57, 3.14, 4.71]) {
      h.place(lm.x, lm.z); h.camYaw = yaw; h.camPos = h.camPos || h.cam.position.clone();
      for (let k = 0; k < 39; k++) h.finish(.05, k * .05, G, 0);
      G.seeThrough.marked.clear(); h.finish(.05, 2, G, 0); // (bug #33) the things in the way on the last frame
      const c = h.cam.position, inBox = G.world.boxes.some(b => c.x > b.x0 && c.x < b.x1 && c.z > b.z0 && c.z < b.z1 && c.y < G.world.groundAt(c.x, c.z) + 6);
      const to = new THREE.Vector3(h.pos.x, h.pos.y + 1.2, h.pos.z), d = to.clone().sub(c); const L = d.length(); ray.set(c, d.normalize()); ray.far = L - .6;
      const hit = ray.intersectObjects(G.camBlockers(), false)[0];
      // (bug #33) the camera stays where it is, so a house in the way is fine as long as it is fading to see-through
      const fades = hit ? G.seeThrough.marked.has(G.seeThrough.rootOf(hit.object)) : G.seeThrough.marked.size > 0;
      if ((inBox || hit) && !fades) out.push(lm.id + '@' + yaw);
    }
    // (bug #33) next to a landmark the thing in the way really turns see-through, the camera keeps its distance, and
    // everything goes back to solid once the way is clear
    const S = G.seeThrough; let fade = null;
    for (const lm of R.LANDMARKS) {
      h.place(lm.x, lm.z);
      for (const yaw of [0, 1.57, 3.14, 4.71]) {
        h.camYaw = yaw; for (let k = 0; k < 60; k++) { h.finish(.05, k * .05, G, 0); S.step(.05); }
        if (S.active()) { fade = { lm: lm.id, yaw }; break; }
      }
      if (fade) break;
    }
    let seen = null, back = null;
    if (fade) {
      seen = S.active(); h.finish(.05, 9, G, 0); S.step(1);
      let minOp = 1; G.scene.traverse(o => { if (o.isMesh && o.material && !Array.isArray(o.material) && o.material.transparent && o.material.opacity < minOp && o.material.depthWrite === false && o.material.opacity > 0) minOp = o.material.opacity; });
      const dist = h.cam.position.distanceTo(h.pos);
      h.place(0, -230); for (let k = 0; k < 60; k++) { h.finish(.05, k * .05, G, 0); S.step(.05); }
      back = { minOp, dist, left: S.active() };
    }
    return { n: R.LANDMARKS.length * 4, stuck: out, fade, seen, back };
  });
  await P.ctx.close();
  ok(stuck.fade && stuck.seen > 0, 'nothing turned see-through next to any landmark');
  ok(stuck.back.minOp <= .3 && stuck.back.left === 0, 'see-through ' + JSON.stringify(stuck.back));
  ok(stuck.stuck.length <= Math.ceil(stuck.n * .03), `${stuck.stuck.length}/${stuck.n} blocked: ${stuck.stuck.join(', ')}`);
  return `${stuck.n - stuck.stuck.length}/${stuck.n} clear${stuck.stuck.length ? ' (grazing: ' + stuck.stuck.join(', ') + ')' : ''}`;
});

await check('contract', async () => {
  const P = await open(b, { w: 1280, h: 800 }); await clear(P.page);
  const ui = await P.page.evaluate(async () => {
    const hud = [...document.querySelectorAll('.hud button')].map(b => b.className.split(' ')[0] + (b.className.split(' ')[1] ? '.' + b.className.split(' ')[1] : ''));
    __sv.openPad(0, 'map'); await new Promise(r => setTimeout(r, 300));
    const tabs = [...document.querySelectorAll('.pad-tabs button')].map(b => b.dataset.t);
    document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false;
    __sv.openGamesHub(0); await new Promise(r => setTimeout(r, 300));
    const hub = [...document.querySelectorAll('.hub h3')].map(h => h.textContent.slice(0, 2));
    return { hud, tabs, hubSections: hub.length };
  });
  await P.ctx.close();
  const file = 'ui-contract.json';
  if (process.argv.includes('--update-contract') || !fs.existsSync(file)) { fs.writeFileSync(file, JSON.stringify(ui, null, 1)); return 'recorded'; }
  const was = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok(JSON.stringify(was) === JSON.stringify(ui), 'UI structure changed: ' + JSON.stringify(ui));
});

await check('multiplayer', async () => {
  const up = await fetch('http://127.0.0.1:9000/myapp/').then(r => r.ok).catch(() => false);
  if (!up) return 'skipped (no local PeerJS server on 127.0.0.1:9000)';
  // direct link through a local PeerJS server; the cloud relay runs alongside (local broker, or none)
  const peer = () => { window.SV_PEER = { host: '127.0.0.1', port: 9000, path: '/myapp', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre: peer, w: 900, h: 640, lang: 'en' }), B = await open(b, { pre: peer, w: 390, h: 760, lang: 'vi', touch: true });
  for (const P of [A, B]) { await clear(P.page); await P.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; }); }
  const code = await A.page.evaluate(async () => __Net.host(__sv.sendHello()));
  await B.page.evaluate(c => { __Net.join(c, __sv.sendHello()); }, code);
  // B is not on A's friend list: B knocks, hears nothing with its microphone off, and A lets B in
  await A.page.waitForSelector('.knockpop [data-in]', { timeout: 60000 });
  await B.page.waitForFunction(() => __Net._heard > 0, null, { timeout: 15000 });
  const door = await B.page.evaluate(() => ({ knocking: __Net.knocking, partners: Object.keys(__sv.partners).length, mic: __Net.mic ? __Net.mic.getAudioTracks().some(t => t.enabled) : 'none' }));
  await A.page.evaluate(() => document.querySelector('.knockpop [data-in]').click());
  await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 60000 });
  const inside = await B.page.evaluate(() => ({ knocking: __Net.knocking, mic: __Net.mic ? __Net.mic.getAudioTracks().some(t => t.enabled) : 'none' }));
  ok(door.knocking && !door.partners && door.mic === false && !inside.knocking && inside.mic === true, 'knock ' + JSON.stringify({ door, inside }));
  await A.page.evaluate(async () => { const PG = (await import('/js/world.js')).PLAYGROUND; __sv.heroes[0].place(PG.x, PG.z - 2); }); await B.page.evaluate(async () => { const [x, z] = (await import('/js/world.js')).CITIES.find(c => c.id === 'brisbane').gates[0]; __sv.heroes[0].place(x, z); }); await A.page.waitForTimeout(2500);
  const chip = await B.page.evaluate(() => document.querySelector('.fc-txt').textContent);
  await A.page.evaluate(() => __sv.askFriendToCome(__sv.heroes[0], Object.keys(__sv.partners)[0]));
  await B.page.waitForSelector('.dialog .dch', { timeout: 15000 }); await B.page.evaluate(() => document.querySelector('.dialog .dch').click());
  for (let k = 0; k < 40; k++) { const done = await B.page.evaluate(() => { const h = __sv.heroes[0]; if (!h.walkTo) return true; const dx = h.walkTo.x - h.pos.x, dz = h.walkTo.z - h.pos.z, d = Math.hypot(dx, dz); h.place(h.pos.x + dx / d * Math.min(d - 1, 6), h.pos.z + dz / d * Math.min(d - 1, 6)); return false; }); if (done) break; await B.page.waitForTimeout(250); }
  await B.page.waitForTimeout(1200);
  const d = await B.page.evaluate(() => { const P = Object.values(__sv.partners)[0], h = __sv.heroes[0]; return Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z); });
  await B.page.evaluate(() => __sv.emote(0, 'hi')); await A.page.waitForTimeout(1200);
  const heard = await A.page.evaluate(() => __sv.bubbles.length);
  const errs = A.errors.concat(B.errors); await A.ctx.close(); await B.ctx.close();
  ok(/\d+ m/.test(chip) && d < 6 && heard > 0 && !errs.length, JSON.stringify({ chip, d, heard, errs }));
  return `knocked with the microphone off, let in, then met at ${d.toFixed(1)} m, talk bubble received`;
});

await check('roads', async () => {
  // every village and city is reached by road, a gate stands on every named road end, and nothing stands on a road
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), G = window.__sv, out = [];
    const near = (x, z, rr) => { const d = W.roadDist(x, z); return d.d < d.road.w / 2 + rr; };
    for (const c of G.world.colliders) if (c.r > .45 && near(c.x, c.z, c.r - .3)) out.push(`collider ${c.x.toFixed(1)},${c.z.toFixed(1)} r${c.r}`);
    for (const bx of G.world.boxes) { const x = (bx.x0 + bx.x1) / 2, z = (bx.z0 + bx.z1) / 2; if (near(x, z, Math.min(bx.x1 - bx.x0, bx.z1 - bx.z0) / 2)) out.push(`box ${x.toFixed(1)},${z.toFixed(1)}`); }
    for (const i of G.interactables) if (Number.isFinite(i.x) && !i.walks && near(i.x, i.z, -.5)) out.push(`thing ${i.id}`);
    const named = new Set(W.ROADS.flatMap(R => (R.gates || []).filter(Boolean)));
    const missing = W.CITIES.map(c => c.id).filter(id => !named.has(id));
    // ROAD-007 (Round U, owner: "one gate is enough"): one welcome gate per place, a city's on its main gate
    const built = G.world.gates || [], gates = built.length;
    for (const id of named) { const mine = built.filter(g => g.place === id); if (mine.length !== 1) out.push(`${id} has ${mine.length} welcome gates`); }
    for (const c of W.CITIES) { const g = built.find(q => q.place === c.id); if (g && Math.hypot(g.x - c.gates[0][0], g.z - c.gates[0][1]) > 1.5) out.push(`${c.id}'s gate is not on its main road`); }
    // R5: a side road that ends on another road's middle leaves it at 60–120° (not a shallow fork laid over it);
    // an end that simply carries on from another road's end (asphalt turning into a dirt lane) is not a junction
    const angles = [], straights = [], seg = (pts, x, z) => { let bd = 1e9, bi = 0; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))), d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < bd) { bd = d; bi = i; } } return { d: bd, i: bi }; };
    W.ROADS.forEach((R, k) => [0, 1].forEach(end => {
      if ((R.gates || [])[end]) return;
      const pts = end ? R.pts.slice().reverse() : R.pts, [x, z] = pts[0];
      for (const O of W.ROADS) { if (O === R) continue; const q = seg(O.pts, x, z); if (q.d > 1.5) continue;
        if ([O.pts[0], O.pts[O.pts.length - 1]].some(e => Math.hypot(e[0] - x, e[1] - z) < 3)) continue; // carries on from that road's end
        let j = 1; while (j < pts.length - 1 && Math.hypot(pts[j][0] - x, pts[j][1] - z) < 4) j++;
        const ux = pts[j][0] - x, uz = pts[j][1] - z, [ax, az] = O.pts[q.i], [bx, bz] = O.pts[q.i + 1];
        const a = Math.acos(Math.abs(ux * (bx - ax) + uz * (bz - az)) / (Math.hypot(ux, uz) * Math.hypot(bx - ax, bz - az) || 1)) * 180 / Math.PI;
        angles.push(Math.round(a)); if (a < 60) out.push(`road ${k} leaves another at ${a.toFixed(0)}° at ${x.toFixed(0)},${z.toFixed(0)}`);
        // …and runs straight at least 6 m before it bends (heading within 3° of its first stretch)
        const h0 = Math.atan2(pts[1][1] - z, pts[1][0] - x); let run = 0;
        for (let i = 1; i < pts.length; i++) { const h = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]); let dh = Math.abs(h - h0); if (dh > Math.PI) dh = 2 * Math.PI - dh; if (dh > .052) break; run += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); }
        const whole = run >= Math.hypot(pts[pts.length - 1][0] - x, pts[pts.length - 1][1] - z) - .1; if (!whole) straights.push(Math.round(run)); if (run < 5.9 && run < Math.hypot(pts[pts.length - 1][0] - x, pts[pts.length - 1][1] - z) - .1) out.push(`road ${k} bends only ${run.toFixed(1)} m after leaving another at ${x.toFixed(0)},${z.toFixed(0)}`); }
    }));
    // G5/R4: no grass tuft or flower on a road
    const cover = G.world.groundCover; if (!cover) out.push('world.groundCover missing'); let tufts = 0;
    if (cover) { const m = new (await import('/js/gfx.js')).THREE.Matrix4(); for (const im of cover) for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m); const x = m.elements[12], z = m.elements[14], d = W.roadDist(x, z); tufts++; if (d.d < d.road.w / 2 + .3) out.push(`grass on a road at ${x.toFixed(1)},${z.toFixed(1)}`); } }
    // (Round U, owner: "weeds still grow inside the asphalt road") nothing that grows or lies on the ground (every repeated
    // small thing: grass, flowers, bushes, rocks) stands on a road or a place's paved street (W.edgeDist)
    { const THREE = (await import('/js/gfx.js')).THREE, m4 = new THREE.Matrix4(), v = new THREE.Vector3(), sz = new THREE.Vector3(); let seen = 0;
      G.scene.traverse(o => { if (!o.isInstancedMesh || o.userData.onRoad) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); g.boundingBox.getSize(sz); if (sz.x > 3 || sz.z > 3 || sz.y > 4) return;
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); v.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); seen++; if (W.edgeDist(v.x, v.z) < -.1) { out.push(`something growing on a road or street at ${v.x.toFixed(0)},${v.z.toFixed(0)}`); break; } } });
      if (seen < 1000) out.push('only ' + seen + ' small things looked at'); }
    // roadDist skips far roads by their boxes: the same answers as looking at every road, and faster
    let diff = 0, seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, brute = (x, z) => { let bd = 1e9, br = null; for (const R of W.ROADS) for (let i = 0; i < R.pts.length - 1; i++) { const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))), d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < bd) { bd = d; br = R; } } return { d: bd, road: br }; };
    const pts = Array.from({ length: 20000 }, () => [(rnd() - .5) * W.SIZE, (rnd() - .5) * W.SIZE]);
    for (const [x, z] of pts) { const a = W.roadDist(x, z), c = brute(x, z); if (Math.abs(a.d - c.d) > 1e-9 || a.road !== c.road) diff++; }
    let t0 = performance.now(); for (const [x, z] of pts) W.roadDist(x, z); const fast = performance.now() - t0; t0 = performance.now(); for (const [x, z] of pts) brute(x, z); const slow = performance.now() - t0;
    if (diff) out.push(`roadDist differs from the full search at ${diff} of 20000 points`);
    return { out: out.slice(0, 12), n: out.length, missing, gates, places: named.size, angles, straights, tufts, speed: +(slow / fast).toFixed(1) };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.out.length && !r.missing.length && r.gates === r.places && r.places >= 12 && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.gates} welcome gates, one per village and city (on its main road), every city on a road, nothing standing on a road; ${r.angles.length} side-road junctions all 60–120° (smallest ${Math.min(...r.angles)}°) and straight ≥ 6 m before any bend (shortest ${Math.min(...r.straights)} m; short straight stubs into a gate aside); ${r.tufts} grass tufts and flowers, none on a road; roadDist ×${r.speed} faster, same answers at 20,000 points`;
});

await check('flat', async () => {
  // HARD RULE: every village, town and city is one flat level (rivers, the lake, bridge ramps, road surfaces and
  // a building's own base pad aside)
  const P = await open(b, { w: 700, h: 500 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), bad = [];
    // (round T: every village, town and city in the map, js/content/map.js)
    const M = await import('/js/content/map.js');
    const areas = M.PLACES.filter(p => ['village', 'street', 'city'].includes(p.kind)).map(p => { const [x, z] = M.anchorOf(p.id);
      return p.r != null ? { id: p.id, x0: x - p.r, x1: x + p.r, z0: z - p.r, z1: z + p.r, circ: { x, z, r: p.r }, h: p.h } : { id: p.id, x0: x - p.w, x1: x + p.w, z0: z - p.d, z1: z + p.d, h: p.h }; });
    let n = 0;
    for (const A of areas) for (let x = A.x0 + 3; x <= A.x1 - 3; x += 1.5) for (let z = A.z0 + 3; z <= A.z1 - 3; z += 1.5) {
      if (A.circ && Math.hypot(x - A.circ.x, z - A.circ.z) > A.circ.r - 3) continue;
      if (W.riverDist(x, z) < 14 || Math.hypot(x - W.LAKE.x, z - W.LAKE.z) < W.LAKE.r + 6 || W.bridgeAt(x, z, 10, 13, 19)) continue;
      const h = W.heightAt(x, z); if (h < W.WATER + .5) continue; n++;
      if (Math.abs(h - A.h) <= .25) continue;
      const rd = W.roadDist(x, z); if (rd.d < rd.road.w / 2 + .5) continue;
      if (W.FOOTPRINTS.some(F => x >= F.x0 - F.pad && x <= F.x1 + F.pad && z >= F.z0 - F.pad && z <= F.z1 + F.pad)) continue;
      bad.push(`${A.id} ${x.toFixed(0)},${z.toFixed(0)} ${h.toFixed(2)}≠${A.h}`);
    }
    return { n, bad, places: areas.length };
  });
  await P.ctx.close();
  ok(!r.bad.length, r.bad.slice(0, 12).join('; ') + (r.bad.length > 12 ? ` (+${r.bad.length - 12})` : ''));
  return `${r.n} spots in ${r.places} villages and cities, all level`;
});

await check('roadshape', async () => {
  // HARD RULE: roads are straight or perfectly curved (no step turns more than 8°), never steeper than the owner's R3
  // (asphalt 8 %, dirt 12 %: ROAD_GRADE in roads.js, no allowance anywhere), and every change of slope is rounded
  // (a place too high for its road is lowered, never the rule loosened)
  const P = await open(b, { w: 700, h: 500 }); await clear(P.page);
  const r = await P.page.evaluate(() => { const bad = []; let len = 0;
    __sv.world.roadLines.forEach((L, k) => { const G = ({ asphalt: .08, dirt: .12, footpath: .15 }[L.kind] || .12) + .002; // (+0.2 % for rounding the sampled heights)
      for (let i = 1; i < L.ys.length; i++) { const d = Math.hypot(L.pts[i][0] - L.pts[i - 1][0], L.pts[i][1] - L.pts[i - 1][1]); len += d; const g = Math.abs(L.ys[i] - L.ys[i - 1]) / (d || 1);
        if (g > G && !L.deck[i]) bad.push(`road ${k} steep ${(g * 100).toFixed(0)}% at ${L.pts[i].map(v => v.toFixed(0))}`);
        if (i < L.ys.length - 1) { const s1 = L.ys[i] - L.ys[i - 1], s2 = L.ys[i + 1] - L.ys[i]; if (Math.abs(s2 - s1) > .16 && !L.deck[i]) bad.push(`road ${k} kink ${Math.abs(s2 - s1).toFixed(2)} at ${L.pts[i].map(v => v.toFixed(0))}`);
          const a1 = Math.atan2(L.pts[i][1] - L.pts[i - 1][1], L.pts[i][0] - L.pts[i - 1][0]), a2 = Math.atan2(L.pts[i + 1][1] - L.pts[i][1], L.pts[i + 1][0] - L.pts[i][0]); let t = Math.abs(a2 - a1); if (t > Math.PI) t = 2 * Math.PI - t;
          if (t * 180 / Math.PI > 8) bad.push(`road ${k} turns ${(t * 180 / Math.PI).toFixed(0)}° at ${L.pts[i].map(v => v.toFixed(0))}`); } } });
    return { bad, len }; });
  await P.ctx.close();
  ok(!r.bad.length, r.bad.slice(0, 10).join('; '));
  return `${Math.round(r.len)} m of road: straight or smoothly curved, never steeper than 8 % (dirt 12 %), rounded`;
});

await check('phone', async () => {
  // every main screen opened on a desktop, a phone and a tablet side by side (rule UI-006, owner round P: always check
  // all three): nothing spills off the side, every button (close, play, next…) is fully on the screen, tab names are
  // never broken in the middle of a word, windows dim the game without blurring it, and nothing goes wrong
  const D = await open(b, { w: 1180, h: 760 }), M = await open(b, { w: 390, h: 760, touch: true, lang: 'vi' }), Tb = await open(b, { w: 820, h: 1180, touch: true });
  const SCREENS = [
    ['games hub', () => __sv.openGamesHub(0)], ['map', () => __sv.openPad(0, 'map')], ['bag', () => __sv.openPad(0, 'bag')], ['friends', () => __sv.openPad(0, 'friend')],
    ['quick settings', () => __sv.openQuick(0)], ['wardrobe', () => __sv.openWardrobe(0)],
    ['how to play', async () => { (await import('/js/howto.js')).openHowTo('oanquan', {}); }],
    ['tale', async () => { (await import('/js/tales.js')).openTheatre((await import('/js/learn.js')).TALES[0], {}); }],
    ['a game', () => { __sv.playGame(0, 'caro', 'replay'); }],
    ['dialog', () => { __sv.dialog('Bà Năm', [['Hello! Shall we play?', 'Chào cháu! Chơi nhé?']], [['▶ Play!', '▶ Chơi!'], ['👋 Later', '👋 Để sau']]); }]
  ];
  const bad = [];
  for (const P of [D, M, Tb]) await clear(P.page);
  for (const [name, fn] of SCREENS) {
    for (const [P, tag] of [[D, 'desktop'], [M, 'phone'], [Tb, 'tablet']]) {
      await P.page.evaluate(`(${fn.toString()})()`); await P.page.waitForTimeout(1400);
      const r = await P.page.evaluate(() => {
        const W = innerWidth, H = innerHeight, out = [];
        if (document.scrollingElement.scrollWidth > W + 1) out.push('page scrolls sideways (' + document.scrollingElement.scrollWidth + ' > ' + W + ')');
        const top = document.querySelector('.wardrobe, .hub, .pad, .howto, .theatre, .gl, .dialog:not(.out), .modal');
        if (top) for (const btn of top.querySelectorAll('button')) { const b = btn.getBoundingClientRect(), cs = getComputedStyle(btn); if (!b.width || cs.visibility === 'hidden' || btn.closest('[hidden]')) continue;
          if (/^(x|th-x|ht-x|gl-x|dch|ht-play|th-next|gl-next)$/.test(btn.className.split(' ')[0]) && (b.left < -1 || b.right > W + 1 || b.top < -1 || b.bottom > H + 1)) out.push(`button "${(btn.textContent || btn.getAttribute('aria-label') || btn.className).trim().slice(0, 20)}" off screen (${[b.left, b.top, b.right, b.bottom].map(Math.round)} in ${W}×${H}; on top: ${[...document.querySelectorAll('.dialog, .modal, .reward, .hub, .pad, .gl, .theatre, .songs')].map(e => e.className.split(' ').slice(0, 2).join('.')).join(',')})`); }
        for (const t of document.querySelectorAll('.pad-tabs small')) { const lh = parseFloat(getComputedStyle(t).lineHeight) || 13; if (t.getClientRects().length && t.getBoundingClientRect().height > lh * 1.6 + 2) out.push(`tab name "${t.firstChild && t.firstChild.textContent}" broken over lines`); }
        const md = document.querySelector('.modal'); if (md && /blur/.test(getComputedStyle(md).backdropFilter || '')) out.push('the window blurs the game behind it');
        return out;
      });
      r.forEach(x => bad.push(`${name} (${tag}): ${x}`));
      if (r.length) await P.page.screenshot({ path: `${os.tmpdir()}/sv-phone-${name.replace(/\W+/g, '-')}-${tag}.png` }).catch(() => { });
      await P.page.evaluate(() => { document.querySelectorAll('.modal, .hub, .pad, .howto, .theatre, .gl, .dialog, .storybook, .vc-pop, .wardrobe').forEach(e => e.remove()); __sv.paused = false; __sv.closeUp = null; });
    }
  }
  // (Online's request, 11 Oct) a friend's row: the Join button never lies over the friend's status, and every button is
  // 44 px or more, on the computer, the phone and the tablet
  for (const [tag, Q] of [['desktop', D], ['phone', M], ['tablet', Tb]]) {
    const fr = await Q.page.evaluate(async () => {
      const { settings } = await import('/js/state.js'), { Net } = await import('/js/net.js');
      settings.online = true; settings.friendsOn = true; settings.lang = 'vi'; settings.friends = [{ code: 'KIWI-2468', name: 'Bé Bin Nguyễn' }];   // (as reported: Vietnamese, a long status)
      Net.friends.status['KIWI-2468'] = { online: true, seen: Date.now(), name: 'Bé Bin Nguyễn', room: 'ROOM42', where: 'Thành phố Hồ Chí Minh' };
      const box = document.createElement('div'); box.className = 'modal pad'; box.innerHTML = '<div class="card"><div class="tbody"></div></div>'; document.body.appendChild(box);
      const body = box.querySelector('.tbody'); __sv.drawOnlinePanel(body, () => { }); await new Promise(r => setTimeout(r, 200));
      const row = body.querySelector('.flist .frow'), st = row.querySelector('.fst').getBoundingClientRect(), btns = [...row.querySelectorAll('.btn')].map(e => e.getBoundingClientRect());
      const out = { join: !!row.querySelector('[data-joinf]'), over: btns.filter(q => st.left < q.right && q.left < st.right && st.top < q.bottom && q.top < st.bottom).length, small: btns.filter(q => q.height < 44).length };
      box.remove(); return out;
    });
    if (!fr.join || fr.over || fr.small) bad.push(`${tag}: friends row: Join shown ${fr.join}, buttons over the status ${fr.over}, under 44 px ${fr.small}`);
  }
  const errs = D.errors.concat(M.errors, Tb.errors); await D.ctx.close(); await M.ctx.close(); await Tb.ctx.close();
  ok(!bad.length && !errs.length, JSON.stringify({ bad, errs }));
  return `${SCREENS.length} screens checked on desktop, phone and tablet; a friend's Join button clear of the status`;
});

await check('solid', async () => {
  // nobody walks through houses and things (js/solids.js), on a desktop and on a phone side by side:
  // · walking straight at 250 solid spots that have no round or box collider of their own never gets inside
  // · everything you can tap still has open ground to stand on within reach
  // · the second start uses the saved map
  const D = await open(b, { w: 1180, h: 760 }), M = await open(b, { w: 390, h: 760, touch: true, lang: 'vi' });
  const audit = P => P.page.evaluate(async () => {
    const G = __sv, W = G.world, st = await G.solidsReady, N = Math.round(Math.sqrt(W.solid.length)), H = N / 4, bad = []; // the grid's size comes from the valley (round T: 480 m)
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const covered = (x, z) => W.colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r) || W.boxes.some(b => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1);
    const cells = []; for (let k = 0; k < N * N; k++) if (W.solid[k]) cells.push(k);
    let tried = 0;
    for (let n = 0; n < 4000 && tried < 250; n++) {
      const k = cells[Math.floor(rnd() * cells.length)], cx = (k % N) * .5 - H + .25, cz = Math.floor(k / N) * .5 - H + .25;
      if (covered(cx, cz)) continue;
      const an = rnd() * Math.PI * 2, sx = cx + Math.cos(an) * 3, sz = cz + Math.sin(an) * 3;
      const p = { x: sx, z: sz, y: W.groundAt(sx, sz) }, q = { ...p }; W.collide(q, .45); if (Math.hypot(q.x - p.x, q.z - p.z) > .01) continue; // start on open ground
      tried++;
      for (let s = 0; s < 40; s++) { const dx = cx - p.x, dz = cz - p.z, d = Math.hypot(dx, dz) || 1; p.x += dx / d * .15; p.z += dz / d * .15; W.collide(p, .45); p.y = W.groundAt(p.x, p.z, p.y + 1); }
      if (W.solidAt(p.x, p.z)) bad.push(`walked into ${cx.toFixed(1)},${cz.toFixed(1)}`);
    }
    let lost = 0; const lostAt = [];
    for (const it of G.interactables) {
      if (!Number.isFinite(it.x) || (it.y != null && it.y > 100)) continue;
      let found = false;
      for (let r = 0; r < (it.r || 2.5) - .2 && !found; r += .4) for (let s = 0; s < 16 && !found; s++) { const an = s / 16 * Math.PI * 2, p = { x: it.x + Math.cos(an) * r, z: it.z + Math.sin(an) * r }; p.y = W.groundAt(p.x, p.z); const q = { ...p }; W.collide(q, .45); if (Math.hypot(q.x - p.x, q.z - p.z) < .05) found = true; }
      if (!found) { lost++; lostAt.push(it.id); }
    }
    return { st, tried, bad, lost, lostAt: lostAt.slice(0, 8) };
  });
  const rd = await audit(D); console.log('  solid: desktop', JSON.stringify(rd.st)); const rm = await audit(M); console.log('  solid: phone', JSON.stringify(rm.st)); // one after the other: two software-drawn worlds at once are very slow
  await M.page.reload(); await start(M.page); await clear(M.page); console.log('  solid: phone restarted'); const again = await M.page.evaluate(async () => (await __sv.solidsReady).cached);
  const errs = D.errors.concat(M.errors); await D.ctx.close(); await M.ctx.close();
  for (const [r, tag] of [[rd, 'desktop'], [rm, 'phone']]) {
    ok(r.st.cells > 20000, `${tag}: solid map too small (${r.st.cells} cells)`);
    ok(r.tried >= 200, `${tag}: only ${r.tried} spots tried`);
    ok(!r.bad.length, `${tag}: ${r.bad.slice(0, 8).join('; ')} (${r.bad.length}/${r.tried})`);
    ok(!r.lost, `${tag}: ${r.lost} things you tap have no open ground near them: ${r.lostAt.join(', ')}`);
  }
  ok(rd.st.cells === rm.st.cells, `desktop and phone maps differ (${rd.st.cells} vs ${rm.st.cells})`);
  ok(again, 'the saved map was not used on the second start');
  ok(!errs.length, errs.join(' | '));
  return `${rd.st.cells} solid cells from ${rd.st.meshes} objects (${rd.st.work} ms work); ${rd.tried} walk-ins stopped on desktop and phone; saved map reused`;
});

await check('voice', async () => {
  // HARD RULE: the downloaded (recorded) voices are the voice, on phones too. A recorded line must never be read by
  // the phone's own voice: not on a normal phone, and not on one whose Web Audio stays asleep (as iPhones do until a
  // tap takes, or after a call): then the plain audio player plays the same recording.
  const probe = async asleep => {
    const pre = `window.__speaks = 0; window.__plays = 0; window.__sources = 0;
      const sp = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => { window.__speaks++; };
      HTMLMediaElement.prototype.play = function () { if (!/^data:/.test(this.src)) window.__plays++; setTimeout(() => this.onended && this.onended(), 50); return Promise.resolve(); };
      const st = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.length > 1) window.__sources++; return st.apply(this, a); };
      ${asleep ? "Object.defineProperty(AudioContext.prototype, 'state', { get: () => 'suspended' }); AudioContext.prototype.resume = () => Promise.resolve();" : ''}`;
    const P = await open(b, { w: 390, h: 760, touch: true, lang: 'vi', pre, settings: { voice: true } }); await clear(P.page);
    await P.page.mouse.click(195, 380); await P.page.waitForTimeout(300); // the child's first tap
    const r = await P.page.evaluate(async () => {
      const V = await import('/js/voice.js'), { FAMILY_PHRASES } = V; let rec = null; for (let i = 0; i < 60 && !V.voicePack(); i++) await new Promise(r => setTimeout(r, 250)); window.__svVoiceLog = (l, t, has) => { if (has && !rec) rec = t; };
      for (const ph of FAMILY_PHRASES) { V.sayIn('vi', ph.vi); if (rec) break; }
      if (!rec) return { none: true };
      window.__speaks = 0; window.__plays = 0; window.__sources = 0; await V.sayAsync(rec, rec);
      return { line: rec, speaks: window.__speaks, plays: window.__plays, sources: window.__sources, diag: V.voiceDiag };
    });
    await P.ctx.close(); return r;
  };
  const awake = await probe(false), asleep = await probe(true);
  ok(!awake.none, 'no recorded line found to try');
  ok(awake.speaks === 0 && awake.sources > 0, 'a recorded line was not played from the recording: ' + JSON.stringify(awake));
  ok(asleep.speaks === 0 && asleep.plays > 0, 'with Web Audio asleep (iPhone), a recorded line used the phone voice: ' + JSON.stringify(asleep));
  return `"${awake.line}" plays from the recording on a phone, and still does with Web Audio asleep (plain player); the phone's voice is never used for it`;
});

await check('voicepack', async () => {
  // HARD RULE (VOICE-001): the recorded voices are downloaded to the device by themselves, with a small quiet progress
  // bar; every open checks quietly that they are still there and fetches only what is missing. (A cut-down pack keeps it quick.)
  // a fresh phone: its own browser profile, the cut-down pack list from the very first load, saving voices on
  // (round R item 12: a phone on mobile data downloads beyond the core only after a grown-up's yes, packCell; this check
  // is about the quiet download itself, so the yes is given; voicearea checks the question)
  const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true }), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await ctx.addInitScript(seedPlayers);
  await ctx.addInitScript(() => { const o = JSON.parse(localStorage.getItem('sv2_settings') || '{}'); Object.assign(o, { lang: 'vi', voice: false, sound: false, music: false, quality: 'low', autoPack: true, packCell: true }); localStorage.setItem('sv2_settings', JSON.stringify(o)); });
  const P = { ctx, page, errors };
  await P.ctx.route('**/voices/manifest.json', async route => { const r = await route.fetch(), j = await r.json(), keep = Object.keys(j.lines).slice(0, 24), lines = {}, langOf = {}; for (const h of keep) { lines[h] = j.lines[h]; if (j.langOf) langOf[h] = j.langOf[h]; } await route.fulfill({ json: { ...j, lines, langOf, made: 'test' } }); });
  // every text the bar shows is written down as it changes
  await P.ctx.addInitScript(() => { window.__packLog = []; new MutationObserver(() => { const e = document.querySelector('.packbar span'); if (e && window.__packLog[window.__packLog.length - 1] !== e.textContent) window.__packLog.push(e.textContent); }).observe(document, { subtree: true, childList: true, characterData: true }); });
  let firstLoad = true;
  const openAgain = async () => { if (firstLoad) { firstLoad = false; await P.page.goto(URL); } else await P.page.reload(); await start(P.page); await clear(P.page); await P.page.waitForFunction(() => window.__packLog.some(x => /✓/.test(x)), null, { timeout: 60000 }).catch(() => { }); return P.page.evaluate(() => window.__packLog); };
  const state = () => P.page.evaluate(async () => { const c = await caches.open('sv-voices'); return { files: (await c.keys()).filter(r => /\/voices\/.+\.mp3$/.test(r.url)).length, saved: JSON.parse(localStorage.getItem('sv2_settings')).packSaved || '' }; });
  const first = await openAgain(), s1 = await state();
  ok(first.some(x => /%/.test(x)) && first.some(x => /✓/.test(x)) && s1.files >= 24 && s1.saved === '24:2:test', 'first open: ' + JSON.stringify({ first: first.slice(0, 4), s1 }));
  // next open: everything is there, so nothing downloads and the bar says nothing (round O, owner: it looked as if the
  // voices loaded on every start, and listing all the files each time cost battery)
  await P.page.reload(); await start(P.page); await clear(P.page); await P.page.waitForTimeout(10000);
  const second = await P.page.evaluate(() => window.__packLog);
  ok(!second.length, 'next open: ' + JSON.stringify(second));
  // the phone cleared some files: the next open fetches only those, quietly with the bar
  await P.page.evaluate(async () => { const c = await caches.open('sv-voices'); const ks = (await c.keys()).filter(r => /\.mp3$/.test(r.url)); for (const r of ks.slice(0, 5)) await c.delete(r); });
  const third = await openAgain(), s3 = await state();
  await P.page.screenshot({ path: 'out/voicepack-phone.png' });
  const errs = P.errors; await P.ctx.close();
  ok(third.some(x => /✓/.test(x)) && s3.files >= 24, 'missing files were not fetched again: ' + JSON.stringify({ third: third.slice(0, 3), s3 }));
  ok(!errs.length, errs.join(' | '));
  return `first open downloads with a small bar (${first.map(x => '"' + x + '"').slice(0, 2).join(' → ')} … "${first[first.length - 1]}"), the next open shows and downloads nothing, and files the phone lost are fetched again`;
});

await check('voicecover', async () => {
  // (round R item 12) the coverage check: every line the game can speak has its recordings (both voices), is in the
  // pack's list and in an area; lines with changing words are templates whose fixed pieces, gap words and numbers are
  // recorded as parts; what can't be listed in advance is counted with its reason (tools/make-voice-pack.mjs --cover)
  const { execFileSync } = await import('child_process');
  let out = ''; try { out = execFileSync(process.execPath, ['../tools/make-voice-pack.mjs', '--cover'], { encoding: 'utf8', maxBuffer: 1 << 26 }); } catch (e) { out = (e.stdout || '') + ''; }
  const r = JSON.parse(out.trim().split('\n').pop());
  ok(!r.bad.length, `${r.bad.length} lines not covered: ` + r.bad.slice(0, 12).join(' | '));
  // in the game: a line with a number is put together from recorded parts, and a gap that is a name is left out; the
  // phone's own voice is never used for either
  const pre = `window.__speaks = 0; window.__srcs = 0; speechSynthesis.speak = u => { window.__speaks++; setTimeout(() => u.onend && u.onend(), 10); };
    const st = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.length > 1) { window.__srcs++; setTimeout(() => this.onended && this.onended(), 30); } return st.apply(this, a); };`;
  const P = await open(b, { w: 900, h: 640, pre, settings: { voice: true, bilingual: false } }); await clear(P.page);
  const g = await P.page.evaluate(async () => {
    const V = await import('/js/voice.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    for (let k = 0; k < 60 && !V.voicePack(); k++) await wait(250);
    const res = {};
    for (const [key, line] of [['number', 'You rolled 47! Count with me.'], ['name', 'Zorbly is here! Hold on and kick your legs: tap, tap, tap!']]) {
      window.__speaks = 0; window.__srcs = 0; res[key] = { parts: V.lineParts('en', line) };
      await V.sayAsync(line, line); res[key].speaks = window.__speaks; res[key].srcs = window.__srcs;
    }
    return res;
  });
  const errs = P.errors; await P.ctx.close();
  ok(g.number.parts && g.number.parts.some(p => p[1] === '47') && !g.number.speaks && g.number.srcs >= 3, 'a line with a number: ' + JSON.stringify(g.number));
  ok(g.name.parts && g.name.parts.some(p => p[1] === 'Zorbly') && !g.name.speaks && g.name.srcs >= 1, 'a line with a name: ' + JSON.stringify(g.name));
  ok(!errs.length, errs.join(' | '));
  return `${r.lines} lines and ${r.parts} parts recorded, ${r.templates} templates, ${r.areas} areas; ${Object.entries(r.reasons).map(([k, v]) => `${v} × ${k}`).join('; ')}; "You rolled 47!" plays from ${g.number.srcs} recorded parts and a name in a gap is left out, never the phone's voice`;
});

await check('voicearea', async () => {
  // (round R item 12, owner 10 Oct: "wifi should automatically, ask user to allow download over mobile") a new phone on
  // mobile data downloads only the core, only in its children's language, then asks a grown-up (press and hold); Not now
  // keeps it at the core; on Wi-Fi the rest comes area by area, the place the child is in first; a computer that can't
  // tell counts as Wi-Fi; a start with the core already there downloads nothing
  const areas = JSON.parse(fs.readFileSync('../voices/areas.json', 'utf8')), groupOf = new Map();
  for (const [g, hs] of Object.entries(areas.groups)) for (const h of String(hs).split(' ')) groupOf.set(h, g);
  const mb = n => n / 1048576, core = areas.size.core;
  ok(mb(core.en) >= 5 && mb(core.en) <= 8 && mb(core.vi) >= 5 && mb(core.vi) <= 8, `the core pack is not 5–8 MB per language: en ${mb(core.en).toFixed(1)}, vi ${mb(core.vi).toFixed(1)}`);
  const place = ['hanoi', 'village', 'town', 'market'].find(g => areas.groups[g] && g !== 'core') || Object.keys(areas.groups).find(g => !['core', 'games', 'stories', 'festivals', 'world'].includes(g));
  // a pretend connection the check can switch: navigator.connection.type 'cellular' or 'wifi'
  const net = type => `(() => { const c = new EventTarget(); c.type = '${type}'; c.saveData = false; Object.defineProperty(navigator, 'connection', { get: () => c, configurable: true }); window.__setNet = t => { c.type = t; c.dispatchEvent(new Event('change')); }; })();`;
  const watch = P => { const got = []; P.page.on('request', q => { const m = /\/voices\/(\w+)\/(\w)\/([\w-]+)\.mp3/.exec(q.url()); if (m) got.push({ lang: m[1], g: groupOf.get(m[3]) || 'world' }); }); return got; };
  const P = await open(b, { w: 390, h: 760, touch: true, play: false, pre: net('cellular'), settings: { autoPack: true, lang: 'en', bilingual: false } });
  const got = watch(P);
  await start(P.page); await clear(P.page);
  await P.page.mouse.click(195, 380);
  await P.page.waitForSelector('.packask', { timeout: 180000 });
  await P.page.waitForTimeout(1500);
  const n1 = got.length, notCore = got.filter(x => x.g !== 'core'), notEn = got.filter(x => x.lang !== 'en');
  const text = await P.page.$eval('.packask', e => e.textContent);
  await P.page.screenshot({ path: 'out/voicearea-phone.png' });
  ok(n1 > 50 && !notCore.length && !notEn.length, `mobile data: ${n1} files, ${notCore.length} not in the core (${JSON.stringify(notCore.slice(0, 3))}), ${notEn.length} not English`);
  ok(/mobile data/.test(text) && /\d+ MB/.test(text), 'the question: ' + text);
  // a quick tap on Yes is not a yes (a little one's finger); Not now closes it and nothing more downloads
  await P.page.click('.packask button'); await P.page.waitForTimeout(400);
  ok(await P.page.$('.packask'), 'a quick tap on Yes said yes');
  await P.page.click('.packask button:last-child'); await P.page.waitForTimeout(3000);
  ok(!(await P.page.$('.packask')) && got.length === n1, `after Not now: ${got.length - n1} more files`);
  // onto Wi-Fi, in a place: the rest downloads by itself, that place first
  await P.page.evaluate(async place => { const { events } = await import('/js/core/events.js'); events.emit('PlayerEnteredVillage', { playerId: 'player:test', villageId: 'place:' + place }); window.__setNet('wifi'); }, place);
  for (let k = 0; k < 60 && got.length < n1 + 12; k++) await P.page.waitForTimeout(500);
  const next = got.slice(n1, n1 + 12);
  ok(next.length >= 12 && next.every(x => x.g === place) && next.every(x => x.lang === 'en'), `on Wi-Fi the first files after the core: ${JSON.stringify(next.slice(0, 4))} (wanted ${place})`);
  await P.ctx.close();
  // the next start on mobile data, core there, Not now said: nothing downloads and nothing is asked
  const Q = await open(b, { w: 390, h: 760, touch: true, play: false, pre: net('cellular'), settings: { autoPack: true, lang: 'en', bilingual: false } });
  // (a fresh profile: give it the core first, with the grown-up's answer already given)
  const got2 = watch(Q); await start(Q.page); await clear(Q.page); await Q.page.mouse.click(195, 380);
  await Q.page.waitForSelector('.packask', { timeout: 180000 }); await Q.page.click('.packask button:last-child');
  const n2 = got2.length; await Q.page.reload(); await start(Q.page); await clear(Q.page); await Q.page.mouse.click(195, 380); await Q.page.waitForTimeout(10000);
  const again = got2.length - n2, asked = !!(await Q.page.$('.packask'));
  const errs = Q.errors.concat(P.errors); await Q.ctx.close();
  ok(!again && !asked, `next start with the core there: ${again} files downloaded, asked again: ${asked}`);
  // a computer that can't tell its connection counts as Wi-Fi: past the core with no question
  const C = await open(b, { w: 1180, h: 760, play: false, pre: `Object.defineProperty(navigator, 'connection', { get: () => undefined, configurable: true });`, settings: { autoPack: true, lang: 'vi', bilingual: false } });
  const got3 = watch(C); await start(C.page); await clear(C.page); await C.page.mouse.click(590, 380);
  // (r63, owner: the bar said 108 %) every progress report stays at or under 100 %, the bar's words too
  await C.page.evaluate(async () => { const V = await import('/js/voice.js'); window.__packOver = []; V.onPackProgress(e => { if (e.state === 'loading' && e.done > e.total) window.__packOver.push(e.done + '/' + e.total); const t = document.querySelector('.packbar') && document.querySelector('.packbar').textContent; const m = t && /(\d+)\s*%/.exec(t); if (m && +m[1] > 100) window.__packOver.push(t); }); });
  // (the core, about 550 files, comes first: in the full suite that can take a few minutes)
  for (let k = 0; k < 720 && !got3.some(x => x.g !== 'core'); k++) await C.page.waitForTimeout(500);
  const asked3 = !!(await C.page.$('.packask')), en3 = got3.filter(x => x.lang === 'en').length, over3 = await C.page.evaluate(() => window.__packOver); await C.ctx.close();
  ok(!over3.length, `the voices bar went past 100 %: ${over3.slice(0, 3).join(', ')}`);
  ok(got3.some(x => x.g !== 'core') && !asked3 && !en3, `a computer: past the core ${got3.some(x => x.g !== 'core')}, asked ${asked3}, English files for a Vietnamese family ${en3}`);
  ok(!errs.length, errs.join(' | '));
  return `core ${mb(core.en).toFixed(1)} MB (English) / ${mb(core.vi).toFixed(1)} MB (Vietnamese) of ${(Object.values(areas.size).reduce((a, z) => a + (z.en || 0) + (z.vi || 0) + (z.zh || 0) + (z.hi || 0), 0) / 1048576).toFixed(0)} MB; mobile data: ${n1} core files in English only, then "${text.slice(0, 50)}…" (hold for yes); Wi-Fi: ${place} first; the next start downloads nothing; a computer goes on by itself`;
});

await check('welcomevoice', async () => {
  // HARD RULE 11: the recorded voice is the voice. Lines with a child's or friend's name can't be recorded, so the game
  // shows the name and speaks a recorded line (owner, round F: the welcome was still in the phone's voice). A new
  // player: tapping their picture, starting, and Ông Cú's welcome must speak only recorded lines.
  const P = await open(b, { w: 900, h: 640, play: false, settings: { voice: true } });
  await P.page.evaluate(() => { localStorage.removeItem('sv2_voiceMisses'); });
  const said = [];
  await P.page.exposeFunction('__said', t => said.push(t));
  await P.page.evaluate(async () => { const V = await import('/js/voice.js'), S = await import('/js/state.js'); V.spoken.push(t => window.__said(t)); S.profiles[0].name = 'Kiwi'; S.profiles[0].quests.owl = false; S.saveProfiles(true); }); // (a name no recording can know, like a real child's)
  await (await import('./harness.mjs')).start(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], V = await import('/js/voice.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    for (let k = 0; k < 40 && !V.voicePack(); k++) await wait(250);
    if (!document.querySelector('.dialog:not(.out)')) { h.profile.quests.owl = false; G._owlAuto = false; }
    const owl = G.interactables.find(i => /owl/i.test(i.id || '')); if (owl) { h.place(owl.x, owl.z + 1.5); }
    // (round R) with the story on, Ông Cú's welcome is the prologue film, then "Who will fly with you, Kiwi?"
    for (let k = 0; k < 60 && !document.querySelector('.dialog:not(.out)'); k++) { await wait(250); const x = document.querySelector('.theatre .th-x'); if (x && k > 8) x.click(); }
    const d = document.querySelector('.dialog .dtext'), shown = d ? d.textContent : '';
    return { shown, pack: !!V.voicePack() };
  });
  const rec = await P.page.evaluate(async lines => { const V = await import('/js/voice.js'), hash = (await import('/js/packhash.js')).lineHash, pack = V.voicePack(); return lines.map(t => [t, !!(pack && pack.lines[hash('en', t)])]); }, said);
  const errs = P.errors; await P.ctx.close();
  const notRecorded = rec.filter(([, ok]) => !ok).map(([t]) => t);
  ok(r.pack && /Good morning, Kiwi|with you, Kiwi/.test(r.shown) && said.length && !notRecorded.length && !errs.length, JSON.stringify({ shown: r.shown, said, notRecorded, errs }));
  return `Ông Cú's welcome shows the child's name ("${r.shown.slice(0, 40)}…") and every spoken line (${said.length}) has a recording`;
});

await check('studio', async () => {
  // Sparkle Studio online and the exe: one program (same pages, same engine, same version as the game)
  const build = /BUILD = '([^']+)'/.exec(fs.readFileSync('../js/build.js', 'utf8'))[1], studio = JSON.parse(fs.readFileSync('../studio/version.json', 'utf8')).studio;
  ok(build === studio, `studio/version.json says ${studio} but the game is ${build}: bump them together (and rebuild SparkleStudio.exe)`);
  return await studioCheck(b);
});

await check('ground', async () => {
  // every building on dry, level ground (not over the river or the lake), no road floating, buried or in water,
  // and the build number in the game matches the service worker's version
  const P = await open(b, { w: 900, h: 700 }); await clear(P.page);
  const r = await groundAudit(P.page);
  const build = await P.page.evaluate(async () => (await import('/js/build.js')).BUILD);
  const sw = fs.readFileSync(new globalThis.URL('../sw.js', import.meta.url), 'utf8'), ver = /VERSION = '([^']+)'/.exec(sw)[1];
  await P.ctx.close();
  ok(!r.bad.length && !r.roadBad.length, 'problems: ' + JSON.stringify([...r.bad, ...r.roadBad].slice(0, 6)));
  ok(ver.endsWith('-' + build), `build ${build} does not match sw.js VERSION ${ver}`);
  return `${r.buildings} buildings and ${r.roads} roads checked, build ${build}`;
});

await check('resume', async () => {
  // a child comes back where they were (owner, round 30), with a "welcome back"; a spot that is no longer good
  // (in the lake, inside a building) starts them at the usual place instead
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  // (round T: a spot on a road far from home, from the map; home is by Ông Cú on the plateau)
  const [rx, rz] = await P.page.evaluate(async () => { const R = (await import('/js/content/map.js')).ROADS.find(R => R.id === 'vn_north'), [a, b] = [R.pts[0], R.pts[R.pts.length - 1]]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }); // (the middle of the Vietnam road, north part)
  const { home, lake } = await P.page.evaluate(async () => { const W = await import('/js/world.js'); return { home: { x: W.PLATEAU.x - 3, z: W.PLATEAU.z - 4 }, lake: { x: W.LAKE.x, z: W.LAKE.z } }; });
  await P.page.evaluate(([x, z]) => { __sv.heroes[0].place(x, z); }, [rx, rz]); await P.page.waitForTimeout(1500); await clear(P.page);
  await P.page.waitForFunction(([x, z]) => { const p = __sv.heroes[0].profile.pos; return p && Math.hypot(p.x - x, p.z - z) < 2; }, [rx, rz], { timeout: 15000 }).catch(() => { });
  const saved = await P.page.evaluate(() => __sv.heroes[0].profile.pos);
  await P.page.reload(); await start(P.page);
  const toastText = await P.page.waitForFunction(() => /Welcome back/.test(document.querySelector('#toast')?.textContent || ''), null, { timeout: 8000 }).then(() => P.page.evaluate(() => document.querySelector('#toast').textContent)).catch(() => '');
  const back = await P.page.evaluate(() => ({ x: __sv.heroes[0].pos.x, z: __sv.heroes[0].pos.z }));
  // now a spot in the middle of Mirror Lake and one inside a building: both start at home
  const tries = [];
  for (const spot of [lake, await P.page.evaluate(() => { const b = __sv.world.boxes.find(b => b.x1 - b.x0 > 3 && b.z1 - b.z0 > 3); return { x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2 }; })]) {
    // (the game saves the spot when it is put away, so the bad spot is written from another page of the site)
    await P.page.goto(URL + 'manifest.webmanifest'); await P.page.evaluate(s => { const k = 'sv2_profiles', a = JSON.parse(localStorage.getItem(k)); a[0].pos = s; localStorage.setItem(k, JSON.stringify(a)); }, spot);
    await P.page.goto(URL); await start(P.page);
    tries.push(await P.page.evaluate(() => ({ x: +__sv.heroes[0].pos.x.toFixed(1), z: +__sv.heroes[0].pos.z.toFixed(1) })));
  }
  const errs = P.errors; await P.ctx.close();
  const near = (a, x, z, d) => Math.hypot(a.x - x, a.z - z) < d;
  ok(saved && near(saved, rx, rz, 2) && near(back, saved.x, saved.z, 1.5) && /Welcome back/.test(toastText) && tries.every(t => near(t, home.x, home.z, 3)) && !errs.length, JSON.stringify({ saved, back, toastText, tries, errs }));
  return `came back at ${back.x.toFixed(0)}, ${back.z.toFixed(0)} with "${toastText}"; a spot in the lake and one inside a building both started at home`;
});

await check('migrate', async () => {
  // (round T, owner's decision 5) the valley's layout has a version (js/content/map.js MAP_VERSION). A saved spot is stamped
  // with it; a spot with no stamp belongs to map 'C' (saved before round T); a spot from another layout is never used:
  // the child starts at home once, with "The valley has grown!" (stickers, stories, farm and house kept). The family's
  // Studio map content from another layout is put aside (parked), never placed at the wrong spot.
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  const M = await P.page.evaluate(async () => { const m = await import('/js/content/map.js'), W = await import('/js/world.js'); return { v: m.MAP_VERSION, noStamp: m.onThisMap(undefined), home: { x: W.PLATEAU.x - 3, z: W.PLATEAU.z - 4 }, spot: W.CITIES.find(c => c.id === 'hanoi').gates[0] }; });
  const [sx, sz] = M.spot;
  await P.page.evaluate(([x, z]) => __sv.heroes[0].place(x, z + 4), [sx, sz]); // (just outside Hà Nội's east gate, on its road)
  await P.page.waitForFunction(([x, z]) => { const p = __sv.heroes[0].profile; return p.pos && p.posMap && Math.hypot(p.pos.x - x, p.pos.z - z - 4) < 2; }, [sx, sz], { timeout: 15000 }).catch(() => { });
  const saved = await P.page.evaluate(() => ({ pos: __sv.heroes[0].profile.pos, posMap: __sv.heroes[0].profile.posMap }));
  // a save from another page of the site (the game saves its own spot when it is put away)
  const restart = async (stamp, custom) => {
    await P.page.goto(URL + 'manifest.webmanifest');
    await P.page.evaluate(([pos, stamp]) => { const k = 'sv2_profiles', a = JSON.parse(localStorage.getItem(k)); a[0].pos = pos; if (stamp === null) delete a[0].posMap; else a[0].posMap = stamp; a[0].postcards = Object.assign({ opera: true }, a[0].postcards); localStorage.setItem(k, JSON.stringify(a)); }, [saved.pos, stamp]);
    await P.page.unroute('**/content/custom.json*').catch(() => { });
    if (custom) await P.page.route('**/content/custom.json*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(custom) }));
    await P.page.goto(URL); await start(P.page);
    const grown = await P.page.waitForFunction(() => /valley has grown/i.test(document.querySelector('.reward')?.textContent || ''), null, { timeout: 7000 }).then(() => true).catch(() => false);
    return P.page.evaluate(g => ({ x: +__sv.heroes[0].pos.x.toFixed(1), z: +__sv.heroes[0].pos.z.toFixed(1), posMap: __sv.heroes[0].profile.posMap, kept: !!(__sv.heroes[0].profile.postcards || {}).opera, grown: g,
      parked: __sv.parked, famNpc: __sv.interactables.some(i => /^npc_fam_Testy/.test(i.id)) }), grown);
  };
  const near = (a, x, z, d) => Math.hypot(a.x - x, a.z - z) < d;
  const noStamp = await restart(null), older = await restart('an older layout'), again = await restart(M.v);
  const studio = { npcs: [{ name: 'Testy', x: M.home.x + 6, z: M.home.z + 6, lines: [['Hello!', 'Chào!']] }], world: { land: [] } };
  const parkedRun = await restart(M.v, { ...studio, world: { map: 'an older layout', land: [] } }), placedRun = await restart(M.v, { ...studio, world: { map: M.v, land: [] } });
  const errs = P.errors; await P.ctx.close();
  const r = { saved, noStamp, older, again, parked: parkedRun.parked, parkedNpc: parkedRun.famNpc, placedNpc: placedRun.famNpc, placedParked: placedRun.parked, errs };
  ok(saved.posMap === M.v, 'the saved spot is not stamped: ' + JSON.stringify(r));
  // (no stamp is map 'C': on map 'C' the child comes back where they were, on a newer layout they start at home)
  ok(M.noStamp ? near(noStamp, saved.pos.x, saved.pos.z, 1.5) && !noStamp.grown : near(noStamp, M.home.x, M.home.z, 3) && noStamp.grown, 'a spot with no stamp: ' + JSON.stringify(r));
  ok(near(older, M.home.x, M.home.z, 3) && older.grown && older.posMap === M.v && older.kept, 'a spot from an older layout: ' + JSON.stringify(r));
  ok(near(again, saved.pos.x, saved.pos.z, 1.5) && !again.grown, 'a spot on this layout: ' + JSON.stringify(r));
  ok(r.parked && r.parked.map === 'an older layout' && !r.parkedNpc && r.placedNpc && !r.placedParked, 'Studio content: ' + JSON.stringify(r));
  ok(!errs.length, JSON.stringify(errs));
  return `map ${M.v}: a spot is saved with its layout; with no stamp ${M.noStamp ? 'it counts as map C and comes back' : 'it starts at home'}; from an older layout the child starts at home once with "The valley has grown!" (postcards kept); Studio villagers from an older layout are parked, from this one placed`;
});

await check('village', async () => {
  // Phase 2, Lotus Village (js/lotus.js): footpaths as a road class (R1 1.6 m), the pond path 1.5–2.5 m from the water
  // (R11) ending at a bench, the well, the shrine at the banyan's foot, the basket boat, hens and a dog that never
  // step on a path, and a bicycle and a buffalo cart at walking pace that wait for a child in front of them
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  await P.page.evaluate(async () => { const V = (await import('/js/world.js')).VILLAGE; __sv.heroes[0].place(V.x - 10, V.z + 14); }); await P.page.waitForTimeout(1500); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), G = __sv, out = [], V = W.VILLAGE, pond = [V.x - 10, V.z + 4];
    const paths = W.ROADS.filter(R => R.kind === 'footpath');
    if (paths.length < 2 || paths.some(R => R.w !== 1.6)) out.push('footpaths missing or not 1.6 m');
    const pp = W.ROADS.find(R => R.id === 'lv_pond').pts.slice(3), gap = pp.map(([x, z]) => Math.hypot(x - pond[0], z - pond[1]) - 5.2 - .8); // (the path's inner edge to the water; past the joint with the lane)
    if (gap.some(g => g < 1.5 - .05 || g > 2.5 + .05)) out.push('pond path not 1.5–2.5 m from the water: ' + Math.min(...gap).toFixed(2) + '–' + Math.max(...gap).toFixed(2));
    const ids = ['lv_well', 'lv_shrine', 'lv_bench'], its = ids.map(id => G.interactables.find(i => i.id === id));
    its.forEach((it, k) => { if (!it) out.push('missing ' + ids[k]); });
    const L = G.lotus; if (!L || L.animals.length < 5 || L.movers.length < 2) out.push('animals or riders missing');
    // tap reactions say their line
    let said = 0; const keep = G.lotus.lines; for (const k of ['well', 'shrine', 'bench', 'boat', 'hen', 'dog', 'bike', 'cart']) if (keep[k] && keep[k][0] && keep[k][1]) said++;
    // let the animals wander and the riders ride for a while; nobody steps on a path or goes too fast
    let worst = 1e9, fastest = 0; const last = L.movers.map(m => m.s);
    for (let k = 0; k < 16; k++) { await new Promise(r => setTimeout(r, 500));
      for (const a of L.animals) { const d = W.roadDist(a.m.position.x, a.m.position.z); worst = Math.min(worst, d.d - d.road.w / 2); }
      L.movers.forEach((m, i) => { fastest = Math.max(fastest, Math.abs(m.s - last[i]) / .5); last[i] = m.s; }); }
    // the bicycle stays on its footpath
    const bk = L.movers[0].o.position, onPath = W.roadDist(bk.x, bk.z);
    return { out, said, worst: +worst.toFixed(2), fastest: +fastest.toFixed(2), bikeOn: onPath.road.kind + ' ' + onPath.d.toFixed(2), gap: Math.min(...gap).toFixed(1) + '–' + Math.max(...gap).toFixed(1) };
  });
  // a child 2.5 m in front of the bicycle: it waits
  const waits = await P.page.evaluate(async () => { const G = __sv, m = G.lotus.movers[0], h = G.heroes[0]; m.wait = 0; await new Promise(r => setTimeout(r, 800)); const o = m.o.position; h.place(o.x + Math.sin(m.dyaw) * 2.5, o.z + Math.cos(m.dyaw) * 2.5); const s0 = m.s; await new Promise(r => setTimeout(r, 2500)); return { waiting: m.waiting, moved: +Math.abs(m.s - s0).toFixed(2) }; });
  const errs = P.errors; await P.ctx.close();
  ok(!r.out.length && r.said === 8 && r.worst > .9 && r.fastest <= 1.05 && /^footpath/.test(r.bikeOn) && waits.waiting && waits.moved < .05 && !errs.length, JSON.stringify({ r, waits, errs }));
  return `footpaths 1.6 m, the pond path's edge ${r.gap} m from the water, ending at a bench; well, shrine, bench, boat, hens, dog, bicycle and cart all speak both languages; animals stayed ≥ ${r.worst} m off the paths; riders ≤ ${r.fastest} m/s; the bicycle waited for a child in front of it`;
});

await check('validate', async () => {
  // the one world checker (js/validate.js): every hard rule it knows holds, each problem named by its rule id
  const P = await open(b, { w: 700, h: 500 }); await clear(P.page);
  const r = await P.page.evaluate(async () => (await import('/js/validate.js')).validateWorld(__sv));
  const errs = P.errors; await P.ctx.close();
  ok(!r.length && !errs.length, JSON.stringify(r.slice(0, 12)) + JSON.stringify(errs));
  return 'ROAD-001/002/003/004/011, VEH-001 and STALL-001…004 hold';
});

await check('stalls', async () => {
  // (T1b tidy streets, owner 11 Oct) STALL-001…004 (js/validate.js): every stall, kiosk, van and tent 1.5 m off a road's
  // or street's edge and 3 m from buildings, 1.2 m between neighbours, facing its street with the tap spot in front, in
  // its place's one market row; walking sellers on the footpath. Every seller a child can tap is in the list it checks.
  const P = await open(b, { w: 700, h: 500 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, W = G.world, out = (await import('/js/validate.js')).validateWorld(G).filter(p => /^STALL-/.test(p.rule));
    const known = new Set([...W.stalls.map(s => s.tap), ...W.walks.map(w => w.id)]);
    const missing = G.interactables.filter(i => /^(v_|hk_)/.test(i.id) && !known.has(i.id)).map(i => i.id);
    const by = {}; for (const s of W.stalls) by[s.place] = (by[s.place] || 0) + 1;
    return { out, missing, by, n: W.stalls.length, walks: W.walks.length };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.out.length && !r.missing.length && r.n >= 40 && r.walks >= 5 && !errs.length, `${r.out.length} problems: ${r.out.map(p => p.rule + ' ' + p.msg).join(' | ')} | not listed: ${r.missing.join(', ')} ${JSON.stringify(errs)}`);
  return `${r.n} stalls, kiosks and shop fronts in ${Object.keys(r.by).length} places, ${r.walks} walking sellers: STALL-001…004 hold`;
});

await check('tales', async () => {
  // HANDOFF rule 13: every page of every tale shows drawn pictures and cartoon actors, never a phone emoji
  // (all 38 tales, every page; the first page again in Vietnamese); the tale shelf too
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const { openTheatre } = await import('/js/tales.js'), S = await import('/js/state.js'), G = __sv, bad = [], RAW = /\p{Extended_Pictographic}/u, OK = new Set(['◀', '▶', '✕', '⏯', '✦']);
    const rawIn = node => { const out = []; const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) for (const ch of t.data) if (RAW.test(ch) && !OK.has(ch)) out.push(ch); return out; };
    let pages = 0;
    for (const lang of ['en', 'vi']) { S.settings.lang = lang;
      for (const tale of G.TALES) {
        const done = openTheatre(tale, {}), m = document.querySelector('.theatre');
        for (let k = 0; k < (lang === 'en' ? tale.pages.length : 1); k++) { // (the pictures are the same in both languages)
          await new Promise(r => setTimeout(r, 120)); pages++;
          const where = m.querySelector('.th-stage'), raw = rawIn(where).concat(rawIn(m.querySelector('.th-bar'))), fall = where.querySelectorAll('.emo').length;
          if (raw.length || fall) bad.push(`${tale.id} p${k + 1}: ${raw.join('')} ${fall ? fall + ' undrawn' : ''}`);
          if (k < tale.pages.length - 1 && lang === 'en') m.querySelector('.th-next').click();
        }
        m.querySelector('.th-x').click(); await Promise.race([done, new Promise(r => setTimeout(r, 1500))]); document.querySelectorAll('.theatre').forEach(x => x.remove());
      }
    }
    // the tale shelf
    const shelf = document.createElement('div'); shelf.innerHTML = G.taleShelfHTML(G.heroes[0].profile); const shelfRaw = rawIn(shelf).filter(ch => !/[\u{1F1E6}-\u{1F1FF}]/u.test(ch));
    return { pages, tales: G.TALES.length, bad: bad.slice(0, 15), nbad: bad.length, shelfRaw: shelfRaw.join('') };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.tales >= 38 && !r.nbad && !r.shelfRaw && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.tales} tales, ${r.pages} pages: every picture drawn, no phone emoji (the tale shelf too)`;
});

await check('emoji', async () => {
  // every emoji the game uses has a drawing in js/art.js (tools/emoji-audit.mjs)
  const { execFileSync } = await import('child_process'), { fileURLToPath } = await import('url');
  let out = ''; try { out = execFileSync(process.execPath, ['../tools/emoji-audit.mjs'], { encoding: 'utf8' }); } catch (e) { out = (e.stdout || '') + ''; ok(false, out.split('\n').slice(0, 12).join(' | ')); }
  // (owner, round R: "don't use emoji at all, including in all our docs, only our drawings") no emoji in the docs either
  const EMO = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/u, ARROWS = /^[\u2190-\u21FF\u25A0-\u25FF\u2B05-\u2B07\u23E9-\u23FA©®™‼⁉〰]$/u, inDocs = [];
  for (const f of execFileSync('git', ['ls-files', '*.md', '*.txt'], { cwd: '..', encoding: 'utf8' }).split('\n').filter(Boolean)) {
    if (f.includes('node_modules')) continue;
    for (const ch of fs.readFileSync('../' + f, 'utf8')) if (EMO.test(ch) && !ARROWS.test(ch)) { inDocs.push(f + ' ' + ch); break; }
  }
  ok(!inDocs.length, 'emoji in the docs: ' + inDocs.join(', '));
  return out.trim().split('\n').pop() + '; no emoji in the docs';
});

await check('hubmap', async () => {
  // (round R, owner: "rearrange the games menu so it is more logical; also the map and its destinations") the Play hub:
  // every game in exactly one tab, grouped by kind; the Pad map: each country north to south, landmarks under their real place
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const ui = await import('/js/ui.js'); ui.openGamesHub(__sv, 0); await new Promise(r => setTimeout(r, 400));
    const seen = {}; for (const t of [...document.querySelectorAll('.hubtabs [data-tab]')].map(b => b.dataset.tab)) { document.querySelector(`.hubtabs [data-tab="${t}"]`).click(); await new Promise(r => setTimeout(r, 100)); document.querySelectorAll('.hubbody [data-play]').forEach(b => { seen[b.dataset.play] = (seen[b.dataset.play] || 0) + 1; }); }
    document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.openPad(0, 'map'); await new Promise(r => setTimeout(r, 600));
    document.querySelector('.mapchips [data-g="vn"]').click(); await new Promise(r => setTimeout(r, 200));
    // (owner, bug #28, 11 Oct) a row of city buttons, north to south; the list shows the chosen city's places only
    const cities = [...document.querySelectorAll('.mapcities button')].map(b => b.innerText.trim());
    const placesOf = async name => { const c = [...document.querySelectorAll('.mapcities button')].find(b => b.innerText.includes(name)); if (!c) return null;
      c.click(); await new Promise(r => setTimeout(r, 200)); return [...document.querySelectorAll('.mapplaces .qbtn')].map(b => b.innerText.trim()); };
    const hanoi = (await placesOf('Hà Nội')) || (await placesOf('Hanoi')), danang = await placesOf('Đà Nẵng');
    return { games: Object.keys(seen).length, all: Object.keys(__sv.GAMES || {}).length, dup: Object.entries(seen).filter(([, n]) => n > 1).map(([k]) => k), cities, hanoi, danang };
  });
  ok(!r.dup.length, 'games in two tabs: ' + r.dup.join(', ')); ok(r.games >= 60, 'games in the hub: ' + r.games);
  const at = n => r.cities.findIndex(x => x.includes(n)), hn = at('Hà Nội') >= 0 ? at('Hà Nội') : at('Hanoi'), dn = at('Đà Nẵng');
  ok(hn >= 0 && dn > hn, 'map: the Vietnam cities are not north to south (Hà Nội before Đà Nẵng): ' + r.cities.join(' | '));
  ok(r.hanoi && r.hanoi.some(x => x.includes('Hạ Long')), 'map: Hạ Long should be under Hà Nội: ' + (r.hanoi || []).join(' | '));
  ok(r.danang && r.danang.some(x => x.includes('Huế')) && !r.hanoi.some(x => x.includes('Huế')), 'map: Huế should be under Đà Nẵng only: ' + (r.danang || []).join(' | '));
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `${r.games} games, each in one tab; the map's Vietnam cities run north to south, each with its landmarks (${r.cities.length} cities)`;
});

await check('signs', async () => {
  // (round T4b, finding your way) a picture signpost at every junction of two asphalt or dirt roads (found from the road
  // data, never written-down positions); every board names a real place; posts stand off the road and are solid; all the
  // signposts together are two meshes (one shared board picture, at most 1024 px)
  const P = await open(b, { w: 1180, h: 760 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const S = __sv.signposts, SP = await import('/js/signposts.js'), W = await import('/js/world.js'), J = SP.findJunctions();
    const names = new Set([...__sv.PLACES, ...__sv.LANDMARKS].map(p => p.name()));
    const missing = J.filter(j => !S.posts.some(s => Math.hypot(s.x - j.x, s.z - j.z) < 14)).map(j => `${Math.round(j.x)},${Math.round(j.z)}`);
    const bad = S.posts.flatMap(s => s.boards.filter(b => !names.has(b.place.name())).map(b => b.place.name()));
    const onRoad = S.posts.filter(s => { const q = W.roadDist(s.x, s.z); return q.road && q.d < q.road.w / 2 + .8; }).map(s => `${Math.round(s.x)},${Math.round(s.z)}`);
    const solid = S.posts.filter(s => !__sv.world.colliders.some(c => Math.hypot(c.x - s.x, c.z - s.z) < .1)).length;
    const img = S.texture.image;
    return { junctions: J.length, posts: S.posts.length, boards: S.posts.reduce((a, s) => a + s.boards.length, 0), empty: S.posts.filter(s => !s.boards.length).length,
      missing, bad, onRoad, solid, meshes: S.meshes.length, tex: Math.max(img.width, img.height) };
  });
  ok(r.junctions >= 10 && !r.missing.length, `junctions without a signpost: ${r.missing.join('; ')} (of ${r.junctions})`);
  ok(!r.bad.length && !r.empty, `boards naming no real place: ${r.bad.join(', ')}; posts with no board: ${r.empty}`);
  ok(!r.onRoad.length, 'signposts on the road: ' + r.onRoad.join('; '));
  ok(!r.solid, `${r.solid} signposts a child can walk through`);
  ok(r.meshes <= 2 && r.tex <= 1024, `signposts cost ${r.meshes} meshes, board picture ${r.tex} px`);
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `${r.posts} signposts at ${r.junctions} junctions, ${r.boards} boards, each naming a real place; off the road, solid; ${r.meshes} meshes, one ${r.tex} px picture`;
});

await check('nametags', async () => {
  // (round T4b) names float over the places nearby: at most 4 at once, never covering each other, on a phone, a tablet
  // and a computer; none in calm mode
  const out = [];
  for (const [w, h, touch, tag] of [[390, 844, true, 'phone'], [820, 1180, true, 'tablet'], [1180, 760, false, 'computer']]) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    // the busiest spot: the place with the most places and landmarks within 40 m
    await P.page.evaluate(() => { const all = [...__sv.PLACES, ...__sv.LANDMARKS], n = p => all.filter(o => Math.hypot(o.x - p.x, o.z - p.z) < 40).length;
      const best = all.slice().sort((a, b) => n(b) - n(a))[0]; window.__busy = best.name(); __sv.travelTo(__sv.heroes[0], best.x + 6, best.z + 14); });
    await P.page.waitForTimeout(5000);
    const r = await P.page.evaluate(() => { const on = [...document.querySelectorAll('.nametag.on')].map(e => e.getBoundingClientRect());
      const over = []; on.forEach((a, i) => on.slice(i + 1).forEach(q => { if (a.left < q.right && q.left < a.right && a.top < q.bottom && q.top < a.bottom) over.push(i); }));
      return { n: on.length, over: over.length, busy: window.__busy, names: [...document.querySelectorAll('.nametag.on')].map(e => e.textContent) }; });
    ok(r.n >= 1 && r.n <= 4, `${tag}: ${r.n} name tags at ${r.busy} (want 1 to 4)`);
    ok(!r.over, `${tag}: name tags overlap: ${r.names.join(', ')}`);
    await P.page.evaluate(async () => { const st = await import('/js/state.js'); st.settings.calm = true; });
    await P.page.waitForTimeout(1500);
    const calm = await P.page.evaluate(() => document.querySelectorAll('.nametag.on').length);
    ok(!calm, `${tag}: ${calm} name tags in calm mode`);
    ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
    out.push(`${tag} ${r.n} (${r.names.join(', ')})`);
  }
  return 'at most 4, apart, none in calm mode: ' + out.join('; ');
});

await check('padmap', async () => {
  // (round T4b) the Pad map is drawn from the map data: every place's name on it, names never overlapping at 390, 1180
  // and 1366 px wide; clouds over the places not visited yet, lifting once with a puff after a visit
  const out = [];
  for (const [w, h, touch] of [[390, 844, true], [1180, 760, false], [1366, 768, false]]) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      __sv.openPad(0, 'map'); await new Promise(r => setTimeout(r, 500));
      const cv = document.querySelector('canvas.bigmap'), L = cv.labels || [], names = new Set(L.map(l => l.name));
      const missing = __sv.PLACES.map(p => p.name()).filter(n => !names.has(n));
      const hit = (a, q) => a.x < q.x + q.w && q.x < a.x + a.w && a.y < q.y + q.h && q.y < a.y + a.h, over = [];
      L.forEach((a, i) => L.slice(i + 1).forEach(q => { if (hit(a, q)) over.push(a.name + ' / ' + q.name); }));
      const clouds = cv.clouds.slice(), pic = !cv.toDataURL().startsWith('data:,');
      // visit the first clouded place, then open the map again: its cloud puffs away, once
      const h = __sv.heroes[0], c = clouds[0], W = await import('/js/world.js');
      h.profile.visited = h.profile.visited || {}; h.profile.visited[c.region] = true;
      document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.paused = false; __sv.openPad(0, 'map'); await new Promise(r => setTimeout(r, 200));
      const after = document.querySelector('canvas.bigmap').clouds, puff = document.querySelectorAll('.mapcloud.puff').length;
      document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.paused = false; __sv.openPad(0, 'map'); await new Promise(r => setTimeout(r, 200));
      const again = document.querySelectorAll('.mapcloud.puff').length;
      return { n: L.length, missing, over, clouds: clouds.length, region: c.region, still: after.some(o => o.region === c.region), puff, again, pic };
    });
    ok(r.pic && !r.missing.length, `${w}px: places missing from the drawn map: ${r.missing.join(', ')}`);
    ok(!r.over.length, `${w}px: map names overlap: ${r.over.join('; ')}`);
    ok(r.clouds > 0 && !r.still && r.puff > 0 && !r.again, `${w}px: clouds ${r.clouds}, after visiting ${r.region}: still clouded ${r.still}, puffs ${r.puff}, puffs again ${r.again}`);
    ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
    out.push(`${w}px ${r.n} names, ${r.clouds} clouds`);
  }
  return 'drawn from the map data: ' + out.join('; ') + '; a cloud lifts with one puff after a visit';
});

await check('mapnames', async () => {
  // (Release requests, round T1) the Pad map's names never cover each other (the festival stage lay over Đà Nẵng, the
  // market over Hồ Chí Minh City), on a phone, a tablet and a computer; Hội An is a place of its own in the Vietnam
  // list (north to south between Đà Nẵng and Hồ Chí Minh City) and on the Simple screen's Places road; and the speech
  // box keeps its middle while it slides in (it once sat half its width to the right for 0.3 s, buttons off screen)
  const out = [];
  for (const [w, h, touch, tag] of [[390, 844, true, 'phone'], [820, 1180, true, 'tablet'], [1180, 760, false, 'computer']]) {
    const P = await open(b, { w, h, touch }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      __sv.openPad(0, 'map'); await new Promise(r => setTimeout(r, 600));
      const L = document.querySelector('canvas.bigmap').labels || [], hit = (a, q) => a.x < q.x + q.w && q.x < a.x + a.w && a.y < q.y + q.h && q.y < a.y + a.h;
      const over = []; L.forEach((a, i) => L.slice(i + 1).forEach(q => { if (hit(a, q)) over.push(a.name + ' / ' + q.name); }));
      const out = L.filter(a => a.x < 0 || a.y < 0 || a.x + a.w > 600 || a.y + a.h > 600).map(a => a.name);
      document.querySelector('.mapchips [data-g="vn"]').click(); await new Promise(r => setTimeout(r, 150));
      const cities = [...document.querySelectorAll('.mapcities button')].map(b => b.innerText.trim());
      document.querySelectorAll('.modal').forEach(e => e.remove());
      __sv.dialog('Bà Năm', [['Hello! Shall we play?', 'Chào cháu! Chơi nhé?']], [['▶ Play!', '▶ Chơi!'], ['👋 Later', '👋 Để sau']]);
      await new Promise(r => setTimeout(r, 30));
      const d = document.querySelector('.dialog'), an = d.getAnimations()[0]; if (an) { an.pause(); an.currentTime = 0; }
      const rc = d.getBoundingClientRect(), mid = Math.round(rc.left + rc.width / 2 - innerWidth / 2);
      return { n: L.length, over, out, cities, mid, anim: an ? an.animationName : '' };
    });
    ok(r.n >= 10, `${tag}: map names drawn: ${r.n}`);
    ok(!r.over.length, `${tag}: map names overlap: ${r.over.join('; ')}`);
    ok(!r.out.length, `${tag}: map names off the map: ${r.out.join('; ')}`);
    const at = n => r.cities.findIndex(c => c.includes(n)), ha = at('Hội An');
    ok(ha > at('Đà Nẵng') && at('Đà Nẵng') >= 0 && (at('Hồ Chí Minh') < 0 || ha < at('Hồ Chí Minh')), `${tag}: Hội An between Đà Nẵng and Hồ Chí Minh City: ${r.cities.join(' | ')}`);
    ok(Math.abs(r.mid) <= 2, `${tag}: the speech box starts ${r.mid}px off the middle (${r.anim})`);
    ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
    out.push(`${tag} ${r.n}`);
  }
  // the Simple screen's Places road (an under-5 starts on it)
  const Q = await open(b, { w: 390, h: 844, touch: true, screen: null });
  await Q.page.waitForSelector('.simple-screen:not([hidden]) .sp-catcard, .simple-screen:not([hidden]) .sp-stop', { timeout: 20000 });
  await Q.page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d.remove()));
  await Q.page.click('.sp-tabs [data-tab="places"]'); await Q.page.waitForTimeout(400);
  // (Round U: the Places tab shows its categories as cards first; each card opens its own road, so every road is walked)
  const road = await Q.page.evaluate(() => { const names = [], read = () => names.push(...[...document.querySelectorAll('.simple-screen .sp-stop')].map(e => e.innerText.trim().replace(/\s+/g, ' ')));
    const cats = __sv.simple.view.cats; if (!cats.length || document.querySelector('.simple-screen .sp-stop')) read(); for (const c of cats) { __sv.simple.openGroup('places', c); read(); } __sv.simple.openGroup('places', null); return names.join(' | '); });
  ok(road.includes('Hội An'), 'the Places road has no Hội An: ' + road.slice(0, 300));
  ok(!Q.errors.length, Q.errors.join(' | ')); await Q.ctx.close();
  return `map names apart on ${out.join(', ')}; Hội An in the Vietnam list and on the Places road; the speech box slides in from the middle`;
});

await check('autoplay', async () => {
  // (owner, 12 Oct AEDT) the auto play check: its window shows only where Studio's switch allows (every device or the
  // ticked ones); it walks to things and opens them (games, a story, a place, a festival, a villager, songs), keeps the
  // child's stamina full, writes a report, and afterwards puts the children's progress back as it was
  const pre = rule => `try { localStorage.setItem('sv2_playerid', 'apcheck00001'); localStorage.setItem('sv2_live', JSON.stringify({ releases: { autoplay: ${JSON.stringify(rule)} }, festivals: {} })); } catch (e) { }`;
  for (const rule of [{ on: true, devices: ['zzzzzzzzzzzz'] }, { on: false }]) {
    const Q = await open(b, { w: 1024, h: 768, pre: pre(rule) }); await Q.page.waitForTimeout(2000);
    const shown = !!(await Q.page.$('.apbox')); await Q.ctx.close(); ok(!shown, 'the auto play window showed where it is not allowed: ' + JSON.stringify(rule));
  }
  const P = await open(b, { w: 1024, h: 768, pre: pre({ on: true, devices: ['apcheck00001'] }) });
  await P.page.waitForSelector('.apbox', { timeout: 10000 });
  const mine = () => P.page.evaluate(() => { const p = JSON.parse(localStorage.getItem('sv2_profiles') || '[]'), f = JSON.parse(localStorage.getItem('sv2_farm') || '{}');
    return JSON.stringify({ coins: f.coins, kids: p.map(x => ({ n: x.name, t: x.tales, w: x.wins, l: x.levels, s: x.stickers })) }); });
  const before = await mine();
  const keys = await P.page.evaluate(async () => { const { GAMES } = await import('/js/games/frame.js'), G = __sv, npc = G.interactables.find(i => /^npc_/.test(i.id));
    return [...Object.keys(GAMES).slice(0, 2).map(x => 'game:' + x), 'tale:' + G.TALES[0].id, 'place:farm', 'fest:midautumn', npc && 'tap:' + npc.id, 'songs'].filter(Boolean); });
  await P.page.evaluate(k => { __sv.autoplay.start(k, 'fast'); }, keys);
  await P.page.waitForTimeout(1500);
  const mid = await P.page.evaluate(() => { const h = __sv.heroes[0]; h.stamina = 0; return __sv.autoplay.running(); });
  await P.page.waitForTimeout(600);
  const full = await P.page.evaluate(() => { const h = __sv.heroes[0]; return h.stamina >= h.staminaMax - .001; }).catch(() => true);
  let rep = null; for (let i = 0; i < 240 && !rep; i++) { await P.page.waitForTimeout(500); rep = await P.page.evaluate(() => !localStorage.getItem('sv2_autoplay_backup') && document.readyState === 'complete' && window.__sv && document.querySelector('.screen.title, canvas') ? JSON.parse(localStorage.getItem('sv2_autoplay_report') || 'null') : null).catch(() => null); if (rep && rep.done.length < keys.length) rep = null; }
  ok(mid && full, 'the check did not run, or the child got tired while it ran');
  ok(rep && rep.done.length === keys.length, 'no full report: ' + JSON.stringify(rep && rep.done.map(r => r.key)));
  const bad = rep.done.filter(r => r.problems.some(p => /did not open|did not close|^error/.test(p)));
  ok(!bad.length, 'the check found: ' + JSON.stringify(bad.map(r => [r.key, r.problems])));
  await P.page.waitForSelector('.screen.title', { timeout: 60000 }).catch(() => { });
  ok(await mine() === before, "the children's progress was not put back: " + (await mine()) + ' vs ' + before);
  ok(!!(await P.page.$('.apbox')), 'the window did not come back after the check');
  const errs = P.errors.filter(e => !/pageerror: .*(Load failed|aborted)/.test(e)); await P.ctx.close();
  ok(!errs.length, errs.slice(0, 3).join(' | '));
  return `hidden where not allowed (other device, switched off); ${keys.length} steps (${rep.done.map(r => r.key.split(':')[0]).join(', ')}) at Fast, stamina kept full, ${rep.done.filter(r => r.ok).length} fine${rep.done.filter(r => !r.ok).map(r => `; noted for ${r.key}: ${r.problems.join(', ')}`).join('')}; progress put back after the restart`;
});

// (owner, 12 Oct 2026 AEDT: tester reports, PRIV-016) shared by the three tester checks: a device made a tester (or not)
// by the Releases rule, the website's /api/tester pretended (what it was sent, and what it answers)
const testerPre = (rule, extra = '') => `try { localStorage.setItem('sv2_playerid', 'tester000001'); localStorage.setItem('sv2_live', JSON.stringify({ releases: { tester: ${JSON.stringify(rule)} }, festivals: {} })); ${extra} } catch (e) { }`;
const testerSite = async (ctx, status) => { const got = []; await ctx.route('**/api/tester**', async rt => { const q = rt.request();
  if (q.method() === 'POST') { let b = null; try { b = JSON.parse(q.postData() || 'null'); } catch (e) { } got.push(b); return rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, k: '0123456789abcdef', status: 'new' }) }); }
  return rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(status()) }); }); return got; };
const ACCEPTED = `localStorage.setItem('sv2_tester', JSON.stringify({ at: 1, b: 'r1' }));`;

await check('tester', async () => {
  // a tester device (Releases switch `tester`): nothing of it anywhere else; the agreement once, in both languages; nothing
  // sent before "I accept"; then the tester mark with the version and the ladybird (not at the level "auto reports
  // only"); "Stop being a tester" in Settings stops it at once
  const out = [];
  for (const rule of [{ on: true, devices: ['zzzzzzzzzzzz'] }, { on: false }]) {
    const Q = await open(b, { w: 1024, h: 768, pre: testerPre(rule) }); await Q.page.waitForTimeout(3500);
    const r = await Q.page.evaluate(() => ({ any: !!document.querySelector('.tagree, .testermark, .z-lb'), api: !!window.__sv.tester, loaded: performance.getEntriesByType('resource').some(e => /\/js\/tester(rewards)?\.js/.test(e.name)) }));
    await Q.ctx.close(); if (r.any || r.api || r.loaded) out.push('not a tester but ' + JSON.stringify({ rule, r }));
  }
  for (const lang of ['en', 'vi']) {
    const P = await open(b, { w: 1024, h: 768, lang, pre: testerPre({ on: true, devices: ['tester000001'] }), play: false }), got = await testerSite(P.ctx, () => ({ mine: [], open: [], retest: [], helped: 0, reports: 0 }));
    await start(P.page); await P.page.waitForSelector('.modal.tagree', { timeout: 20000 });
    const text = await P.page.evaluate(() => document.querySelector('.tagree').innerText);
    if (lang === 'vi' ? !/Trở thành người thử/.test(text) || !/tên, tuổi/.test(text) : !/Become a Sparkle Valley tester/.test(text) || !/names, ages and progress/.test(text)) out.push(lang + ': the agreement does not say what is collected: ' + text.slice(0, 200));
    await P.page.evaluate(() => { setTimeout(() => { throw new Error('tester check: before accepting'); }, 0); }); await P.page.waitForTimeout(800);
    const before = await P.page.evaluate(() => (JSON.parse(localStorage.getItem('sv2_tester_out') || '[]')).length + document.querySelectorAll('.testermark, .z-lb').length);
    if (before || got.length) out.push(lang + ': something was kept or sent before "I accept": ' + JSON.stringify({ before, got: got.length }));
    await P.page.click('.tagree .tg-yes'); await P.page.waitForSelector('.testermark', { timeout: 8000 }).catch(() => { }); await P.page.waitForTimeout(1500);
    const on = await P.page.evaluate(async () => ({ mark: (document.querySelector('.testermark') || {}).textContent || '', lb: document.querySelectorAll('.hud .z-lb').length, build: (await import('/js/build.js')).BUILD, lbSize: (r => r && Math.min(r.width, r.height))(document.querySelector('.hud .z-lb') && document.querySelector('.hud .z-lb').getBoundingClientRect()) }));
    if (!on.mark.includes(on.build) || on.lb !== 1 || !(on.lbSize >= 44)) out.push(lang + ': after accepting, no tester mark with the version or no ladybird (44 px): ' + JSON.stringify(on));
    if (!got.some(x => x && x.accepted === true)) out.push(lang + ': the acceptance was not told');
    // Settings → Stop being a tester
    await clear(P.page); await P.page.click('.hud .pcard'); await P.page.waitForSelector('.qs-tester [data-t="stop"]', { timeout: 8000 });
    await P.page.click('.qs-tester [data-t="stop"]'); await P.page.waitForTimeout(800);
    const off = await P.page.evaluate(() => ({ left: document.querySelectorAll('.testermark, .z-lb').length, again: !!document.querySelector('.qs-tester [data-t="join"]') }));
    if (off.left || !off.again) out.push(lang + ': Stop being a tester did not stop it: ' + JSON.stringify(off));
    const errs = P.errors.filter(e => !/tester check: before accepting/.test(e)); await P.ctx.close(); if (errs.length) out.push(errs.slice(0, 2).join(' | '));
  }
  // the level "auto reports only": the mark, no ladybird
  const A = await open(b, { w: 1024, h: 768, pre: testerPre({ on: true, devices: ['tester000001'], levels: { tester000001: 'auto' } }, ACCEPTED) }); await testerSite(A.ctx, () => ({ mine: [], open: [] }));
  await A.page.waitForSelector('.testermark', { timeout: 15000 }).catch(() => { }); await A.page.waitForTimeout(1500);
  const a = await A.page.evaluate(() => ({ mark: !!document.querySelector('.testermark'), lb: document.querySelectorAll('.z-lb').length })); await A.ctx.close();
  if (!a.mark || a.lb) out.push('level "auto reports only": ' + JSON.stringify(a));
  ok(!out.length, out.join(' | '));
  return 'only on tester devices (none of it downloaded elsewhere); the agreement once in English and Vietnamese, nothing kept or sent before "I accept"; then the tester mark with the version and a 44 px ladybird (none at "auto reports only"); Stop being a tester stops it at once';
});

await check('testerreport', async () => {
  // reports by themselves with a picture and the last 30 seconds (an error, a game that did not open, a frozen screen);
  // the ladybird: tap = the picture first, then a kind and a note; long press = a quick report; offline they wait, with a
  // number on the ladybird, and send when back online; "Already reported → add to it" joins the open problem
  const P = await open(b, { w: 1024, h: 768, pre: testerPre({ on: true, devices: ['tester000001'] }, ACCEPTED) });
  let near = []; const got = await testerSite(P.ctx, () => ({ mine: [], open: near, retest: [], helped: 0, reports: 1 }));
  await P.page.waitForFunction(() => window.__sv.tester && document.querySelector('.hud .z-lb'), null, { timeout: 15000 }); await clear(P.page);
  const wait = async (f, ms = 12000) => { for (let t = 0; t < ms; t += 250) { const x = got.find(f); if (x) return x; await P.page.waitForTimeout(250); } return null; };
  const out = [];
  await P.page.evaluate(() => { setTimeout(() => { throw new Error('tester check boom'); }, 0); });
  const e = await wait(x => x && x.kind === 'auto' && x.auto === 'error' && /tester check boom/.test(x.detail));
  if (!e || !/^data:image\/jpeg;base64,/.test(e.shot || '') || !(e.log && e.log.length) || !e.players.length || !e.players[0].name || !e.dev || !e.b) out.push('the error report has no picture, steps, players or device: ' + JSON.stringify(e && { shot: (e.shot || '').slice(0, 30), log: e.log && e.log.length, players: e.players, dev: e.dev, b: e.b }));
  await P.page.evaluate(() => __sv.playGame(0, 'no-such-game-for-the-tester-check'));
  if (!await wait(x => x && x.auto === 'noopen' && /no-such-game/.test(x.detail), 9000)) out.push('a game that did not open was not reported');
  await P.page.waitForFunction(() => performance.now() > 0, null); await P.page.waitForTimeout(Math.max(0, 16000 - await P.page.evaluate(() => performance.now())));
  await P.page.evaluate(() => new Promise(r => requestAnimationFrame(() => { const t = performance.now(); while (performance.now() - t < 2600) { } r(); })));
  if (!await wait(x => x && x.auto === 'freeze', 6000)) out.push('a frozen screen was not reported');
  // the ladybird: tap
  await clear(P.page); const n0 = got.length;
  await P.page.locator('.hud .z-lb').first().dispatchEvent('pointerdown'); await P.page.locator('.hud .z-lb').first().dispatchEvent('pointerup');
  await P.page.waitForSelector('.modal.tpanel .tp-shot', { timeout: 8000 });
  const shotFirst = await P.page.evaluate(() => /^data:image\/jpeg/.test(document.querySelector('.tp-shot').src));
  await P.page.click('.tp-k[data-k="looks"]'); await P.page.fill('.tpanel textarea', 'The bridge floats above the river'); await P.page.click('.tp-send');
  const t = await wait(x => x && x.kind === 'looks' && /bridge floats/.test(x.note || ''));
  if (!shotFirst || !t || !/^data:image/.test(t.shot || '')) out.push('the ladybird\'s report has no picture or note: ' + JSON.stringify({ shotFirst, got: !!t }));
  // long press: a quick report
  await P.page.locator('.hud .z-lb').first().dispatchEvent('pointerdown'); await P.page.waitForTimeout(1000); await P.page.locator('.hud .z-lb').first().dispatchEvent('pointerup');
  if (!await wait(x => x && x.detail === 'quick')) out.push('a long press made no quick report');
  // offline: waits with a number, then sends
  await P.ctx.setOffline(true); await P.page.evaluate(() => __sv.tester.openPanel(0)); await P.page.waitForSelector('.tpanel .tp-send'); await P.page.fill('.tpanel textarea', 'offline report'); await P.page.click('.tp-send'); await P.page.waitForTimeout(600);
  const wq = await P.page.evaluate(() => ({ q: JSON.parse(localStorage.getItem('sv2_tester_out') || '[]').length, n: (document.querySelector('.z-lb .lb-n') || {}).textContent }));
  await P.ctx.setOffline(false); await P.page.evaluate(() => dispatchEvent(new Event('online')));
  const sentLater = await wait(x => x && x.note === 'offline report');
  const left = await P.page.evaluate(() => JSON.parse(localStorage.getItem('sv2_tester_out') || '[]').length);
  if (wq.q !== 1 || wq.n !== '1' || !sentLater || left) out.push('offline reports did not wait and send: ' + JSON.stringify({ wq, sentLater: !!sentLater, left }));
  // already reported here
  near = [{ k: 'aaaaaaaaaaaaaaaa', title: 'The bridge floats', n: 3, where: await P.page.evaluate(() => { const h = __sv.heroes[0]; return { area: String(__sv.regionOf[0] || 'valley'), x: Math.round(h.pos.x), z: Math.round(h.pos.z), game: '', window: '' }; }) }];
  await P.page.evaluate(() => __sv.tester.refresh()); await P.page.waitForTimeout(500);
  await P.page.evaluate(() => __sv.tester.openPanel(0)); await P.page.waitForSelector('.tpanel [data-join]', { timeout: 5000 }).catch(() => { });
  if (await P.page.$('.tpanel [data-join]')) { await P.page.click('.tpanel [data-join]'); if (!await wait(x => x && x.join === 'aaaaaaaaaaaaaaaa')) out.push('"add to it" did not join the open problem'); } else out.push('no "Already reported here" where a problem is open');
  // the retest: a problem fixed in this version is replayed (its game opened) and the result told
  const g1 = await P.page.evaluate(async () => Object.keys((await import('/js/games/frame.js')).GAMES)[0]);
  near = []; await P.page.evaluate(() => document.querySelectorAll('.modal, .dialog').forEach(e => e.remove()));
  const stNow = { mine: [], open: [], retest: [{ k: 'cccccccccccccccc', title: 'noopen: ' + g1, status: 'fixed', fixedIn: 'r1', kind: 'auto', auto: 'noopen', where: { game: g1 } }] };
  await P.ctx.unroute('**/api/tester**'); const got2 = await testerSite(P.ctx, () => stNow);
  const pre = await P.page.evaluate(async () => { const s = await __sv.tester.refresh(); __sv.paused = false; const b = { st: s && s.retest && s.retest.length, open: [...document.querySelectorAll('.gl, .modal, .theatre, .storybook')].map(e => e.className) }; await __sv.tester.retest(); return b; });
  await P.page.waitForTimeout(500); const rt = got2.find(x => x && x.k === 'cccccccccccccccc');
  if (!rt || rt.fixed !== true) out.push('the retest did not replay the fixed problem and say it stayed fixed: ' + JSON.stringify({ rt, pre }));
  // the auto play check's findings (it restarts the game when it ends) are sent once as reports
  await P.page.evaluate(() => { localStorage.setItem('sv2_autoplay_report', JSON.stringify({ at: '2026-10-12T10:00:00Z', build: 'r1', speed: 'fast', total: 1, done: [{ g: 'games', key: 'memory', name: 'Memory', ok: false, problems: ['did not close'] }] })); });
  await P.page.evaluate(() => __sv.tester.nightly()); await P.page.waitForTimeout(1500);
  if (!got2.some(x => x && x.auto === 'autoplay' && /did not close/.test(x.detail))) out.push('the auto play check\'s findings were not sent');
  const errs = P.errors.filter(x => !/tester check boom|no-such-game|net::ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(x)); await P.ctx.close();
  if (errs.length) out.push(errs.slice(0, 2).join(' | '));
  ok(!out.length, out.join(' | '));
  return `${got.length} reports: an error, a game that did not open and a frozen screen by themselves, each with a picture, the last 30 seconds, the players and the device; the ladybird (picture first, then a kind and a note), a long-press quick report, offline reports waiting with a number and sending when back online, and "already reported → add to it"; the retest of a fixed problem, and the auto play check\'s findings sent once`;
});

await check('testerrewards', async () => {
  // a problem the tester found is fixed: the tick on the ladybird, Ông Cú's thank-you with coins; reports that helped
  // give the Bug Hunter badge on the shirt (seen by friends: it is in the look), tester gear, stickers and the week's star
  const out = [];
  for (const [w, h, touch, name] of [[390, 844, true, 'phone'], [820, 1180, true, 'tablet'], [1180, 760, false, 'computer']]) {
    // (the website is pretended before the page loads: the device asks for its status as soon as it starts)
    const P = await open(b, { w, h, touch, pre: testerPre({ on: true, devices: ['tester000001'] }, ACCEPTED), route: ctx => testerSite(ctx, () => ({ mine: [{ k: 'bbbbbbbbbbbbbbbb', title: 'The bridge floats', status: 'fixed', fixedIn: 'r67', kind: 'looks', spoken: true }], open: [], retest: [], helped: 10, helpedKinds: ['broken', 'looks', 'words', 'sound', 'idea'], reports: 12, star: true })) });
    const coins0 = await P.page.evaluate(() => JSON.parse(localStorage.getItem('sv2_farm') || '{}').coins || 0);
    await P.page.waitForFunction(() => window.__sv.testerRewards, null, { timeout: 15000 });
    for (let i = 0; i < 40; i++) { await P.page.waitForTimeout(500); const d = await P.page.$('.dialog'); if (d && /Ông Cú|Ong Cu/.test(await d.innerText())) break; await P.page.evaluate(() => document.querySelectorAll('.reward').forEach(r => r.click())); }
    const thank = await P.page.evaluate(() => (document.querySelector('.dialog') || {}).innerText || '');
    await P.page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d.click())); await P.page.waitForTimeout(800);
    const r = await P.page.evaluate(async () => { const S = await import('/js/state.js'), p = S.profiles[0]; return { badge: p.look.badge, star: p.look.star, gear: ['sleuthhat', 'ladypack', 'sleuthcape'].filter(id => (p.owned.clothes || []).includes(id)), stickers: p.testerStickers, coins: S.farm.coins, tick: !(document.querySelector('.z-lb .lb-ok') || { hidden: true }).hidden, starName: !!document.querySelector('.hud .pname.starname') }; });
    if (!/fixed|đã được sửa/i.test(thank) || r.coins - coins0 < 25) out.push(name + ': no thank-you with coins: ' + JSON.stringify({ thank: thank.slice(0, 80), coins: r.coins - coins0 }));
    if (r.badge !== 'lb2' || !r.star || r.gear.length !== 3 || (r.stickers || []).length !== 5 || !r.tick || !r.starName) out.push(name + ': rewards ' + JSON.stringify(r));
    // the Tester's Corner and the badge drawn on the shirt
    await clear(P.page); await P.page.evaluate(() => __sv.testerRewards.corner()); await P.page.waitForSelector('.tcorner .tc-badge.on', { timeout: 5000 }).catch(() => { });
    const c = await P.page.evaluate(() => { const card = document.querySelector('.tcorner .card'), r = card && card.getBoundingClientRect(); return { on: document.querySelectorAll('.tcorner .tc-badge.on').length, st: document.querySelectorAll('.tcorner .tc-st.on').length, fixed: document.querySelectorAll('.tcorner .tm-row').length, wide: card ? card.scrollWidth <= card.clientWidth + 2 && r.right <= innerWidth + 1 : false }; });
    if (c.on !== 2 || c.st !== 5 || c.fixed !== 1 || !c.wide) out.push(name + ': the Tester\'s Corner ' + JSON.stringify(c));
    if (name === 'computer') { const shirt = await P.page.evaluate(async () => { const { buildAvatar } = await import('/js/avatar.js'), S = await import('/js/state.js'); const n = o => { let k = 0; o.traverse(x => { if (x.isMesh && !x.userData.outline) { const g = x.geometry; k += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return k; }; return n(buildAvatar({ ...S.profiles[0].look }).torso) - n(buildAvatar({ ...S.profiles[0].look, badge: undefined }).torso); });
      if (shirt < 1) out.push('the badge is not drawn on the shirt: ' + shirt + ' triangles'); } // (the badge's triangles: r69, as for shop with the owner's yes, the battery round merges it into the shirt's shape)
    const errs = P.errors; await P.ctx.close(); if (errs.length) out.push(name + ': ' + errs.slice(0, 2).join(' | '));
  }
  ok(!out.length, out.join(' | '));
  return 'on phone, tablet and computer: the fixed tick, Ông Cú\'s thank-you with coins (more for a spoken note), the Silver Ladybird on the shirt (and in the look friends see), the tester hat, backpack and cape, five stickers, the week\'s star by the name, and the Tester\'s Corner';
});

await check('festcal', async () => {
  // (round R, owner) the festival calendar: real dates, 3 weeks of build-up that grows each week, two festivals at once
  // in their own places, quiet days only a few days before, the day's timetable, Halloween trick-or-treat and keepsake
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const F = await import('/js/festivals.js'), st = d => F.activeFestivals(new Date(d + 'T10:00:00')).map(a => a.F.id + ':' + a.stage).sort().join(' ');
    const out = { oct9: st('2026-10-09'), oct10: st('2026-10-10'), oct25: st('2026-10-25'), oct31: st('2026-10-31'), anzac20: st('2027-04-20'), anzac23: st('2027-04-23'), tet: st('2026-02-17') };
    // the calendar on the Pad
    __sv.openPad(0, 'cal'); await new Promise(r => setTimeout(r, 500));
    out.rows = document.querySelectorAll('.pad .fcal-row').length; document.querySelectorAll('.modal').forEach(e => e.remove()); __sv.paused = false;
    // Halloween: knock at five doors for a pumpkin lantern (owner, 10 Oct: children cannot start a festival, so the check
    // has an admin schedule it for today in Studio, as a grown-up would)
    const h = __sv.heroes[0], C = (await import('/js/custom.js')).CUSTOM, d = new Date(), ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    C.releases = { ...(C.releases || {}), fest_halloween: { on: true, start: ymd, days: 1 } }; __sv.festivals.rebuild(); await new Promise(r => setTimeout(r, 2500));
    document.querySelectorAll('.dialog, .reward, .modal').forEach(e => e.remove());
    const doors = __sv.interactables.filter(i => i.id.startsWith('trick_')); out.doors = doors.length;
    for (const d of doors.slice(0, 5)) { d.act(h); await new Promise(r => setTimeout(r, 100)); document.querySelectorAll('.reward').forEach(e => e.click()); }
    out.keepsake = (h.profile.keepsakes || []).includes('pumpkin'); out.treats = h.profile.halloween && h.profile.halloween.treats;
    return out;
  });
  ok(r.oct9 === '' || !r.oct9.includes('halloween'), 'Halloween decorated more than 3 weeks before: ' + r.oct9);
  ok(r.oct10.includes('halloween:1'), 'Halloween 3 weeks before should be stage 1: ' + r.oct10);
  ok(r.oct25.includes('halloween:3') && r.oct25.includes('diwali:2'), 'two festivals at once, each its own stage: ' + r.oct25);
  ok(r.oct31.includes('halloween:4'), 'Halloween day: ' + r.oct31);
  ok(!r.anzac20.includes('anzac') && r.anzac23.includes('anzac:2'), 'a quiet day shows only a few days before: ' + r.anzac20 + ' / ' + r.anzac23);
  ok(r.tet.includes('tet:4'), 'Tết on its lunar date: ' + r.tet);
  ok(r.rows >= 10, 'calendar rows: ' + r.rows); ok(r.doors >= 5, 'pumpkin doors: ' + r.doors); ok(r.keepsake && r.treats === 5, 'no pumpkin lantern after 5 treats');
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `build-up from 3 weeks before (stage 1→4), Halloween and Diwali at once, quiet days ${'3'} days before, ${r.rows} festivals coming up on the calendar, ${r.doors} pumpkin doors, a pumpkin lantern after 5 treats`;
});

await check('festivals', async () => {
  // (Play core, owner 10 Oct) festivals come only in their season (from 3 weeks before) or when an admin schedules them in
  // Studio; a child cannot start one (the calendar only tells about it); a festival decorates its whole place: pieces
  // along every street, more each week, never on a road, a city street or a place's own street.
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, F = await import('/js/festivals.js'), W = await import('/js/world.js'), C = (await import('/js/custom.js')).CUSTOM, { FESTCAL } = await import('/js/content/festcal.js');
    const wait = ms => new Promise(r => setTimeout(r, ms)), out = {};
    // a festival out of its season: the calendar tap tells about it and starts nothing
    const far = F.upcoming().filter(n => n.daysTo > 30).pop(); out.far = far && far.F.id;
    G.festivals.visit(0, far.F.id); await wait(800);
    out.toldDays = (document.querySelector('.dialog .dtext') || {}).textContent || '';
    document.querySelectorAll('.dialog').forEach(e => e.remove()); G.paused = false;
    out.startedByChild = G.festivals.active().some(a => a.F.id === far.F.id) || G.interactables.some(i => i.id === 'festival_' + far.F.id);
    __sv.openPad(0, 'cal'); await wait(500); out.calNote = (document.querySelector('.pad .note') || {}).textContent || ''; document.querySelectorAll('.modal').forEach(e => e.remove()); G.paused = false;
    // an admin schedules it for today in Studio: it is on, with its table
    const d = new Date(), ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    C.releases = { ...(C.releases || {}), ['fest_' + far.F.id]: { on: true, start: ymd, days: 1 } }; G.festivals.rebuild(); await wait(300);
    out.adminOn = G.festivals.active().some(a => a.F.id === far.F.id && a.on) && G.interactables.some(i => i.id === 'festival_' + far.F.id);
    // (owner, 11 Oct, #32) even on its day, a calendar tap only tells: nobody is sent to the festival
    { const h = G.heroes[0], p0 = { x: h.pos.x, z: h.pos.z }; G.festivals.visit(0, far.F.id); await wait(2500);
      out.toldToday = (document.querySelector('.dialog .dtext') || {}).textContent || ''; out.moved = Math.hypot(h.pos.x - p0.x, h.pos.z - p0.z);
      document.querySelectorAll('.dialog').forEach(e => e.remove()); G.paused = false; }
    delete C.releases['fest_' + far.F.id]; G.festivals.rebuild(); await wait(300);
    out.adminOff = !G.festivals.active().some(a => a.F.id === far.F.id);
    // whole places: every festival place with streets gets pieces spread along them, more each week
    const places = [...new Set(FESTCAL.flatMap(f => f.where))], bad = [], sizes = {};
    const streetOf = (x, z) => { for (const c of W.CITIES) if (c.layout && x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1 && Math.abs((x - c.x) * Math.cos(c.layout.toward) - (z - c.z) * Math.sin(c.layout.toward)) < 2.6 + 1.5) return c.id; return null; };
    const inner = [['town', W.TOWN, 6, 44, 3.5], ['aussie', W.AUSSIE, W.AUSSIE.x0, W.AUSSIE.x1, 3.5], ['market', W.MARKET, W.MARKET.x0, W.MARKET.x1, 4]];
    for (const key of places) {
      const f = FESTCAL.find(x => x.where.includes(key) && x.kind === 'party'); if (!f) continue;
      const s1 = G.festivals.plan(key, f.id, 1), s2 = G.festivals.plan(key, f.id, 2), s4 = G.festivals.plan(key, f.id, 4), all = G.festivals.streetSpots(key);
      sizes[key] = [s1.length, s2.length, s4.length, all.length];
      if (all.length < 6) continue; // (a place without streets keeps its ring of pieces round the middle)
      if (!(s1.length > 0 && s1.length < s2.length && s2.length < s4.length)) bad.push(`${key}: not more each week (${s1.length}, ${s2.length}, ${s4.length})`);
      // spread over the whole place, not bunched: the pieces reach far apart
      let span = 0; for (const a of s4) for (const q of s4) span = Math.max(span, Math.hypot(a.x - q.x, a.z - q.z));
      const o = { ...W.CITIES.reduce((m, c) => (m[c.id] = c, m), {}), village: W.VILLAGE, china: W.CHINA, india: W.INDIA, aussie: W.AUSSIE, town: W.TOWN, market: W.MARKET, home: W.HOME, hoian: W.HOIAN }[key];
      const size = o.x0 != null ? Math.hypot(o.x1 - o.x0, o.z1 - o.z0) : (o.r || 24) * 2;
      if (span < size * .4) bad.push(`${key}: pieces bunched in ${span.toFixed(0)} m of a ${size.toFixed(0)} m place`);
      for (const q of all) { const rd = W.roadDist(q.x, q.z); if (rd.road && rd.d < rd.road.w / 2 + 1.5) bad.push(`${key}: a piece on a road at ${q.x},${q.z}`);
        const st = streetOf(q.x, q.z); if (st) bad.push(`${key}: a piece on ${st}'s main street`);
        for (const [k, b, x0, x1, hw] of inner) if (q.x > x0 && q.x < x1 && Math.abs(q.z - b.roadZ) < hw + 1.5) bad.push(`${key}: a piece on ${k}'s street`);
        if (W.heightAt(q.x, q.z) < W.WATER + .3) bad.push(`${key}: a piece in the water`); }
    }
    out.bad = bad.slice(0, 6); out.sizes = sizes;
    return out;
  });
  const out = [];
  if (r.startedByChild) out.push(`a child's tap started ${r.far}`);
  if (!/\d/.test(r.toldDays)) out.push(`the calendar tap did not say how many days to ${r.far}: "${r.toldDays}"`);
  if (/visit it now/i.test(r.calNote)) out.push('the calendar still says "visit it now"');
  if (!r.adminOn) out.push(`an admin's schedule did not start ${r.far}`);
  if (r.moved > 1 || !/today|hôm nay/i.test(r.toldToday)) out.push(`a calendar tap on ${r.far}'s day sent the child ${r.moved.toFixed(1)} m or did not say it is today: "${r.toldToday}"`);
  if (!r.adminOff) out.push(`${r.far} stayed on after the admin's schedule was removed`);
  out.push(...r.bad);
  if (P.errors.length) out.push(...P.errors.slice(0, 2));
  await P.ctx.close();
  if (out.length) throw new Error(out.join('; '));
  const z = Object.entries(r.sizes).filter(([, v]) => v[3] >= 6);
  return `${r.far} out of season: told the days, not started by a child; on when an admin schedules it, and a tap on its day only tells (nobody travels), off again after; ${z.length} places decorated along their streets (week 1 → day: ${z.map(([k, v]) => `${k} ${v[0]}→${v[2]}`).join(', ')}), none on a road or street`;
});

await check('festhunt', async () => {
  // (owner, 13 Oct 2026 AEDT) festival decorations: 5 times r69's by default, as chosen in Studio per festival (as before,
  // 2x, 3x, 5x, 7x); pieces beside the streets, strings across them and every house front, never on a road; the festival
  // nearest its day also decorates the rest of the valley (other places, beside every road, every house outside); the phone
  // draws only the nearest patches, within a budget (PERF-003); and the festival hunt: five things hidden in every
  // festival's first place in its last week and on its day, the fifth giving a keepsake and the Passport badge.
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, W = await import('/js/world.js'), C = (await import('/js/custom.js')).CUSTOM, { FESTCAL } = await import('/js/content/festcal.js'), { HUNT } = await import('/js/content/festhunt.js');
    const wait = ms => new Promise(r => setTimeout(r, ms)), out = { bad: [] }, bad = out.bad;
    const d = new Date(), ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    for (let k = 0; k < 40 && !G.festivals.count('village', 'tet', 4); k++) { G.festivals.rebuild(); await wait(300); }
    // the amount: 5x by default, as before at 1, and 7x at least as much as 5x; never on a road or street
    const total = c => c.pieces + c.strings + 2 * c.fronts, base = c => c.base.pieces + c.base.strings; let places = 0;
    for (const F of FESTCAL) for (const key of F.where) {
      C.festivals = {}; const c5 = G.festivals.count(key, F.id, 4); if (!c5) continue; places++;
      const want = F.kind === 'quiet' ? 2.5 : 4.5; if (total(c5) < want * base(c5)) bad.push(`${F.id} in ${key}: ${total(c5)} pieces, ${(total(c5) / base(c5)).toFixed(1)} times before (want ${want})`);
      if (c5.onRoad) bad.push(`${F.id} in ${key}: ${c5.onRoad} pieces on a road or street`);
      C.festivals = { [F.id]: { deco: 1 } }; const c1 = G.festivals.count(key, F.id, 4); if (total(c1) !== base(c1)) bad.push(`${F.id} in ${key}: "as before" is ${total(c1)}, not ${base(c1)}`);
      C.festivals = { [F.id]: { deco: 7 } }; const c7 = G.festivals.count(key, F.id, 4); if (total(c7) < total(c5)) bad.push(`${F.id} in ${key}: 7x (${total(c7)}) less than 5x (${total(c5)})`);
      if (c7.onRoad) bad.push(`${F.id} in ${key}: ${c7.onRoad} pieces on a road at 7x`);
    }
    C.festivals = {}; out.places = places;
    // build-up: half in week 1, three quarters in week 2, all in the last week
    { const s = [1, 2, 3, 4].map(st => G.festivals.count('village', 'tet', st)).map(total); out.build = s; if (!(s[0] < s[1] && s[1] < s[2] && s[2] === s[3])) bad.push('build-up not half, three quarters, all: ' + s.join(', ')); }
    // Tết on (an admin's schedule): the whole valley, within the budget
    C.releases = { ...(C.releases || {}), fest_tet: { on: true, start: ymd, days: 1 } }; G.festivals.rebuild(); await wait(800);
    const PL = { village: W.VILLAGE, china: W.CHINA, market: W.MARKET, hoian: W.HOIAN, ...Object.fromEntries(W.CITIES.map(c => [c.id, c])) }, tetAt = FESTCAL.find(f => f.id === 'tet').where.map(k => PL[k]).filter(Boolean);
    const away = q => Math.min(...tetAt.map(o => o.x0 != null ? Math.max(0, Math.max(o.x0 - q.x, q.x - o.x1, o.z0 - q.z, q.z - o.z1)) : Math.max(0, Math.hypot(q.x - o.x, q.z - o.z) - (o.r || 24))));
    const patches = G.festivals.places3(); out.patches = patches.length; out.outside = patches.filter(q => away(q) > 40).length; out.road = G.festivals.roadSpots(5);
    if (out.outside < 20) bad.push(`only ${out.outside} decoration patches outside Tết's places: not over the whole valley`);
    if (out.road < 100) bad.push(`only ${out.road} spots beside the valley's roads`);
    for (const [x, z] of [[W.VILLAGE.x, W.VILLAGE.z + 6], [W.TOWN.x0 + 20, W.TOWN.roadZ], [(W.CITIES[0].x0 + W.CITIES[0].x1) / 2, W.CITIES[0].z]]) {
      G.heroes[0].place(x, z); await wait(1300); const dn = G.festivals.drawn(), bu = G.festivals.budget;
      if (dn.tris > bu.tris || dn.calls > bu.calls) bad.push(`drawn ${dn.tris} triangles, ${dn.calls} draw calls near ${x.toFixed(0)},${z.toFixed(0)} (budget ${bu.tris}, ${bu.calls})`);
      if (!dn.tris) bad.push(`no decorations drawn near ${x.toFixed(0)},${z.toFixed(0)}`); }
    // the hunt: every festival hides five things when it is on
    const H0 = () => G.festivals.hunt(); for (let k = 0; k < 20 && !(H0() && H0().items().length); k++) await wait(300);
    const hunted = [];
    for (const F of FESTCAL) { C.releases = { ['fest_' + F.id]: { on: true, start: ymd, days: 1 } }; G.festivals.rebuild(); await wait(250);
      const n = H0() ? H0().items().filter(i => i.F === F.id).length : 0; if (n !== 5) bad.push(`${F.id}: ${n} hunt things, not 5`); else hunted.push(F.id);
      if (!HUNT[F.id]) bad.push(`${F.id}: nothing to hunt`); }
    out.hunted = hunted.length;
    // Tết's hunt: four say "keep looking", the fifth gives the keepsake and the badge; the Passport shows it
    C.releases = { fest_tet: { on: true, start: ymd, days: 1 } }; G.festivals.rebuild(); await wait(400);
    const p = G.heroes[0].profile; p.hunt = {}; p.festBadges = {}; p.keepsakes = (p.keepsakes || []).filter(k => k !== 'fh_tet');
    const its = H0().items().filter(i => i.F === 'tet');
    for (const it of its) { G.heroes[0].place(it.x + 1, it.z); await wait(200); const pr = H0().find(0, it.id); await wait(400); document.querySelectorAll('.reward').forEach(e => e.click()); await pr; }
    out.badge = p.festBadges && p.festBadges.tet; out.keep = (p.keepsakes || []).includes('fh_tet'); out.left = H0().items().filter(i => i.F === 'tet' && i.left).length;
    const { DECOR } = await import('/js/myhouse.js'); out.decor = !!(DECOR.fh_tet && DECOR.fh_tet.keepsake);
    const box = document.createElement('div'); G.drawPassport(box, G.heroes[0]); out.passport = box.querySelectorAll('.pfest .pst.on').length; out.passportAll = box.querySelectorAll('.pfest .pst').length;
    delete C.releases.fest_tet; G.festivals.rebuild();
    return out;
  });
  const out = [...r.bad.slice(0, 8)];
  if (!r.badge || !r.keep || !r.decor) out.push(`five Tết things found but badge ${r.badge}, keepsake ${r.keep}, in the house list ${r.decor}`);
  if (r.left) out.push(`${r.left} Tết things still shown after the only child found them`);
  if (r.passport !== 1 || r.passportAll < 24) out.push(`the Passport shows ${r.passport} festival badges of ${r.passportAll}`);
  if (P.errors.length) out.push(...P.errors.slice(0, 2));
  await P.ctx.close();
  if (out.length) throw new Error(out.join('; '));
  return `${r.places} festival places at 5x by default (as before at 1x, more at 7x), none on a road; build-up ${r.build.join(' → ')} in Lotus Village for Tết; Tết on: ${r.patches} patches, ${r.outside} outside its places, ${r.road} spots by the valley's roads, the nearest drawn within the budget; ${r.hunted} festivals hide 5 things each; Tết's five found: keepsake for the house and the Passport badge`;
});

await check('films', async () => {
  // (round R, owner: "the animations should be detailed and comprehensive, not drawings standing for the scenes")
  // every page of the pilot story and guide films plays to its end, the child's turn waits for a tap, and closing frees it
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const F = await import('/js/film.js'), C = await import('/js/content/films.js'), { MORE_TALES: more } = await import('/js/talesdata.js'), { TALES } = await import('/js/learn.js');
    const MORE_TALES = [...TALES, ...more]; // (Bánh chưng is one of the first tales, in js/learn.js)
    const { openTheatre } = await import('/js/tales.js'), { openHowTo } = await import('/js/howto.js');
    const frame = () => new Promise(r => requestAnimationFrame(r)), out = { films: {}, bad: [] };
    const run = async (id, n) => {
      const f = F.filmNow(); if (!f) { out.bad.push(id + ': no film'); return; }
      let helps = 0;
      for (let k = 0; k < n; k++) {
        const done = f.page(k); let ended = false; done.then(() => { ended = true; });
        const p = f.now; if (!p.root.children.length) out.bad.push(`${id} p${k + 1}: empty set`);
        // before the narrator finishes, the child's turn must not start
        for (let i = 0; i < 400 && !p.waiting && p.t < p.len + 1; i++) { if (p.hold) out.bad.push(`${id} p${k + 1}: asked before the words were read`); p.t += .2; await frame(); }
        if (ended && p.ev.some(e => e.help)) out.bad.push(`${id} p${k + 1}: ended without the child's turn`);
        f.narrated();
        for (let i = 0; i < 600 && !ended; i++) { if (p.hold) { helps++; p.release(true); } p.t += .2; await frame(); }
        if (!ended) out.bad.push(`${id} p${k + 1}: did not end`);
        if (!(p.actors.length || p.root.children.length > 3)) out.bad.push(`${id} p${k + 1}: nobody in it`);
      }
      out.films[id] = { pages: n, helps };
    };
    for (const id of Object.keys(C.FILMS)) {
      // (the story's own films come from js/content/chapters.js, the fairy tales from js/talesdata.js)
      const { STORY_TALES } = await import('/js/content/chapters.js'), st = STORY_TALES[id];
      openTheatre(MORE_TALES.find(t => t.id === id) || (st && { ...st, title: () => st.title[0], ctx: { name: 'Na', companion: 'firefly' } }), { name: 'Na' }); for (let i = 0; i < 50 && !F.filmNow(); i++) await new Promise(r => setTimeout(r, 100)); // (loaded when the story opens)
      document.querySelector('.th-pause').click();
      if (!document.querySelector('.theatre.film canvas.th-film')) out.bad.push(id + ': no 3D stage');
      await run(id, C.FILMS[id].pages.length);
      document.querySelector('.th-x').click(); await new Promise(r => setTimeout(r, 400));
      if (F.filmNow() || document.querySelector('canvas.th-film')) out.bad.push(id + ': not freed');
    }
    for (const id of Object.keys(C.GUIDES)) {
      openHowTo(id, {}); for (let i = 0; i < 50 && !F.filmNow(); i++) await new Promise(r => setTimeout(r, 100)); document.querySelector('.ht-pp').click();
      await run(id, C.GUIDES[id].pages.length);
      // (Kid UI films, 10 Oct) the real game plays its first moves by itself with the glowing hand, then waits for the child
      if (C.GUIDES[id].demo) {
        const m = document.querySelector('.howto'), sleep = ms => new Promise(r => setTimeout(r, ms));
        for (let i = 0; i < 12 && !m.querySelector('.ht-demo'); i++) { m.querySelector('.ht-next').click(); await sleep(300); }
        const D = m.__demo; if (!D) { out.bad.push(id + ': the real game does not play by itself'); }
        else {
          if (!m.querySelector('canvas.th-film').hidden) out.bad.push(id + ': the film still shows under the real game');
          for (let i = 0; i < 400 && !D.turn; i++) await sleep(150);
          const hand = m.querySelector('.ht-hand');
          out.demo = out.demo || {}; out.demo[id] = { moves: D.moves, turn: D.turn, pairs: m.querySelectorAll('.ht-demo .mem.got').length, hand: !!hand };
          if (!D.turn) out.bad.push(id + ': the demo did not reach the child\'s turn'); if (D.moves < 2) out.bad.push(id + ': the hand made ' + D.moves + ' moves');
          if (id === 'memory' && !m.querySelector('.ht-demo .mem.got')) out.bad.push('memory: the demo found no pair');
          // the child has a go: two cards, or one shot
          const ev = (e, type, x, y) => e.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 3, bubbles: true }));
          if (id === 'memory') for (const c of [...m.querySelectorAll('.ht-demo .mem:not(.flip)')].slice(0, 2)) { const r = c.getBoundingClientRect(); ev(c, 'pointerup', r.left + 5, r.top + 5); c.click(); await sleep(200); }
          else { const c = m.querySelector('.ht-demo canvas'), r = c.getBoundingClientRect(); ev(c, 'pointerdown', r.left + r.width / 2, r.top + r.height * .86); ev(c, 'pointermove', r.left + r.width / 2, r.top + r.height * .98); ev(c, 'pointerup', r.left + r.width / 2, r.top + r.height * .98); }
          for (let i = 0; i < 200 && m.querySelector('.ht-demo'); i++) await sleep(150);
          if (m.querySelector('.ht-demo')) out.bad.push(id + ': the guide did not go on after the child\'s turn');
          else if (m.querySelector('canvas.th-film').hidden) out.bad.push(id + ': the film did not come back after the real game');
          out.demo[id].taps = D.taps;
        }
      }
      document.querySelector('.ht-x').click(); await new Promise(r => setTimeout(r, 300));
      if (F.filmNow()) out.bad.push(id + ': not freed');
    }
    return out;
  });
  const fails = [...r.bad];
  for (const id of ['duahau', 'thanhgiong', 'banhchung', 'caykhe']) if (!r.films[id] || r.films[id].helps < 2) fails.push(`${id}: the child should help at least twice`);
  for (const id of ['marbles', 'memory']) if (!r.demo || !r.demo[id]) fails.push(`${id}: no real game playing by itself`);
  if (P.errors.length) fails.push(...P.errors.slice(0, 3));
  await P.ctx.close();
  if (fails.length) throw new Error(JSON.stringify({ fails, films: r.films }));
  return Object.entries(r.films).map(([id, f]) => `${id} ${f.pages} pages`).join(', ') + '; the child helps at least twice in each story; the real game plays by itself (' + Object.entries(r.demo).map(([id, d]) => `${id}: ${d.moves} moves with the hand, the child's go`).join(', ') + ')';
});
await check('halves', async () => {
  // (round R, owner) two players: a window opens in its own child's half and pauses only that child; the other keeps playing
  const out = [];
  for (const [w, h, touch, tag] of [[1180, 760, false, 'side'], [820, 1180, true, 'face']]) {
    const P = await open(b, { w, h, touch, mode: 'split' }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      const G = __sv, w = t => new Promise(r => setTimeout(r, t)), hold = () => document.querySelectorAll('.halfwrap');
      G.openPad(1); await w(600);
      const inHalf1 = !!(hold()[1] && hold()[1].querySelector('.modal')), busy = [G.halfBusy(0), G.halfBusy(1)];
      const h0 = G.heroes[0], x0 = h0.pos.x, z0 = h0.pos.z; h0.goal = { x: x0 + 6, z: z0 + 2 };
      const h1 = G.heroes[1], x1 = h1.pos.x, z1 = h1.pos.z; h1.goal = { x: x1 + 6, z: z1 }; await w(1500);
      const moved0 = Math.hypot(h0.pos.x - x0, h0.pos.z - z0), moved1 = Math.hypot(h1.pos.x - x1, h1.pos.z - z1);
      G.lastPlayer = 0; G.openPad(0); await w(600);
      const both = [!!hold()[0].querySelector('.modal'), !!hold()[1].querySelector('.modal')], far = hold()[1].classList.contains('facewrap');
      return { inHalf1, busy, moved0, moved1, both, far };
    });
    if (!r.inHalf1) out.push(tag + ': the window did not open in its child\'s half');
    if (r.busy[0] || !r.busy[1]) out.push(tag + ': wrong child paused ' + JSON.stringify(r.busy));
    if (!(r.moved0 > .3) || r.moved1 > .05) out.push(tag + ': the other child could not keep playing ' + JSON.stringify(r));
    if (!r.both[0] || !r.both[1]) out.push(tag + ': both children could not have a window open');
    if ((tag === 'face') !== r.far) out.push(tag + ': far half not turned to face its child');
    if (P.errors.length) out.push(...P.errors.slice(0, 2));
    await P.ctx.close();
  }
  if (out.length) throw new Error(out.join('; '));
  return 'side by side and face to face: each window opens in its own child\'s half and pauses only that child; both can have one open';
});
await check('preload', async () => {
  // (round R, faster launch) index.html lists every start-up script so the browser fetches them all at once
  const { execFileSync } = await import('child_process'), { fileURLToPath } = await import('url');
  try { return execFileSync(process.execPath, [fileURLToPath(new globalThis.URL('../tools/preload.mjs', import.meta.url)), '--check'], { encoding: 'utf8' }).trim(); }
  catch (e) { throw new Error((e.stdout || e.message).trim()); }
});
await check('story', async () => {
  // (round R, owner approved "Đèn Lồng Thung Lũng") the prologue and chapter 1 can be played from start to end: Ông Cú's
  // film, choosing a companion, each step of Làng Sen in turn, finding and hanging the lantern; the đình wakes up, the
  // keepsake goes home, and the old adventures follow. The đình stands in an open yard, not between houses.
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const pg = P.page, w = ms => pg.waitForTimeout(ms), seen = [];
  const q = () => pg.evaluate(() => { const c = __sv.currentQuest(__sv.heroes[0].profile); return c && c.id; });
  const calm = () => pg.evaluate(() => { document.querySelectorAll('.storybook,.dialog,.reward').forEach(e => e.remove()); __sv.paused = false; });
  const act = id => pg.evaluate(id => { const it = __sv.interactables.find(i => i.id === id); it.act(__sv.heroes[0], __sv); }, id);
  seen.push(await q());
  await pg.evaluate(() => { if (!document.querySelector('.theatre')) __sv.lanterns.owl(__sv.heroes[0]); }); await w(2500);
  const film = await pg.evaluate(() => !!document.querySelector('.theatre'));
  await pg.evaluate(() => document.querySelector('.th-x')?.click()); await w(800);
  await pg.evaluate(() => { const c = document.querySelectorAll('.dialog .dchoices button'); c[1] && c[1].click(); }); await w(800);
  await calm(); await w(2500); await calm(); seen.push(await q());
  await pg.evaluate(() => { const L = __sv.lanterns; __sv.heroes[0].place(L.dinh.front[0], L.dinh.front[1] + 6); }); await w(2500); await calm();
  // (switch storyActions) being in the village is not enough: catch the wind ribbons
  const ribbonsWaited = await q() === 'L_c1_village';
  for (let k = 0; k < 3; k++) { await pg.evaluate(k => { const it = __sv.interactables.find(i => i.id === 'story_ribbon' + k); const h = __sv.heroes[0]; if (it && it.visible(h)) it.act(h); }, k); await w(300); }
  await calm(); seen.push(await q());
  await act('story_c1_nam'); await w(600);
  for (let i = 0; i < 5; i++) { await pg.evaluate(() => document.querySelector('.dialog')?.click()); await w(400); }
  await calm(); await w(2500); await calm(); seen.push(await q());
  await act('lv_well'); await w(1800); await calm(); await w(2500); await calm(); seen.push(await q());
  await pg.evaluate(async () => { const E = await import('/js/core/events.js'); E.events.emit('ActivityCompleted', { activityId: 'x', defId: 'game:oanquan', players: [], result: { won: true } }); });
  await w(400); await calm(); await w(2500); await calm(); seen.push(await q());
  await pg.evaluate(() => __sv.lanterns._finish(__sv.heroes[0], 'c1_tale')); await w(300); await calm(); await w(2500); await calm(); seen.push(await q());
  // lift lotus leaves until the lantern shows, then pick it up
  const lifted = await pg.evaluate(() => { const h = __sv.heroes[0]; let n = 0; for (let k = 0; k < 5; k++) { const it = __sv.interactables.find(i => i.id === 'story_leaf' + k); if (it && it.visible(h)) { it.act(h); n++; } if (h.profile.lanterns.act && h.profile.lanterns.act.found) break; } return n; });
  await act('story_c1_find'); await w(600); await calm(); await w(2500); await calm();
  const carrying = await pg.evaluate(() => __sv.heroes[0].profile.lanterns.carrying); seen.push(await q());
  pg.evaluate(() => { const it = __sv.interactables.find(i => i.id === 'story_c1_hang'); it.act(__sv.heroes[0]); }); await w(1500);
  // pull the rope (drag the handle down)
  const roped = await pg.evaluate(() => { const el = document.querySelector('.handpad [data-hp=rope]'); if (!el) return false; const r = el.getBoundingClientRect(), ev = (t, y) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 9, clientX: r.left + 20, clientY: r.top + r.height * y }));
    ev('pointerdown', 0); ev('pointermove', 1); ev('pointerup', 1); return true; }); await w(2500);
  await pg.evaluate(() => document.querySelector('.th-x')?.click()); await w(1200);
  await pg.evaluate(() => document.querySelectorAll('.reward,.modal').forEach(e => e.click())); await w(800); await calm(); await w(1500);
  seen.push(await q());
  // (Play core, chapter 2; owner 12 Oct AEDT: on unless Studio switches it off) by default chapter 2 follows chapter 1;
  // switched off in Studio, the old adventures follow as before
  const dflt = seen[8];
  const noCh2 = await pg.evaluate(async () => { const C = (await import('/js/custom.js')).CUSTOM; C.features = { ...(C.features || {}), story_ch2: false }; const c = __sv.currentQuest(__sv.heroes[0].profile); delete C.features.story_ch2; return c && c.id; });
  seen[8] = await pg.evaluate(async () => { const C = (await import('/js/custom.js')).CUSTOM; C.features = { ...(C.features || {}), story_ch2: true }; await __sv.lanterns.loadCh('ch2'); const c = __sv.currentQuest(__sv.heroes[0].profile); delete C.features.story_ch2; return c && c.id; });
  const end = await pg.evaluate(() => { const G = __sv, p = G.heroes[0].profile, D = G.lanterns.dinh;
    const house = Math.min(...G.world.colliders.filter(c => c.r > 2 && c.top == null).map(c => Math.hypot(c.x - D.x, c.z - D.z) - c.r));
    return { companion: p.lanterns.companion, ch1: !!p.lanterns.chapters.ch1, keep: (p.keepsakes || []).includes('lantern_ch1'), carrying: p.lanterns.carrying, house }; });
  const want = ['L_p_owl', 'L_c1_village', 'L_c1_nam', 'L_c1_well', 'L_c1_teo', 'L_c1_tale', 'L_c1_find', 'L_c1_hang'], out = [];
  want.forEach((id, i) => { if (seen[i] !== id) out.push(`step ${i + 1} was ${seen[i]}, expected ${id}`); });
  if (seen[8] !== 'L_c2_fly') out.push('after chapter 1 the goal was ' + seen[8] + ', not chapter 2');
  if (dflt !== 'L_c2_fly') out.push('with no Studio setting (chapter 2 on by default), the goal after chapter 1 was ' + dflt + ', not chapter 2');
  if (!noCh2 || /^L_/.test(noCh2)) out.push('with chapter 2 switched off in Studio, the goal after chapter 1 was ' + noCh2 + ', not an old adventure');
  if (!film) out.push('Ông Cú\'s film did not play');
  if (end.companion !== 'dragon') out.push('the companion was not chosen');
  if (carrying !== 'ch1' || end.carrying) out.push('the lantern was not carried and then hung');
  if (!end.ch1 || !end.keep) out.push('chapter 1 not finished ' + JSON.stringify(end));
  if (!ribbonsWaited) out.push('walking into the village finished the step before the ribbons were caught');
  if (!(lifted >= 1)) out.push('no lotus leaves to lift');
  if (!roped) out.push('hanging did not ask to pull the rope');
  if (!(end.house > 5)) out.push(`a building stands ${end.house.toFixed(1)} m from the đình`);
  if (P.errors.length) out.push(...P.errors.slice(0, 2));
  await P.ctx.close();
  if (out.length) throw new Error(out.join('; '));
  return `prologue and chapter 1 played through (${want.length} steps; ribbons caught, ${lifted} lotus leaves lifted, rope pulled); đình lit, keepsake home, then "${noCh2}" (chapter 2 switched on: "${seen[8]}"); nearest building ${end.house.toFixed(1)} m away`;
});
await check('chapter2', async () => {
  // (Play core, owner's go 10 Oct) chapter 2 of the lantern story, Hà Nội, played from the start to the Trung Thu parade,
  // once as an under-5 and once as a big kid: lantern lights to Hà Nội, Cô Tam (big kids), Tèo's challenge (Ô ăn quan for
  // a big kid, Oẳn tù tì for an under-5: another game does not count), Bà Lan's bún chả by hand (big kids), counting the
  // stone turtles at Văn Miếu (a big kid answers how many and is asked again after a wrong answer), Bà Năm's story, the
  // clues by Hồ Gươm (the under-5's companion lights the way), the rope, the festival film (both pages played through),
  // Cầu Thê Húc lit, the parade, the keepsake, the new trick, and the big kids' golden turtle. Nothing stands on a road,
  // a city street or in the water.
  const shots = process.env.SV_SHOTS;
  const play = async age => {
    const P = await open(b, { w: 1000, h: 700, fast: !shots }); await clear(P.page);
    const pg = P.page, w = ms => pg.waitForTimeout(ms), seen = [], out = [];
    const q = () => pg.evaluate(() => { const c = __sv.currentQuest(__sv.heroes[0].profile); return c && c.id; });
    const calm = () => pg.evaluate(() => { document.querySelectorAll('.storybook,.dialog,.reward').forEach(e => e.remove()); __sv.paused = false; });
    const act = id => pg.evaluate(id => { const it = __sv.interactables.find(i => i.id === id), h = __sv.heroes[0]; if (!it || (it.visible && !it.visible(h))) return false; it.act(h, __sv); return true; }, id);
    const tapDialog = (n = 6) => pg.evaluate(async n => { for (let i = 0; i < n; i++) { const d = document.querySelector('.dialog:not(.out)'); if (!d || d.querySelector('.dch')) break; d.click(); await new Promise(r => setTimeout(r, 250)); } }, n);
    const choose = k => pg.evaluate(k => { const c = document.querySelectorAll('.dialog:not(.out) .dch'); if (!c[k]) return false; c[k].click(); return true; }, k);
    const step = async () => { await w(400); await calm(); await w(2200); await calm(); seen.push(await q()); };
    // (off by default: an admin switches it on in Studio)
    const offFirst = await pg.evaluate(async () => { const C = (await import('/js/custom.js')).CUSTOM, h = __sv.heroes[0], p = h.profile; p.lanterns = { companion: 'firefly', done: { p_owl: true }, chapters: { ch1: true } };
      for (const s of ['c1_village', 'c1_nam', 'c1_well', 'c1_teo', 'c1_tale', 'c1_find', 'c1_hang']) p.lanterns.done[s] = true;
      const q = __sv.currentQuest(p); C.features = { ...(C.features || {}), story_ch2: true }; return !/^L_c2/.test(q && q.id || ''); });
    await pg.evaluate(age => { const G = __sv, h = G.heroes[0], p = h.profile; p.age = age;
      p.lanterns = { companion: 'firefly', done: { p_owl: true }, chapters: { ch1: true } };
      for (const s of ['c1_village', 'c1_nam', 'c1_well', 'c1_teo', 'c1_tale', 'c1_find', 'c1_hang']) p.lanterns.done[s] = true;
      G.lanterns.companions.sync(); }, age);
    // (chapter 2's places load once a child has finished chapter 1, not at start-up)
    const lazy = await pg.evaluate(() => !__sv.lanterns.hanoi); await pg.evaluate(() => __sv.lanterns.loadHanoi()); await w(300);
    seen.push(await q());
    // walking into Hà Nội is not enough: follow the lantern lights
    await pg.evaluate(() => __sv.heroes[0].place(4, -60)); await w(2500); await calm();
    const lightsWaited = await q() === 'L_c2_fly';
    for (let k = 0; k < 3; k++) { await act('story_light' + k); await w(300); }
    await step();
    if (age === 'big') { if (!await act('story_c2_tam')) out.push('no Cô Tam button'); await w(500); await tapDialog(); await step(); }
    // Tèo's challenge: his line with Play, How to play and Later
    const teoBtn = await act('story_c2_teo'); await w(600);
    const teoChoices = await pg.evaluate(() => document.querySelectorAll('.dialog:not(.out) .dch').length); await calm();
    const emit = gid => pg.evaluate(async gid => { const E = await import('/js/core/events.js'); E.events.emit('ActivityCompleted', { activityId: 'x', defId: 'game:' + gid, players: [], result: { won: true } }); }, gid);
    await emit(age === 'big' ? 'oantuti' : 'oanquan'); await w(400);
    const otherGame = await q();
    await emit(age === 'big' ? 'oanquan' : 'oantuti'); await step();
    let fanned = false, bowls = 0;
    if (age === 'big') {
      await act('story_c2_job'); await w(800);
      fanned = await pg.evaluate(async () => { const b = document.querySelector('.handpad [data-hp=fan]'); if (!b) return false; b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); for (let i = 0; i < 100 && !document.querySelector('.handpad [data-hp=bowl]'); i++) await new Promise(r => setTimeout(r, 200)); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); return true; });
      await w(600);
      bowls = await pg.evaluate(async () => { let n = 0; for (let i = 0; i < 3; i++) { const b = document.querySelector('.handpad [data-hp=bowl]'); if (!b) break; b.click(); n++; await new Promise(r => setTimeout(r, 200)); } return n; });
      await step();
    }
    // Cô Tam's lesson: count the stone turtles
    await act('story_c2_vanmieu'); await w(600); await tapDialog(); await w(500);
    const n = age === 'big' ? 5 : 3; let counted = 0;
    for (let k = 0; k < 5; k++) { if (await act('story_turtle' + k)) counted++; await w(300); }
    await w(600);
    let askedAgain = false;
    if (age === 'big') { await choose(0); await w(500); await tapDialog(1); await w(500); askedAgain = await choose(1); await w(500); }
    await tapDialog(); await step();
    // Bà Năm's story (Sự tích Hồ Gươm): the button opens her words (the theatre is checked by 'tales')
    const namBtn = await act('story_c2_tale'); await w(600); await calm(); await pg.evaluate(() => document.querySelector('.th-x')?.click());
    await pg.evaluate(() => __sv.lanterns._finish(__sv.heroes[0], 'c2_tale')); await step();
    // the clues by the lake: an under-5's companion flies over the right one
    await pg.evaluate(() => { const H = __sv.lanterns.hanoi; __sv.heroes[0].place(H.front[0], H.front[1] + 1); }); await w(2500); await calm();
    const lead = await pg.evaluate(() => { const c = __sv.lanterns.companions.of(__sv.heroes[0]); return !!(c && c.lead); });
    const target = await pg.evaluate(() => { const t = __sv.currentQuest(__sv.heroes[0].profile).target(), L = __sv.lanterns.hanoi.lanternAt; return Math.hypot(t.x - L[0], t.z - L[1]); });
    const pickEarly = await pg.evaluate(() => { const it = __sv.interactables.find(i => i.id === 'story_c2_find'); return it.visible(__sv.heroes[0]); });
    await act('story_clue1'); await w(300);
    const wrongFound = await pg.evaluate(() => !!__sv.heroes[0].profile.lanterns.act.clue);
    await act('story_clue0'); await w(300);
    await act('story_c2_find'); await step();
    const carrying = await pg.evaluate(() => __sv.heroes[0].profile.lanterns.carrying);
    // hang it on the bridge: pull the rope, the festival film, the reward, the new trick
    pg.evaluate(() => { const it = __sv.interactables.find(i => i.id === 'story_c2_hang'); it.act(__sv.heroes[0]); }); await w(1500);
    const roped = await pg.evaluate(() => { const el = document.querySelector('.handpad [data-hp=rope]'); if (!el) return false; const r = el.getBoundingClientRect(), ev = (t, y) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 9, clientX: r.left + 20, clientY: r.top + r.height * y }));
      ev('pointerdown', 0); ev('pointermove', 1); ev('pointerup', 1); return true; });
    let film = false; for (let i = 0; i < 30 && !film; i++) { await w(300); film = await pg.evaluate(async () => !!document.querySelector('.theatre.film canvas.th-film')); }
    if (shots) { await w(2500); await pg.screenshot({ path: `${shots}/ch2_film_${age}.png` }); }
    await pg.evaluate(() => document.querySelector('.th-x')?.click()); await w(1200);
    await pg.evaluate(() => document.querySelectorAll('.reward').forEach(e => e.click())); await w(800); await tapDialog(); await w(400); await calm(); await w(1500);
    const end = await pg.evaluate(() => { const G = __sv, p = G.heroes[0].profile, H = G.lanterns.hanoi;
      return { ch2: !!p.lanterns.chapters.ch2, keep: (p.keepsakes || []).includes('lantern_ch2'), carrying: p.lanterns.carrying, tricks: p.lanterns.tricks || [], lit: H.lit(), parade: H.paradeOn(),
        secret: (it => it.visible(G.heroes[0]))(G.interactables.find(i => i.id === 'story_c2_secret')), after: (q => q && q.id)(G.currentQuest(p)) }; });
    if (shots) { await pg.evaluate(() => { const H = __sv.lanterns.hanoi; __sv.heroes[0].place(H.front[0], H.front[1] + 3); }); await w(4000); await calm(); await pg.screenshot({ path: `${shots}/ch2_parade_${age}.png` }); }
    let sticker = false;
    if (age === 'big' && end.secret) { await act('story_c2_secret'); await w(400); await pg.evaluate(() => document.querySelectorAll('.reward').forEach(e => e.click())); await w(400); sticker = await pg.evaluate(() => __sv.heroes[0].profile.stickers.includes('🐢') && !__sv.interactables.find(i => i.id === 'story_c2_secret').visible(__sv.heroes[0])); }
    // nothing of the chapter on a road, a city street or in the water
    const placed = await pg.evaluate(async () => { const W = await import('/js/world.js'), H = __sv.lanterns.hanoi, bad = [];
      const pts = [['front', H.front[0], H.front[1]], ...H.clues.map(c => ['clue' + c.k, c.x, c.z]), ...H.people.map(c => [c.id, c.x, c.z]), ...H.turtles.map(t => ['turtle' + t.k, t.x, t.z]),
        ...__sv.interactables.filter(i => /^story_light/.test(i.id)).map(i => [i.id, i.x, i.z])];
      for (const [id, x, z] of pts) { const d = W.roadDist(x, z); if (d.road && d.d < d.road.w / 2 + .5) bad.push(id + ' on a road');
        for (const c of W.CITIES) if (c.layout && x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1 && Math.abs((x - c.x) * Math.cos(c.layout.toward) - (z - c.z) * Math.sin(c.layout.toward)) < 2.6) bad.push(id + ' on ' + c.id + "'s street");
        if (W.heightAt(x, z) < W.WATER + .3) bad.push(id + ' in the water'); }
      return bad; });
    // the festival film: both pages play to their end
    const filmRun = await pg.evaluate(async () => {
      const F = await import('/js/film.js'), C = await import('/js/content/films.js'); await import('/js/content/chapter2films.js');
      const { STORY_TALES } = await import('/js/content/chapters.js'), { openTheatre } = await import('/js/tales.js'), st = STORY_TALES.lantern_ch2, bad = [];
      openTheatre({ ...st, story: true, title: () => st.title[0], ctx: { name: 'Na', companion: 'dragon' } }, { name: 'Na' }); for (let i = 0; i < 50 && !F.filmNow(); i++) await new Promise(r => setTimeout(r, 100));
      document.querySelector('.th-pause')?.click(); const f = F.filmNow(); if (!f) return ['no film'];
      const frame = () => new Promise(r => requestAnimationFrame(r));
      for (let k = 0; k < C.FILMS.lantern_ch2.pages.length; k++) { const done = f.page(k); let ended = false; done.then(() => { ended = true; }); const p = f.now; f.narrated();
        for (let i = 0; i < 600 && !ended; i++) { if (p.hold) p.release(true); p.t += .2; await frame(); }
        if (!ended) bad.push('page ' + (k + 1) + ' did not end'); if (!p.actors.length) bad.push('page ' + (k + 1) + ': nobody in it'); }
      document.querySelector('.th-x')?.click(); await new Promise(r => setTimeout(r, 400)); if (F.filmNow()) bad.push('not freed');
      return bad; });
    const want = age === 'big' ? ['L_c2_fly', 'L_c2_tam', 'L_c2_teo', 'L_c2_job', 'L_c2_vanmieu', 'L_c2_tale', 'L_c2_find', 'L_c2_hang'] : ['L_c2_fly', 'L_c2_teo', 'L_c2_vanmieu', 'L_c2_tale', 'L_c2_find', 'L_c2_hang'];
    want.forEach((id, i) => { if (seen[i] !== id) out.push(`step ${i + 1} was ${seen[i]}, expected ${id}`); });
    if (!offFirst) out.push('chapter 2 started before an admin switched it on');
    if (!lazy) out.push('chapter 2 was loaded at start-up');
    if (!lightsWaited) out.push('walking into Hà Nội finished the step before the lights were followed');
    if (!teoBtn || teoChoices !== 3) out.push(`Tèo's challenge did not offer Play, How to play and Later (${teoChoices})`);
    if (otherGame !== 'L_c2_teo') out.push('the other age group\'s game finished Tèo\'s challenge');
    if (age === 'big' && (!fanned || bowls !== 3)) out.push(`the bún chả job was not done by hand (fan ${fanned}, bowls ${bowls})`);
    if (counted !== n) out.push(`${counted} stone turtles to count, expected ${n}`);
    if (age === 'big' && !askedAgain) out.push('a wrong count was not asked again');
    if (!namBtn) out.push('no button for Bà Năm\'s story');
    if (age !== 'big' && (!lead || target > .5)) out.push(`the companion did not light the way (lead ${lead}, arrow ${target.toFixed(1)} m from the lantern)`);
    if (age === 'big' && lead) out.push('the companion led a big kid');
    if (pickEarly || wrongFound) out.push('the lantern showed before the right spot was found');
    if (carrying !== 'ch2' || end.carrying) out.push('the lantern was not carried and then hung');
    if (!roped) out.push('hanging did not ask to pull the rope');
    if (!film) out.push('the festival film did not open');
    if (!end.ch2 || !end.keep) out.push('chapter 2 not finished ' + JSON.stringify(end));
    if (!end.lit) out.push('Cầu Thê Húc did not light up');
    if (!end.parade) out.push('no Trung Thu parade');
    if (!end.tricks.includes('light')) out.push('the companion did not learn its trick');
    if (!end.after || /^L_c2/.test(end.after)) out.push('after chapter 2 the goal was ' + end.after);
    if (age === 'big' && (!end.secret || !sticker)) out.push('no golden turtle secret for a big kid');
    if (age !== 'big' && end.secret) out.push('the golden turtle showed for an under-5');
    out.push(...placed, ...filmRun.map(x => 'film: ' + x));
    if (P.errors.length) out.push(...P.errors.slice(0, 2));
    await P.ctx.close();
    return { out, steps: want.length, counted, after: end.after };
  };
  const little = await play('little'), big = await play('big');
  const bad = [...little.out.map(x => 'under-5: ' + x), ...big.out.map(x => 'big kid: ' + x)];
  // (owner, 10 Oct: "Chi's look can be changed in Studio") Studio's looks change Chi, Jack and Ruby; a bad value keeps the
  // chapter's own look, and Bà Năm keeps hers
  { const P = await open(b, { w: 800, h: 600 }); const L = await P.page.evaluate(async () => { const { lookOf } = await import('/js/content/chapter3sydney.js');
      return { chi: lookOf('chi'), set: lookOf('chi', { chi: { color: '#ff0000', style: 'dress', hairStyle: 'nope', hair: 'red' } }), nam: lookOf('nam', { nam: { color: '#ff0000' } }), bad: lookOf('jack', 'x') }; });
    await P.ctx.close();
    if (L.chi.hairStyle !== 'ponytail' || L.chi.color !== '#ffd23f') bad.push('Chi\'s own look changed: ' + JSON.stringify(L.chi));
    if (L.set.color !== '#ff0000' || L.set.style !== 'dress' || L.set.hairStyle !== 'ponytail' || L.set.hair !== L.chi.hair) bad.push('Studio\'s look for Chi was not used safely: ' + JSON.stringify(L.set));
    if (L.nam.color === '#ff0000' || L.bad.color !== '#3b6fe0') bad.push('Bà Năm or a bad pack changed a look'); }
  if (bad.length) throw new Error(bad.join('; '));
  return `under-5: ${little.steps} steps (${little.counted} turtles, the companion lit the way); big kid: ${big.steps} steps (Ô ăn quan, bún chả by hand, ${big.counted} turtles and a question, clues); rope, film (2 pages), Cầu Thê Húc lit, parade, keepsake, new trick, golden turtle for the big kid; then "${big.after}"`;
});
await check('chapter3', async () => {
  // (Play core, owner's go 10 Oct) chapter 3 of the lantern story, Sydney, played from the start to the fireworks, once as
  // an under-5 and once as a big kid: off until an admin switches it on; lantern lights to Sydney, Chi (big kids), Chi's
  // Aussie words (pictures for an under-5, meanings for a big kid; a wrong answer is never punished), Captain Molly's
  // ferries (big kids), Jack and Ruby's challenge (cricket for a big kid, tug of war for an under-5: the other game does not
  // count), Bà Năm's Magic Pudding, the clues by the harbour (the under-5's companion flies high and leads), the rope, the
  // festival film (both pages played through), the Opera House lit, fireworks, the keepsake, the new trick (flying higher)
  // and the big kids' koala. Nothing stands on a road, a city street or in the water.
  const play = async age => {
    const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
    const pg = P.page, w = ms => pg.waitForTimeout(ms), seen = [], out = [];
    const q = () => pg.evaluate(() => { const c = __sv.currentQuest(__sv.heroes[0].profile); return c && c.id; });
    const calm = () => pg.evaluate(() => { document.querySelectorAll('.storybook,.dialog,.reward').forEach(e => e.remove()); __sv.paused = false; });
    const act = id => pg.evaluate(id => { const it = __sv.interactables.find(i => i.id === id), h = __sv.heroes[0]; if (!it || (it.visible && !it.visible(h))) return false; it.act(h, __sv); return true; }, id);
    const tapDialog = (n = 6) => pg.evaluate(async n => { for (let i = 0; i < n; i++) { const d = document.querySelector('.dialog:not(.out)'); if (!d || d.querySelector('.dch')) break; d.click(); await new Promise(r => setTimeout(r, 250)); } }, n);
    const step = async () => { await w(400); await calm(); await w(2200); await calm(); seen.push(await q()); };
    const emit = gid => pg.evaluate(async gid => { const E = await import('/js/core/events.js'); E.events.emit('ActivityCompleted', { activityId: 'x', defId: 'game:' + gid, players: [], result: { won: true } }); }, gid);
    // chapter 2 done; chapter 3 is off until an admin switches it on
    // (chapter 2's steps come with its file, which the game loads once chapter 1's lantern is found)
    const offFirst = await pg.evaluate(async age => { const G = __sv, p = G.heroes[0].profile, C = (await import('/js/custom.js')).CUSTOM, { CHAPTERS } = await import('/js/content/chapters.js');
      C.features = { ...(C.features || {}), story_ch2: true }; await G.lanterns.loadCh('ch2');
      p.age = age; p.lanterns = { companion: 'firefly', done: { p_owl: true }, chapters: { ch1: true, ch2: true } };
      for (const c of CHAPTERS.slice(1, 3)) for (const s of c.steps) p.lanterns.done[s.id] = true;
      C.features = { ...(C.features || {}), story_ch2: true }; const before = G.currentQuest(p);
      C.features.story_ch3 = true; G.lanterns.companions.sync(); return !/^L_c3/.test(before && before.id || ''); }, age);
    await pg.evaluate(() => __sv.lanterns.loadCh('ch3')); await w(300);
    seen.push(await q());
    await pg.evaluate(() => __sv.heroes[0].place(-36, 52)); await w(2500); await calm();
    const lightsWaited = await q() === 'L_c3_fly';
    for (let k = 0; k < 3; k++) { await act('story_light_c3_fly_' + k); await w(300); }
    await step();
    if (age === 'big') { await act('story_c3_chi'); await w(500); await tapDialog(); await step(); }
    // Chi's words: tap the buttons until each word is right (a wrong one just hides)
    await act('story_c3_words'); await w(800);
    // (a big kid's answers are words that can be read; an under-5's are pictures)
    const wordBtn = await pg.evaluate(() => { const b = document.querySelector('.handpad [data-hp=w0]'); if (!b) return null; const cs = getComputedStyle(b); return { text: b.textContent.trim(), size: parseFloat(cs.fontSize), pic: !!b.querySelector('.art, .emo, svg, img'), h: b.getBoundingClientRect().height }; });
    let rounds = 0, wrongs = 0;
    for (let i = 0; i < 20; i++) {
      const r = await pg.evaluate(() => { const bs = [...document.querySelectorAll('.handpad [data-hp^=w]')], b = bs.find(x => x.style.visibility !== 'hidden'); if (!b) return null; const word = document.querySelector('.handpad p b').textContent, hidden = bs.filter(x => x.style.visibility === 'hidden').length; b.click(); return { word, hidden }; });
      if (r == null) break;
      // (right: the next word comes, or the game ends; wrong: that button hides)
      const res = await pg.evaluate(async r => { for (let k = 0; k < 40; k++) { await new Promise(x => setTimeout(x, 150)); const b = document.querySelector('.handpad p b'), bs = [...document.querySelectorAll('.handpad [data-hp^=w]')];
        if (!b || b.textContent !== r.word) return 'right'; if (bs.filter(x => x.style.visibility === 'hidden').length > r.hidden) return 'wrong'; } return 'none'; }, r);
      if (res === 'right') rounds++; else if (res === 'wrong') wrongs++; else break; }
    await step();
    if (age === 'big') { await emit('ferries'); await step(); }
    const jackBtn = await act('story_c3_jack'); await w(600);
    const jackChoices = await pg.evaluate(() => document.querySelectorAll('.dialog:not(.out) .dch').length); await calm();
    await emit(age === 'big' ? 'tug' : 'cricket'); await w(400); const otherGame = await q();
    await emit(age === 'big' ? 'cricket' : 'tug'); await step();
    const namBtn = await act('story_c3_tale'); await w(600); await calm(); await pg.evaluate(() => document.querySelector('.th-x')?.click());
    await pg.evaluate(() => __sv.lanterns._finish(__sv.heroes[0], 'c3_tale')); await step();
    // the clues by the harbour
    await pg.evaluate(() => { const S = __sv.lanterns.sydney; __sv.heroes[0].place(S.front[0], S.front[1] + 1); }); await w(2500); await calm();
    const lead = await pg.evaluate(() => { const c = __sv.lanterns.companions.of(__sv.heroes[0]); return c && c.lead ? !!c.lead.high : false; });
    await act('story_clue3_1'); await w(300);
    const wrongFound = await pg.evaluate(() => !!(__sv.heroes[0].profile.lanterns.act || {}).clue3);
    await act('story_clue3_0'); await w(300); await act('story_c3_find'); await step();
    const carrying = await pg.evaluate(() => __sv.heroes[0].profile.lanterns.carrying);
    pg.evaluate(() => { const it = __sv.interactables.find(i => i.id === 'story_c3_hang'); it.act(__sv.heroes[0]); }); await w(1500);
    const roped = await pg.evaluate(() => { const el = document.querySelector('.handpad [data-hp=rope]'); if (!el) return false; const r = el.getBoundingClientRect(), ev = (t, y) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 9, clientX: r.left + 20, clientY: r.top + r.height * y }));
      ev('pointerdown', 0); ev('pointermove', 1); ev('pointerup', 1); return true; });
    let film = false; for (let i = 0; i < 30 && !film; i++) { await w(300); film = await pg.evaluate(() => !!document.querySelector('.theatre.film canvas.th-film')); }
    await pg.evaluate(() => document.querySelector('.th-x')?.click()); await w(1200);
    await pg.evaluate(() => document.querySelectorAll('.reward').forEach(e => e.click())); await w(800); await tapDialog(); await w(400); await calm(); await w(1500);
    const end = await pg.evaluate(() => { const G = __sv, p = G.heroes[0].profile, S = G.lanterns.sydney;
      return { ch3: !!p.lanterns.chapters.ch3, keep: (p.keepsakes || []).includes('lantern_ch3'), carrying: p.lanterns.carrying, tricks: p.lanterns.tricks || [], lit: S.lit(), show: S.showOn(),
        secret: G.interactables.find(i => i.id === 'story_c3_secret').visible(G.heroes[0]), after: (q => q && q.id)(G.currentQuest(p)) }; });
    let sticker = false;
    if (age === 'big' && end.secret) { await act('story_c3_secret'); await w(400); await pg.evaluate(() => document.querySelectorAll('.reward').forEach(e => e.click())); await w(400); sticker = await pg.evaluate(() => __sv.heroes[0].profile.stickers.includes('🐨')); }
    const placed = await pg.evaluate(async () => { const W = await import('/js/world.js'), S = __sv.lanterns.sydney, bad = [];
      const pts = [['front', S.front[0], S.front[1]], ...S.clues.map(c => ['clue' + c.k, c.x, c.z]), ...S.people.map(c => [c.id, c.x, c.z]), ['koala', S.koala.x, S.koala.z],
        ...__sv.interactables.filter(i => /^story_light_c3/.test(i.id)).map(i => [i.id, i.x, i.z])];
      for (const [id, x, z] of pts) { const d = W.roadDist(x, z); if (d.road && d.d < d.road.w / 2 + .5) bad.push(id + ' on a road');
        for (const c of W.CITIES) if (c.layout && x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1 && Math.abs((x - c.x) * Math.cos(c.layout.toward) - (z - c.z) * Math.sin(c.layout.toward)) < 2.6) bad.push(id + ' on ' + c.id + "'s street");
        if (W.heightAt(x, z) < W.WATER + .3) bad.push(id + ' in the water'); }
      return bad; });
    const filmRun = await pg.evaluate(async () => {
      const F = await import('/js/film.js'), C = await import('/js/content/films.js'); await import('/js/content/chapter3films.js');
      const { STORY_TALES } = await import('/js/content/chapters.js'), { openTheatre } = await import('/js/tales.js'), st = STORY_TALES.lantern_ch3, bad = [];
      openTheatre({ ...st, story: true, title: () => st.title[0], ctx: { name: 'Na', companion: 'dragon' } }, { name: 'Na' }); for (let i = 0; i < 50 && !F.filmNow(); i++) await new Promise(r => setTimeout(r, 100));
      document.querySelector('.th-pause')?.click(); const f = F.filmNow(); if (!f) return ['no film'];
      const frame = () => new Promise(r => requestAnimationFrame(r)); let helps = 0;
      for (let k = 0; k < C.FILMS.lantern_ch3.pages.length; k++) { const done = f.page(k); let ended = false; done.then(() => { ended = true; }); const p = f.now; f.narrated();
        for (let i = 0; i < 600 && !ended; i++) { if (p.hold) { helps++; p.release(true); } p.t += .2; await frame(); }
        if (!ended) bad.push('page ' + (k + 1) + ' did not end'); if (!p.actors.length) bad.push('page ' + (k + 1) + ': nobody in it'); }
      if (!helps) bad.push('the child never helped');
      document.querySelector('.th-x')?.click(); await new Promise(r => setTimeout(r, 400)); if (F.filmNow()) bad.push('not freed');
      return bad; });
    const want = age === 'big' ? ['L_c3_fly', 'L_c3_chi', 'L_c3_words', 'L_c3_ferry', 'L_c3_jack', 'L_c3_tale', 'L_c3_find', 'L_c3_hang'] : ['L_c3_fly', 'L_c3_words', 'L_c3_jack', 'L_c3_tale', 'L_c3_find', 'L_c3_hang'];
    want.forEach((id, i) => { if (seen[i] !== id) out.push(`step ${i + 1} was ${seen[i]}, expected ${id}`); });
    if (!offFirst) out.push('chapter 3 started before an admin switched it on');
    if (!lightsWaited) out.push('walking into Sydney finished the step before the lights were followed');
    if (!wordBtn) out.push('no word buttons');
    else if (age === 'big' ? !(wordBtn.text && wordBtn.size >= 16) : !wordBtn.pic) out.push('word buttons: ' + JSON.stringify(wordBtn));
    else if (wordBtn.h < (age === 'big' ? 44 : 64)) out.push('word buttons too small: ' + wordBtn.h);
    if (rounds !== (age === 'big' ? 4 : 2)) out.push(`${rounds} words with Chi, expected ${age === 'big' ? 4 : 2}`);
    if (!jackBtn || jackChoices !== 3) out.push(`Jack and Ruby's challenge did not offer Play, How to play and Later (${jackChoices})`);
    if (otherGame !== 'L_c3_jack') out.push('the other age group\'s game finished Jack and Ruby\'s challenge');
    if (!namBtn) out.push('no button for Bà Năm\'s story');
    if (age !== 'big' && !lead) out.push('the companion did not fly high to lead the way');
    if (age === 'big' && lead) out.push('the companion led a big kid');
    if (wrongFound) out.push('the lantern showed at the wrong spot');
    if (carrying !== 'ch3' || end.carrying) out.push('the lantern was not carried and then hung');
    if (!roped) out.push('hanging did not ask to pull the rope');
    if (!film) out.push('the festival film did not open');
    if (!end.ch3 || !end.keep) out.push('chapter 3 not finished ' + JSON.stringify(end));
    if (!end.lit) out.push('the Opera House did not light up');
    if (!end.show) out.push('no fireworks');
    if (!end.tricks.includes('higher')) out.push('the companion did not learn its trick');
    if (!end.after || /^L_c3/.test(end.after)) out.push('after chapter 3 the goal was ' + end.after);
    if (age === 'big' && (!end.secret || !sticker)) out.push('no koala secret for a big kid');
    if (age !== 'big' && end.secret) out.push('the koala showed for an under-5');
    out.push(...placed, ...filmRun.map(x => 'film: ' + x));
    if (P.errors.length) out.push(...P.errors.slice(0, 2));
    await P.ctx.close();
    return { out, steps: want.length, rounds, wrongs, after: end.after };
  };
  const little = await play('little'), big = await play('big');
  const bad = [...little.out.map(x => 'under-5: ' + x), ...big.out.map(x => 'big kid: ' + x)];
  // (owner, 10 Oct: "Chi's look can be changed in Studio") Studio's looks change Chi, Jack and Ruby; a bad value keeps the
  // chapter's own look, and Bà Năm keeps hers
  { const P = await open(b, { w: 800, h: 600 }); const L = await P.page.evaluate(async () => { const { lookOf } = await import('/js/content/chapter3sydney.js');
      return { chi: lookOf('chi'), set: lookOf('chi', { chi: { color: '#ff0000', style: 'dress', hairStyle: 'nope', hair: 'red' } }), nam: lookOf('nam', { nam: { color: '#ff0000' } }), bad: lookOf('jack', 'x') }; });
    await P.ctx.close();
    if (L.chi.hairStyle !== 'ponytail' || L.chi.color !== '#ffd23f') bad.push('Chi\'s own look changed: ' + JSON.stringify(L.chi));
    if (L.set.color !== '#ff0000' || L.set.style !== 'dress' || L.set.hairStyle !== 'ponytail' || L.set.hair !== L.chi.hair) bad.push('Studio\'s look for Chi was not used safely: ' + JSON.stringify(L.set));
    if (L.nam.color === '#ff0000' || L.bad.color !== '#3b6fe0') bad.push('Bà Năm or a bad pack changed a look'); }
  if (bad.length) throw new Error(bad.join('; '));
  return `under-5: ${little.steps} steps (${little.rounds} picture words, the companion flew high to lead); big kid: ${big.steps} steps (${big.rounds} Aussie words, ferries, cricket, clues); rope, film (2 pages, the child starts the fireworks), Opera House lit, fireworks, keepsake, new trick, koala for the big kid; Studio can change Chi, Jack and Ruby's looks; then "${big.after}"`;
});
await check('yard', async () => {
  // (round R, owner: bà Huệ and ông Nghi's quest chain) the yard stands in an open spot near the Huệ Nghi shop; the side
  // story plays from bà Huệ's start to the house-warming meal: the coach from Hà Tĩnh, a job for each relative (a wrong
  // job is turned down kindly), the dump truck tips its load, the excavator digs, the house is built; the truck and the
  // excavator stay for free play afterwards
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const pg = P.page, seen = [], handsUsed = new Set();
  const goal = () => pg.evaluate(() => { const c = __sv.currentQuest(__sv.heroes[0].profile); return c && c.id; });
  // tap through speech boxes, choosing answer `pick` when there is a choice, until the button's work is over
  const use = async (id, pick = 0) => {
    const ok = await pg.evaluate(id => { const h = __sv.heroes[0], it = __sv.interactables.find(i => i.id === id); if (!it || (it.visible && !it.visible(h))) return false; it.act(h, __sv); return true; }, id);
    if (!ok) return false;
    for (let i = 0; i < 200; i++) {
      await pg.waitForTimeout(350);
      // (switch yardHands) the panel of big controls: tap the buttons, hold the pedal, drag the handles like a child
      const hp = await pg.evaluate(() => {
        const ev = (el, type, y) => { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 9, clientX: r.left + r.width / 2, clientY: r.top + r.height * y })); };
        const p = document.querySelector('.handpad'); if (!p) return '';
        const b = p.querySelector('[data-hp=load], [data-hp=brick]'); if (b) { b.click(); return 'tap'; }
        const ped = p.querySelector('[data-hp=pedal]'); if (ped) { if (!ped.classList.contains('on')) ev(ped, 'pointerdown', .5); return 'hold'; }
        const sl = p.querySelector('[data-hp=lever], [data-hp=roof]'); if (sl) { ev(sl, 'pointerdown', 0); ev(sl, 'pointermove', 1); ev(sl, 'pointerup', 1); return 'pull'; }
        const arm = p.querySelector('[data-hp=arm]'); if (arm) { window.__armY = window.__armY ? 0 : 1; ev(arm, 'pointerdown', window.__armY); ev(arm, 'pointerup', window.__armY); return 'dig'; }
        return '';
      });
      if (hp) { handsUsed.add(hp); continue; }
      const s = await pg.evaluate(pick => { const c = document.querySelectorAll('.dialog .dchoices button'); if (c.length) { c[Math.min(pick, c.length - 1)].click(); return 'c'; } const d = document.querySelector('.dialog'); if (d) { d.click(); return 'd'; } return document.querySelector('.reward') ? 'r' : ''; }, pick);
      if (s === 'r') { await pg.evaluate(() => document.querySelectorAll('.reward').forEach(e => e.click())); }
      if (!s && !(await pg.evaluate(() => __sv.paused || __sv.yard.busy()))) break;
    }
    await pg.evaluate(() => { document.querySelectorAll('.storybook,.reward').forEach(e => e.remove()); __sv.paused = false; });
    return true;
  };
  const info = await pg.evaluate(() => { const Y = __sv.yard, sh = __sv.interactables.find(i => i.id === 'npc_bahue');
    const house = Math.min(...__sv.world.colliders.filter(c => c.r > 2 && c.top == null).map(c => Math.hypot(c.x - Y.at.x, c.z - Y.at.z) - c.r));
    return { far: Math.hypot(sh.x - Y.at.x, sh.z - Y.at.z), room: Y.at.room || 0, house }; });
  seen.push(await goal()); await use('yard_start');
  // (owner 9 Oct: a side story) starting it leaves the goal bar on the main story; Follow on the Adventures page puts it there
  const stayed = await goal();
  const followed = await pg.evaluate(async () => { __sv.openPad(0, 'log'); await new Promise(r => setTimeout(r, 600)); const b = document.querySelector('.pad [data-follow=yard]'); if (!b) return false; b.click(); await new Promise(r => setTimeout(r, 400)); document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; return __sv.heroes[0].profile.follow === 'yard'; });
  seen.push(await goal());
  await use('yard_coach'); seen.push(await goal());
  const rels = await pg.evaluate(async () => (await import('/js/content/yard.js')).RELATIVES.map(r => [r.id, r.job]));
  await use('yard_job_' + rels[0][0], (rels[0][1] + 1) % 3); const wrongKept = await pg.evaluate(id => __sv.heroes[0].profile.yard.jobs[id] == null, rels[0][0]);
  for (const [id, job] of rels) await use('yard_job_' + id, job);
  seen.push(await goal());
  await use('yard_truck'); const heap = await pg.evaluate(() => __sv.heroes[0].profile.yard.done.y_truck); seen.push(await goal());
  await use('yard_dig'); seen.push(await goal());
  await use('yard_build'); seen.push(await goal());
  await use('yard_party'); seen.push(await goal());
  const free = await pg.evaluate(() => { const h = __sv.heroes[0]; return ['yard_truck', 'yard_dig'].every(id => __sv.interactables.find(i => i.id === id).visible(h)); });
  const want = ['', 'Y_y_coach', 'Y_y_jobs', 'Y_y_truck', 'Y_y_dig', 'Y_y_build', 'Y_y_party'], out = [];
  want.forEach((id, i) => { if (i && seen[i] !== id) out.push(`goal ${i} was ${seen[i]}, expected ${id}`); });
  if (/^Y_/.test(seen[0] || '') || /^Y_/.test(seen[7] || '')) out.push('the yard was the goal before it started or after it ended: ' + seen[0] + ' / ' + seen[7]);
  if (/^Y_/.test(stayed || '')) out.push('starting the yard took over the goal bar (' + stayed + ')');
  if (!followed) out.push('no Follow button for the yard on the Adventures page');
  if (!wrongKept) out.push('a wrong job was accepted');
  if (!heap) out.push('the truck run did not finish');
  if (!free) out.push('the truck and excavator are not open for free play afterwards');
  for (const k of ['tap', 'hold', 'pull', 'dig']) if (!handsUsed.has(k)) out.push(`the yard by hand never asked to ${k}`);
  if (!(info.far < 70)) out.push(`the yard is ${info.far.toFixed(0)} m from the Huệ Nghi shop`);
  if (!(info.house > 6)) out.push(`a building stands ${info.house.toFixed(1)} m from the middle of the yard`);
  if (P.errors.length) out.push(...P.errors.slice(0, 2));
  await P.ctx.close();
  if (out.length) throw new Error(out.join('; '));
  return `the yard ${info.far.toFixed(0)} m from the shop, ${info.room.toFixed(0)} m of room; a side story (goal bar stays on the lantern story until Follow); coach, jobs (a wrong one turned down), dump truck (load, hold the pedal, pull the lever), excavator (drag the arm), bricks and roof by hand, and the meal played through; free play after`;
});
await check('kidplay', async () => {
  // (round R, owner 9 Oct: "add these in and add to the studio so we can switch on/off") the companion is fed once a day
  // and grows (a trick from size 3), a coin goal buys it a hat, a gift waits by a landmark each day, the story's films
  // have a Skip button, and each Studio switch turns its part off
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], w = t => new Promise(r => setTimeout(r, t)), C = (await import('/js/custom.js')).CUSTOM, S = await import('/js/state.js');
    h.profile.lanterns = { companion: 'firefly', done: { p_owl: true }, chapters: {} }; G.lanterns.companions.sync(); await w(1500);
    const out = {}, chip = c => G.huds[0].root.querySelector('.kidrow .' + c);
    out.chips = !!chip('c-pet') && !chip('c-pet').hidden && !!chip('c-goal') && !chip('c-goal').hidden;
    // feed: once a day; pretend the days pass
    chip('c-pet').click(); const pet = h.profile.lanterns.pet; out.fed1 = pet.feeds;
    chip('c-pet').click(); out.fedAgain = pet.feeds;
    for (let k = 0; k < 4; k++) { pet.fed = -1; G.kidplay.feed(h); }
    out.level = G.kidplay.level(h); await w(400);
    out.scale = G.lanterns.companions.of(h).o.scale.x;
    G.kidplay.feed(h); await w(100); out.trick = !!G.lanterns.companions.of(h).trick;
    // the coin goal: a hat
    const c0 = S.farm.coins; G.addCoins(100 - c0); await w(700); out.goalReady = chip('c-goal').classList.contains('ready');
    chip('c-goal').click(); await w(400); out.hat = pet.hat; out.coinsAfter = S.farm.coins; out.hatOn = !!G.lanterns.companions.of(h).hat;
    // the daily gift
    const gift = G.interactables.find(i => i.id === 'gift_today'); out.giftSeen = gift.visible(h); const cg = S.farm.coins; gift.act(h); out.giftCoins = S.farm.coins - cg; out.giftAfter = gift.visible(h);
    // the Skip button on a story film
    const { openTheatre } = await import('/js/tales.js'), { STORY_TALES } = await import('/js/content/chapters.js'), t = STORY_TALES.lantern_prologue;
    openTheatre({ ...t, story: true, title: () => t.title[0], ctx: { name: 'Na', companion: 'firefly' } }, { name: 'Na' }); await w(1500);
    out.skip = !!document.querySelector('.theatre .th-skip'); document.querySelector('.th-skip')?.click(); await w(600); out.skipClosed = !document.querySelector('.theatre');
    // the switches
    C.features = C.features || {};
    for (const id of ['companionGrow', 'saveGoal', 'dailySurprise', 'shortTalk', 'simpleStart', 'yardHands', 'storyActions']) C.features[id] = false;
    h.profile.gift = null; await w(1200);
    out.offChips = chip('c-pet').hidden && chip('c-goal').hidden; out.offGift = !gift.visible(h); out.offLevel = G.kidplay.level(h);
    out.offSimple = (await import('/js/simple.js')).wantsSimple({ age: 'little' });
    openTheatre({ ...t, story: true, title: () => t.title[0], ctx: { name: 'Na', companion: 'firefly' } }, { name: 'Na' }); await w(1200);
    out.offSkip = !document.querySelector('.theatre .th-skip'); document.querySelector('.th-x')?.click(); await w(400);
    for (const id of Object.keys(C.features)) delete C.features[id];
    return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (!r.chips) bad.push('no Feed or goal button beside the coins');
  if (r.fed1 !== 1 || r.fedAgain !== 1) bad.push(`feeding is not once a day (${r.fed1}, ${r.fedAgain})`);
  if (!(r.level >= 3) || !(r.scale > 1.2)) bad.push(`the companion did not grow (level ${r.level}, size ${r.scale})`);
  if (!r.trick) bad.push('no trick at size 3');
  if (!r.goalReady || r.hat !== 'party' || r.coinsAfter !== 70 || !r.hatOn) bad.push('the coin goal did not buy the hat ' + JSON.stringify(r));
  if (!r.giftSeen || r.giftCoins !== 15 || r.giftAfter) bad.push('the daily gift ' + JSON.stringify({ seen: r.giftSeen, coins: r.giftCoins, after: r.giftAfter }));
  if (!r.skip || !r.skipClosed) bad.push('no Skip button on the story film');
  if (!r.offChips || !r.offGift || r.offLevel !== 1 || r.offSimple || !r.offSkip) bad.push('a Studio switch did not turn its part off ' + JSON.stringify(r));
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return `fed once a day, grew to size ${r.level} with a trick, bought the party hat (100 → 70 coins), opened today's gift (+15), Skip on story films; every switch turns its part off`;
});
await check('shop', async () => {
  // (round S, owner plan 8 Oct: Round R Part 2 item 6) the clothes shop stands by the market off the roads; the Bag button
  // takes the child there; the big card has picture tabs and coin prices (≥ 64 px for under-5s); buying takes game coins
  // and puts the thing on; the wardrobe shows what is owned; what a child already wore counts as owned; the 3D character
  // draws every new piece with few extra parts; the Studio switch puts the old Bag and wardrobe back
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, w = t => new Promise(r => setTimeout(r, t)), S = await import('/js/state.js'), W = await import('/js/world.js');
    const C = (await import('/js/custom.js')).CUSTOM, SH = await import('/js/content/shop.js'), { buildAvatar } = await import('/js/avatar.js');
    const out = {}, sp = G.shop.spot, rd = W.roadDist(sp.x, sp.z), M = W.MARKET;
    out.spot = [Math.round(sp.x), Math.round(sp.z)]; out.offRoad = !rd.road || rd.d > rd.road.w / 2 + 1.5;
    out.nearMarket = Math.hypot(Math.max(M.x0 - sp.x, 0, sp.x - M.x1), Math.max(M.z0 - sp.z, 0, sp.z - M.z1)) < 40;
    out.dry = W.heightAt(sp.x, sp.z) > W.WATER + .3; out.tap = !!G.interactables.find(i => i.id === 'shop_clothes');
    // the Bag button (Bug #29, owner 10 Oct: "bag is bag"): it opens the backpack, with one small shop button that opens the
    // shop right there, no travel; the stall in the valley stays
    p.age = 'big'; G.addCoins(500 - S.farm.coins); const pos0 = { x: h.pos.x, z: h.pos.z }; G.huds[0].root.querySelector('.dk.bag').click(); await w(500);
    // (tester's notes, 12 Oct; owner: "bottom bar") the shop button sits beside the Bag in the dock, not inside the bag
    const sb = G.huds[0].root.querySelector('.dk.shop'); out.bagOpens = !!document.querySelector('.modal.pad') && !document.querySelector('.modal.shopk') && !document.querySelector('.modal.pad .bagshop') && !!sb && !sb.hidden;
    out.bagShopBtn = sb ? (() => { const q = sb.getBoundingClientRect(); return q.width >= 44 && q.height >= 44; })() : false;
    document.querySelector('.modal.pad .x, .modal.pad .pad-x')?.click(); G.closePad && G.closePad(0); await w(300); sb && sb.click(); await w(700);
    out.there = Math.hypot(h.pos.x - pos0.x, h.pos.z - pos0.z) < 1 && !document.querySelector('.modal.pad'); const card = document.querySelector('.modal.shopk .card');
    out.opened = !!card; out.tabs = card ? card.querySelectorAll('.ktab').length : 0; out.noBagTab = card ? !card.querySelector('[data-go="bag"]') : false;
    // (nothing to read: each thing is a drawing and a number; the words inside a drawing, like the coin's "$", are part
    // of the picture, so the text is read with the drawings taken out)
    const words = b => { const c = b.cloneNode(true); c.querySelectorAll('svg, .arti, .flagi').forEach(e => e.remove()); return c.textContent.replace(/\s/g, ''); };
    out.pics = card ? [...card.querySelectorAll('.kitem')].every(b => b.querySelector('svg') && /^\d*$/.test(words(b))) : false;
    out.small = card ? [...card.querySelectorAll('.ktab, .kitem, .x')].filter(b => { const q = b.getBoundingClientRect(); return q.width < 44 || q.height < 44; }).length : -1;
    // buy the tiara (hats tab), and it is worn
    // (Round U: a child's own set shows first; another set's thing is behind More)
    const item = async id => { let e = card.querySelector(`[data-id="${id}"]`); if (!e && card.querySelector('.kmore')) { card.querySelector('.kmore').click(); await w(150); e = card.querySelector(`[data-id="${id}"]`); } return e; };
    card.querySelector('[data-tab="hat"]').click(); await w(150); (await item('tiara')).click(); await w(150);
    const price = SH.priceOf(SH.ITEM.tiara), c0 = S.farm.coins; card.querySelector('.kyes').click(); await w(300);
    out.bought = SH.owns(p, 'tiara') && p.look.hat === 'tiara' && S.farm.coins === c0 - price;
    // not enough coins: nothing is bought
    G.addCoins(-S.farm.coins); card.querySelector('[data-tab="back"]').click(); await w(150); (await item('dragon')).click(); await w(150); card.querySelector('.kyes').click(); await w(300);
    out.poorKept = !SH.owns(p, 'dragon') && S.farm.coins === 0;
    card.querySelector('.x').click(); await w(400); out.closed = !document.querySelector('.modal.shopk') && !G.paused;
    // under-5s: every button at least 64 px
    p.age = 'little'; G.shop.openShop(0); await w(400);
    out.little = [...document.querySelectorAll('.modal.shopk.little .ktab, .modal.shopk.little .kitem')].filter(b => { const q = b.getBoundingClientRect(); return q.width < 64 || q.height < 64; }).length;
    document.querySelector('.modal.shopk .x').click(); await w(400);
    // the wardrobe: what is owned, worn with a tap; no shop button on a row; the Done button covers no chip; no chip cut off or overlapping
    G.openWardrobe(0); await w(400); const wd = document.querySelector('.wardrobe.kward');
    out.noRowShop = !wd.querySelector('.toshop, [data-shop]');
    { const dn = wd.querySelector('.x').getBoundingClientRect(), chips = [...wd.querySelectorAll('.chip')].map(c => c.getBoundingClientRect()), box = wd.getBoundingClientRect();
      const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      out.wardClear = chips.every(c => !hit(c, dn)) && chips.every((c, k) => chips.every((d, j) => j <= k || !hit(c, d))) && wd.scrollWidth <= wd.clientWidth + 1;
      out.wardRowsFit = [...wd.querySelectorAll('.wrow')].every(r => { const q = r.getBoundingClientRect(); return [...r.querySelectorAll('.chip')].every(c => { const z = c.getBoundingClientRect(); return z.top >= q.top - 1 && z.bottom <= q.bottom + 1; }); }); void box; }
    out.wardrobe = !!wd && wd.querySelectorAll('.wrow').length === 6 && !!wd.querySelector('[data-v="tiara"]') && !wd.querySelector('[data-v="dragon"]');
    wd.querySelector('[data-k="hat"][data-v="none"]').click(); await w(200); out.off = p.look.hat === 'none';
    document.querySelector('.wardrobe.kward .x').click(); await w(300);
    // a child who already wore wings and a crown keeps them
    const old = { look: { back: 'wings', hat: 'crown' }, owned: { hats: ['none'] } }; SH.adoptWorn(old); out.kept = SH.owns(old, 'wings') && SH.owns(old, 'crown');
    // the 3D character: every new piece, a few extra parts only (each new piece is one merged shape)
    const meshes = A => { let n = 0; A.root.traverse(o => { if (o.isMesh && !o.userData.outline) n++; }); return n; };
    const base = { style: 'shirt', color: '#3b6fe0', hat: 'none', back: 'none', hair: '#1d1412', hairStyle: 'short', skin: '#f6c7a5' }, n0 = meshes(buildAvatar(base));
    // (r67, owner's yes: the battery round merges the parts that move together into one shape, so a neck or back piece
    // adds triangles to the body's shape, not a separate part: "drawn" is counted in triangles, the "few extra parts" in parts)
    const tris = A => { let n = 0; A.root.traverse(o => { if (o.isMesh && !o.userData.outline && o.visible) { const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return n; };
    const A0 = buildAvatar(base), t0 = tris(A0);
    out.drawn = {}; out.tri = {}; for (const it of SH.CLOTHES) { const L = Object.assign({}, base, { [it.slot]: it.id }), A = buildAvatar(L); out.drawn[it.id] = meshes(A) - n0; out.tri[it.id] = tris(A) - t0; }
    out.allDrawn = Object.entries(out.drawn).filter(([id, d]) => Math.abs(d) > 12 || (SH.ITEM[id].slot === 'neck' || SH.ITEM[id].slot === 'back') && out.tri[id] < 1).map(([id, d]) => id + ':' + d + ' parts, ' + out.tri[id] + ' triangles'); // (a top can drop the old sleeves and shorts)
    // the switch off: the Bag opens the backpack, the stall goes, the old wardrobe is back
    C.features = C.features || {}; C.features.shop = false; await w(300);
    G.huds[0].root.querySelector('.dk.bag').click(); await w(500); out.offBag = !!document.querySelector('.modal.pad') && !document.querySelector('.modal.shopk');
    out.offStall = !G.shop.stall.visible; document.querySelector('.modal.pad .x')?.click(); await w(400);
    G.openWardrobe(0); await w(300); out.offWard = !!document.querySelector('.wardrobe') && !document.querySelector('.wardrobe.kward'); document.querySelector('.wardrobe .x')?.click(); await w(300);
    delete C.features.shop;
    return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (!r.offRoad || !r.nearMarket || !r.dry || !r.tap) bad.push('the shop is not by the market on dry ground off the road ' + JSON.stringify(r.spot));
  if (!r.bagOpens || !r.bagShopBtn) bad.push('the Bag button does not open the backpack, or no shop button beside it in the dock ' + JSON.stringify({ o: r.bagOpens, b: r.bagShopBtn }));
  if (!r.there || !r.opened) bad.push('the shop button in the bag did not open the shop right there (no travel)');
  if (r.tabs !== 7 || !r.noBagTab || !r.pics || r.small) bad.push(`the shop card: ${r.tabs} tabs, pictures ${r.pics}, ${r.small} buttons under 44 px`);
  if (!r.bought || !r.poorKept || !r.closed) bad.push('buying ' + JSON.stringify({ bought: r.bought, poor: r.poorKept, closed: r.closed }));
  if (r.little) bad.push(`${r.little} buttons under 64 px for an under-5`);
  if (!r.wardrobe || !r.off) bad.push('the wardrobe does not show what is owned');
  if (!r.noRowShop || !r.wardClear || !r.wardRowsFit) bad.push('the wardrobe: shop button on a row, or items overlap, are cut off or sit under the Done button ' + JSON.stringify({ s: r.noRowShop, c: r.wardClear, f: r.wardRowsFit }));
  if (!r.kept) bad.push('what a child already wore is not owned');
  if (r.allDrawn.length) bad.push('3D pieces: ' + r.allDrawn.join(' '));
  if (!r.offBag || !r.offStall || !r.offWard) bad.push('the Studio switch did not put the old Bag and wardrobe back ' + JSON.stringify(r));
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return `the shop at ${r.spot} by the market, off the road; the Bag opens the backpack and the Shop button beside it in the dock opens the shop without travel; 7 picture tabs, coin prices, 64 px for under-5s; bought the tiara, could not buy without coins; the wardrobe; worn things kept; every piece drawn in 3D (at most ${Math.max(...Object.values(r.drawn))} extra parts); the switch puts the old Bag back`;
});
await check('boxes', async () => {
  // (round S, owner plan 8 Oct: Round R Part 2 item 10) a big kid at Medium or Hard: one free mystery box a day, one more
  // for a finished quest (at most one a day), a second one becomes stars; family rankings on four boards; the collection
  // book; little ones and Easy get none, and each Studio switch turns its part off
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, w = t => new Promise(r => setTimeout(r, t)), S = await import('/js/state.js');
    const C = (await import('/js/custom.js')).CUSTOM, X = await import('/js/content/boxes.js');
    const out = {}, chip = () => G.huds[0].root.querySelector('.bxrow .c-box');
    p.age = 'big'; p.difficulty = 'medium'; delete p.boxes; delete p.collect; await w(1000);
    out.chip = !!chip() && !chip().parentNode.hidden && chip().classList.contains('ready');
    // the hub, then today's free box
    chip().click(); await w(400); out.hub = document.querySelectorAll('.modal.bxhub .khb').length;
    document.querySelector('.modal.bxhub [data-go="box"]').click(); await w(600);
    document.querySelector('.modal.bxopen .kbox').click(); await w(500);
    out.prize = !!document.querySelector('.modal.bxopen .kprize'); out.got = Object.keys(p.collect).length; out.left = X.ready(p.boxes, X.aestDay());
    document.querySelector('.modal.bxopen .x').click(); await w(400);
    G.boxes.openBoxCard(0); await w(400); out.empty = !!document.querySelector('.modal.bxopen .kempty'); document.querySelector('.modal.bxopen .x').click(); await w(400);
    // a finished quest: one box, only one a day
    p.boxes.last = undefined; G.boxes.questDone(h, 0); G.boxes.questDone(h, 1); out.earned = p.boxes.waiting; G.boxes.questDone(h, 2); out.once = p.boxes.waiting;
    // a second one becomes stars
    const first = Object.keys(p.collect)[0], it = X.CBY[first], R = X.COLLECTIBLES, tot = R.reduce((a, c) => a + X.RARITY[c.rare].weight, 0);
    let acc = 0, rand = 0; for (const c of R) { if (c.id === first) { rand = (acc + .5) / tot; break; } acc += X.RARITY[c.rare].weight; }
    const s0 = p.boxes.stars, dup = X.openBox(p, X.aestDay(), rand); out.dup = !!dup && dup.dup && p.boxes.stars === s0 + X.RARITY[it.rare].stars;
    // rankings: every child on this device, four boards
    G.boxes.openRanks(0); await w(400); out.ranks = document.querySelectorAll('.modal.bxrank .kranks li').length === S.profiles.length; out.boards = document.querySelectorAll('.modal.bxrank .ktab').length;
    document.querySelector('.modal.bxrank [data-b="learn"]').click(); await w(200); out.board2 = !!document.querySelector('.modal.bxrank .ktab.on[data-b="learn"]'); document.querySelector('.modal.bxrank .x').click(); await w(400);
    // the book: what was found, and shadows for the rest
    G.boxes.openBook(0, it.kind); await w(400); out.book = !!document.querySelector(`.modal.bxbook [data-c="${first}"].got`) && !!document.querySelector('.modal.bxbook .kcol.miss');
    out.bookSmall = [...document.querySelectorAll('.modal.bxbook .kcol, .modal.bxbook .ktab')].filter(b => b.getBoundingClientRect().height < 44).length; document.querySelector('.modal.bxbook .x').click(); await w(400);
    // Easy, or an under-5: none of it
    p.difficulty = 'easy'; await w(900); out.easyHidden = chip().parentNode.hidden && !G.boxes.can(h); p.difficulty = 'hard';
    p.age = 'little'; await w(900); out.littleHidden = chip().parentNode.hidden; p.age = 'big'; await w(900);
    // the switches
    C.features = C.features || {}; for (const id of ['mysteryBox', 'rankings', 'collectibles']) C.features[id] = false; await w(900);
    out.offHidden = chip().parentNode.hidden; G.boxes.openHub(0); await w(300); out.offHub = !document.querySelector('.modal.bxhub');
    for (const id of ['mysteryBox', 'rankings', 'collectibles']) delete C.features[id];
    return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (!r.chip || r.hub !== 3) bad.push(`the gift chip (${r.chip}) or the three picture buttons (${r.hub})`);
  if (!r.prize || r.got !== 1 || r.left !== 0 || !r.empty) bad.push('the free box ' + JSON.stringify(r));
  if (r.earned !== 1 || r.once !== 1) bad.push(`quest boxes: ${r.earned} then ${r.once} (one a day)`);
  if (!r.dup) bad.push('a second one did not become stars');
  if (!r.ranks || r.boards !== 4 || !r.board2) bad.push('the family rankings');
  if (!r.book || r.bookSmall) bad.push('the collection book');
  if (!r.easyHidden || !r.littleHidden) bad.push('Easy or an under-5 still sees the boxes');
  if (!r.offHidden || !r.offHub) bad.push('the Studio switches did not turn it off');
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return 'a big kid at Medium: the free box opened (then none left today), one quest box a day, a second one became stars, the family on 4 boards, the book with shadows; Easy, under-5s and the switches hide it';
});
// (round S, owner plan 8 Oct) Hội làng: every host game free (no 3-coin skip), three events a day on the AEST clock
// (17:30 for under-5s), the parade and the crowd at the nearest village, late arrivals told, the prize like the kite
await check('hoilang', async () => {
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, w = t => new Promise(r => setTimeout(r, t)), C = (await import('/js/custom.js')).CUSTOM, S = await import('/js/state.js');
    delete C.features.hoilang; const realNow = Date.now, at = s => { const ms = Date.parse(s + ':00+10:00'); Date.now = () => ms; };
    const out = {}, txt = () => [...document.querySelectorAll('.dialog')].map(d => d.textContent).join(' ');
    // the games board: free, no price, a game opens and no coins go
    const board = G.interactables.find(i => /^fs\d+$/.test(i.id)), c0 = S.farm.coins;
    board.act(h); await w(500); out.boardChoices = [...document.querySelectorAll('.dialog .dch')].map(b => b.textContent).join('|');
    document.querySelector('.dialog .dch').click(); await w(900); out.boardGame = !!document.querySelector('.gl'); out.boardCoins = S.farm.coins - c0;
    document.querySelector('.gl .gl-x')?.click(); await w(700); document.querySelectorAll('.dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
    // 09:02 AEST at the first village: the festival is on there
    const F = G.hoilang.fests[0]; out.fests = G.hoilang.fests.length;
    h.pos.set(F.x + 3, h.pos.y, F.z + 3); h.pos.y = (await import('/js/world.js')).heightAt(h.pos.x, h.pos.z) + .1;
    // (walking into Lotus Village opens the main story's chapter page, and the world rests while a storybook is open:
    // close what the world opened by itself, like the harness's clear(), then let the festival clock tick)
    // (the HUD has one toast line and the newest message takes it, e.g. the daily gift hint: keep every toast shown)
    const toasts = [], tEl = document.querySelector('.hud .htoast'), mo = new MutationObserver(() => toasts.push(tEl.textContent)); mo.observe(tEl, { childList: true, characterData: true, subtree: true });
    at('2026-10-10T09:02'); await w(800);
    // (the world rests while a pop-up is open, e.g. the passport stamp shown on arriving, so the festival clock does not
    // tick: keep closing what opens by itself until the child has been told, for up to 8 s)
    for (let k = 0; k < 16 && !toasts.some(x => /festival|Hội làng/.test(x)); k++) { document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; await w(500); }
    await w(1000);
    out.on = G.hoilang.clock().on; out.active = G.hoilang.active() === F;
    out.walkers = (G.hoilang.walkers() || []).filter(A => A.root.visible).length; out.crowd = (G.hoilang.crowd() || []).filter(A => A.root.visible).length;
    mo.disconnect(); out.toast = toasts.find(x => /festival|Hội làng/.test(x)) || toasts.join(' | ');
    // an under-5 joins: playing the festival game (even left early) gives the first prize, once
    p.age = 'little'; p.hoilang = {}; G.hoilang.openFest(h, F); await w(500); document.querySelector('.dialog .dch').click(); await w(1200);
    out.joinGame = !!document.querySelector('.gl'); document.querySelector('.gl .gl-x')?.click(); await w(4500);
    out.prizes = (p.hoilang.prizes || []).join(','); out.keepsake = (p.keepsakes || []).includes('hl_drum'); out.carry = p.hoilang.carry;
    document.querySelectorAll('.dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
    G.hoilang.openFest(h, F); await w(500); out.already = /prize from this festival|quà của hội này/.test(txt()); document.querySelectorAll('.dialog').forEach(e => e.remove());
    // a big kid who leaves without winning gets nothing (16:02)
    p.age = 'big'; at('2026-10-10T16:02'); G.hoilang.openFest(h, F); await w(500); document.querySelector('.dialog .dch')?.click(); await w(1200); document.querySelector('.gl .gl-x')?.click(); await w(4500);
    out.bigPrizes = (p.hoilang.prizes || []).length; document.querySelectorAll('.dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
    // the evening one: 17:30 for under-5s, 19:00 for big kids
    at('2026-10-10T17:40'); out.bigAt1740 = G.hoilang.clock().on; p.age = 'little'; out.littleAt1740 = G.hoilang.clock().on;
    // too late: told when the next one is
    at('2026-10-10T09:20'); G.hoilang.openFest(h, F); await w(500); out.next = /16:00/.test(txt()); document.querySelectorAll('.dialog').forEach(e => e.remove()); G.paused = false;
    // the Backpack: carry the prize or put it away, like the kite
    G.openPad(0, 'bag'); await w(600); const slot = document.querySelector('.pad [data-hlcarry]'); out.bag = !!slot; slot?.click(); await w(300); out.putAway = p.hoilang.carryOn === false;
    document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
    // the Studio switch
    at('2026-10-10T09:02'); C.features.hoilang = false; await w(1500);
    out.offPole = !G.interactables.find(i => i.id === 'hoilang' + F.k).visible(); out.offParade = !(G.hoilang.walkers() || []).some(A => A.root.visible);
    Date.now = realNow; return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (/\$|coin/i.test(r.boardChoices) || !r.boardGame || r.boardCoins !== 0) bad.push('the games board is not free: ' + JSON.stringify([r.boardChoices, r.boardGame, r.boardCoins]));
  if (!r.on || !r.active || r.walkers !== 4 || r.crowd !== 5) bad.push('no parade and crowd at 09:02 ' + JSON.stringify(r));
  if (!/festival|Hội làng/.test(r.toast)) bad.push('the child was not told the festival is on: ' + r.toast);
  if (!r.joinGame || r.prizes !== 'drum' || !r.keepsake || r.carry !== 'drum') bad.push('joining did not give the prize ' + JSON.stringify(r));
  if (!r.already) bad.push('a second prize at the same festival');
  if (r.bigPrizes !== 1) bad.push('a big kid got a prize without winning');
  if (r.bigAt1740 || !r.littleAt1740) bad.push('the evening festival is not 17:30 for under-5s and 19:00 for big kids');
  if (!r.next) bad.push('a late child was not told the next time');
  if (!r.bag || !r.putAway) bad.push('the prize is not in the Backpack to carry or put away');
  if (!r.offPole || !r.offParade) bad.push('the Studio switch does not turn it off');
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return `${r.fests} villages; games board free; 09:00 parade (4) and crowd (5); under-5 prize for joining, once; big kid needs a win; 17:30/19:00; next time told; carried like the kite; switch off`;
});
// (round S) surprises: at most 3 a session, only when free, never missed (they follow the child), each gives a sticker
// or a keepsake, calm mode keeps them still
await check('surprises', async () => {
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, w = t => new Promise(r => setTimeout(r, t)), C = (await import('/js/custom.js')).CUSTOM, S = await import('/js/state.js'), Sp = G.surprises;
    const { SURPRISES } = await import('/js/content/surprises.js'), { heightAt } = await import('/js/world.js');
    delete C.features.surprises; const out = { bad: [] }, near = c => Math.hypot(c.x - h.pos.x, c.z - h.pos.z);
    const tidy = () => { document.querySelectorAll('.dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; };
    // not while a window is open
    Sp.reset(); Sp.setPlay(1000); const m = document.createElement('div'); m.className = 'modal'; document.body.appendChild(m); await w(2500); out.whileBusy = !!Sp.current(); m.remove();
    // the limit: found as soon as each comes, at most 3
    // (the fairy glade starts with its first glowing stone in front of the child; the path leads ~14 m on to the ring)
    const start = c => c.id === 'glade' && c.parts[0] ? { x: c.parts[0].position.x, z: c.parts[0].position.z } : c;
    let n = 0; for (let k = 0; k < 6; k++) { Sp.setPlay(1000 + k * 400); await w(1600); const c = Sp.current(); if (c) { n++; if (near(start(c)) > 16 && c.id !== 'lotus') out.bad.push(c.id + ' far ' + near(start(c)).toFixed(0)); await Sp.found(h); tidy(); } }
    out.count = n; out.shown = Sp.state().shown;
    // every kind: placed, then found for its sticker or keepsake
    for (const s of SURPRISES) {
      Sp.reset(); const st0 = p.stickers.length, k0 = (p.keepsakes || []).length; if (s.id === 'chest') { p.surprises = { ...(p.surprises || {}), map: 3 }; }
      const c = Sp.place(s.id, h); if (!c) { out.bad.push('could not place ' + s.id); continue; }
      if (s.id === 'butterfly') { for (let k = 0; k < 3; k++) { h.pos.x = c.x; h.pos.z = c.z; h.pos.y = heightAt(c.x, c.z) + .1; await w(4500); } out.landed = c.hop >= 3 && c.it.visible(h); }
      if (!c.it.visible(h)) { out.bad.push(s.id + ' not tappable'); continue; }
      c.it.act(h); await w(400); tidy();
      const gave = p.stickers.length > st0 || (p.keepsakes || []).length > k0 || s.id === 'map' || p.stickers.length === G.STICKERS.length;
      if (!gave) out.bad.push(s.id + ' gave nothing'); if (Sp.current()) out.bad.push(s.id + ' still out after found');
    }
    out.mapPieces = p.surprises.map;
    // never missed: walk far away and it comes back near the child
    Sp.reset(); const c = Sp.place('butterfly', h); h.pos.x += 60; h.pos.y = heightAt(h.pos.x, h.pos.z) + .1; await w(5000); const c2 = Sp.current(); out.followed = !!c2 && near(c2) < 16;
    // calm: one slow shooting star
    S.settings.calm = true; Sp.reset(); const cs = Sp.place('stars', h); out.calmStreaks = cs ? cs.streaks.length : -1; S.settings.calm = false;
    // the Studio switch
    C.features.surprises = false; await w(1500); out.off = !Sp.current();
    return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [...r.bad];
  if (r.whileBusy) bad.push('a surprise came while a window was open');
  if (r.count !== 3 || r.shown !== 3) bad.push(`not 3 a session: ${r.count}/${r.shown}`);
  if (!r.landed) bad.push('the golden butterfly did not fly on three times and land');
  if (!r.followed) bad.push('a surprise left behind did not come back to the child');
  if (r.calmStreaks !== 1) bad.push('calm mode: ' + r.calmStreaks + ' shooting stars');
  if (!r.off) bad.push('the Studio switch does not take it away');
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return `3 a session, none while busy; all ${10} kinds give a sticker or keepsake (map piece ${r.mapPieces}/3, chest); the butterfly lands after 3 hops; follows the child; calm: one star; switch off`;
});
// (round S) for grown-ups: a family mission written in Grown-ups, shown to the child, ticked with a press-and-hold;
// the weekly note; the certificate card saved as a picture (no print); the dance break and its Skip; bedtime (dim,
// lullaby, goodnight, hold for 10 more minutes); the birthday surprise; the switches
await check('parents', async () => {
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, w = t => new Promise(r => setTimeout(r, t)), C = (await import('/js/custom.js')).CUSTOM, S = await import('/js/state.js');
    const out = {}, tidy = () => { document.querySelectorAll('.dialog, .modal, .reward, .songs').forEach(e => e.remove()); document.body.classList.remove('songs-on'); G.paused = false; };
    const hold = async b => { const r = b.getBoundingClientRect(), o = { bubbles: true, clientX: r.x + 5, clientY: r.y + 5, pointerId: 3 }; b.dispatchEvent(new PointerEvent('pointerdown', o)); await w(2000); b.dispatchEvent(new PointerEvent('pointerup', o)); };
    // (Round U: this checks the family's own written missions, so the 15 ready-made ones are switched off and the family-play
    // guide counts as seen; check familymissions covers those)
    S.settings.readyMissions = Object.fromEntries((await import('/js/content/familymissions.js')).FAMILY_MISSIONS.map(m => [m.id, false])); p.familyGuideSeen = true;
    S.settings.missions = []; S.settings.bedtime = ''; p.stats.days = { [new Date().toISOString().slice(0, 10)]: { min: 30, games: 4 } };
    // Grown-ups: write a mission; the weekly note and the cards are there
    const { openGrownups } = await import('/js/ui.js'); openGrownups(); await w(500);
    const g = document.querySelector('.modal.grownups'); g.querySelector('details[data-sec=family]').open = true;
    g.querySelector('#fmEn').value = 'Help set the table'; g.querySelector('#fmVi').value = 'Giúp dọn bàn ăn'; g.querySelector('#fmAdd').click(); await w(400);
    const g2 = document.querySelector('.modal.grownups'); out.listed = /Help set the table/.test(g2.textContent); out.note = !!g2.querySelector('.wknote p'); out.certBtn = !!g2.querySelector('[data-cert]');
    tidy(); await w(6000);
    // the child is told (a speech box with the family's words)
    out.told = [...document.querySelectorAll('.dialog')].some(d => /Help set the table/.test(d.textContent)); tidy();
    // Adventures: a grown-up holds ✓
    const c0 = S.farm.coins; G.openPad(0, 'log'); await w(600); const t = document.querySelector('.pad .missions [data-mtick]'); out.mtick = t ? Math.round(t.getBoundingClientRect().width) : 0;
    if (t) await hold(t); await w(500); out.coins = S.farm.coins - c0; out.open = G.parents.openFor(p).length; tidy();
    // the certificate card: a picture, saved without a print window
    let printed = false; const pr = window.print; window.print = () => { printed = true; };
    const url = await G.parents.certificate(p); out.cert = url.startsWith('data:image/png') && url.length > 20000;
    await G.parents.openCertificate(p); out.saveBtn = !!document.querySelector('.certcard [data-save]'); out.printed = printed; window.print = pr; tidy();
    // the dance break after 20 minutes of play, with a big Skip
    delete C.features.danceBreak; G.parents.setPlayMin(21); await w(6500);
    const sk = document.querySelector('.dancebreak .db-skip'); out.dance = !!sk; out.skipH = sk ? Math.round(sk.getBoundingClientRect().height) : 0; sk?.click(); await w(300);
    out.danceGone = !document.querySelector('.dancebreak') && !G.paused;
    // bedtime 19:30 AEST: at 19:31 the valley dims and a lullaby plays; at 19:40 goodnight; hold for 10 more minutes
    const realNow = Date.now, at = s => { const ms = Date.parse(s + ':00+10:00'); Date.now = () => ms; };
    S.settings.bedtime = '19:30'; at('2026-10-10T19:31'); await w(9000); out.dim = !!document.querySelector('.bedtime-dim'); out.lullaby = !!document.querySelector('.songs');
    at('2026-10-10T19:40'); await w(6000); const gn = document.querySelector('.resttime.bedtime'); out.goodnight = !!gn;
    if (gn) await hold(gn.querySelector('.grownup')); await w(300); out.snoozed = !document.querySelector('.resttime.bedtime') && S.settings.bedSnooze - Date.now() === 10 * 60e3; // (10 Oct) against the pretend clock: the real one made this pass only before 19:50 AEST on 10 Oct 2026
    S.settings.bedtime = ''; S.settings.bedSnooze = 0; tidy(); document.querySelector('.bedtime-dim')?.remove();
    // the birthday: on the day (AEST), a surprise and a keepsake, once
    // (the reward pop-up closes itself after 2.6 s: watch for it during the wait rather than look once at the end)
    at('2026-10-10T10:00'); p.birthday = '10-10'; delete p.bdayDone; let pop = false; for (let k = 0; k < 26 && !pop; k++) { await w(250); pop = !!document.querySelector('.reward'); }
    await w(300); out.bday = pop && (p.keepsakes || []).includes('bd_cake'); tidy();
    Date.now = realNow;
    // the switches
    C.features.familyMissions = false; out.offMissions = G.parents.logHTML(p) === '' && !G.parents.openFor(p).length;
    for (const id of ['familyMissions', 'weeklyNote', 'certCard', 'danceBreak', 'bedtime', 'birthday']) C.features[id] = false;
    out.offGrownups = G.parents.grownupsHTML(true) === '';
    return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (!r.listed || !r.note || !r.certBtn) bad.push('Grown-ups: mission, weekly note or card missing ' + JSON.stringify(r));
  if (!r.told) bad.push('the child was not shown the new mission');
  if (r.mtick < 64 || r.coins !== 10 || r.open !== 0) bad.push('holding ✓ did not finish the mission ' + JSON.stringify([r.mtick, r.coins, r.open]));
  if (!r.cert || !r.saveBtn || r.printed) bad.push('the certificate card ' + JSON.stringify([r.cert, r.saveBtn, r.printed]));
  if (!r.dance || r.skipH < 64 || !r.danceGone) bad.push('the dance break ' + JSON.stringify([r.dance, r.skipH, r.danceGone]));
  if (!r.dim || !r.lullaby || !r.goodnight || !r.snoozed) bad.push('bedtime ' + JSON.stringify([r.dim, r.lullaby, r.goodnight, r.snoozed]));
  if (!r.bday) bad.push('no birthday surprise');
  if (!r.offMissions || !r.offGrownups) bad.push('the Studio switches do not turn them off');
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return 'mission written, shown, ticked with a hold (+10); weekly note; certificate picture saved (no print); dance break with a 64 px Skip; bedtime dims, lullaby, goodnight, hold for 10 more; birthday surprise; switches off';
});
// (round S, owner 9 Oct) the money follows the language (Vietnamese: đồng, English: dollars) until a grown-up picks one
await check('currency', async () => {
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const S = await import('/js/state.js'), M = await import('/js/money.js'), st = S.settings, out = {};
    st.curPinned = false; st.lang = 'en'; out.en = M.curCode() + ' ' + M.fmtMinor(250);
    st.lang = 'vi'; out.vi = M.curCode() + ' ' + M.fmtMinor(20000);
    st.currency = 'AUD'; st.curPinned = true; out.pinned = M.curCode();
    st.curPinned = false; st.lang = 'en';
    return out;
  });
  const errs = P.errors; await P.ctx.close(); const bad = [];
  if (r.en !== 'AUD $2.50') bad.push('English: ' + r.en);
  if (r.vi !== 'VND 20.000đ') bad.push('Vietnamese: ' + r.vi);
  if (r.pinned !== 'AUD') bad.push('a grown-up\'s pick did not stick: ' + r.pinned);
  if (errs.length) bad.push(...errs.slice(0, 2));
  if (bad.length) throw new Error(bad.join('; '));
  return `English ${r.en}, Vietnamese ${r.vi}, a grown-up's AUD stays ${r.pinned} in Vietnamese`;
});
await check('camcalm', async () => {
  // (round R, owner: "the camera angles give a headache when it moves") walking, turning round suddenly and jumping:
  // the camera never swings faster than a slow steady pace, and a jump doesn't jerk the picture up and down
  const P = await open(b, { w: 1180, h: 760 }); await clear(P.page);
  const r = await P.page.evaluate(() => {
    const h = __sv.heroes[0], dt = 1 / 60; let t = 0, maxTurn = 0, maxLookY = 0, at = -1;
    h.place(h.pos.x, h.pos.z); h.manualCamT = 0;
    const lookDir = () => { const d = new h.cam.position.constructor(); h.cam.getWorldDirection(d); return d; };
    let prev = null;
    for (let f = 0; f < 600; f++) {
      t += dt; h.speed = 5; h.state = 'walk'; h.yaw = f < 200 ? 0 : f < 400 ? Math.PI : Math.PI / 2;   // sudden turn-rounds
      h.onGround = !(f % 120 > 100); const jumpY = h.onGround ? 0 : .8; const y0 = h.pos.y; h.pos.y = y0 + jumpY;
      h.finish(dt, t, __sv, 0); h.pos.y = y0;
      const d = lookDir(); if (prev && f > 60) { const w = prev.angleTo(d) / dt; if (w > maxTurn) { maxTurn = w; at = f; } maxLookY = Math.max(maxLookY, Math.abs(d.y - prev.y) / dt); } prev = d;
    }
    return { maxTurn, maxLookY, at };
  });
  ok(r.maxTurn < 1.0, `the view turns too fast: ${r.maxTurn.toFixed(2)} rad/s (frame ${r.at})`);
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `the view turns at most ${r.maxTurn.toFixed(2)} rad/s when the child turns round, and tips at most ${r.maxLookY.toFixed(2)}/s on a jump`;
});

await check('vehicles', async () => {
  // (round R, owner: real xe 67, Cub, Dream, xích lô, Australian motorbikes, bicycles of every kind, cars, buses, trams;
  // riders' hands on the grips and feet on the pegs; children can ride bicycles; all switchable in Studio)
  const P = await open(b, { w: 1180, h: 760 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const T = __sv.traffic, ids = new Set(T.slots.map(s => s.id)), V = await import('/js/vehicles.js');
    // the vehicles are made when a child comes near: go near a moving one and give them a moment
    const m = T.slots.find(s => s.mover && s.id !== 'xichlo' && s.id !== 'tramModern'), [mx, mz] = T.where(m), h = __sv.heroes[0]; h.place(mx + 20, mz + 20);
    T.slots.forEach(sl => { if (!sl.v) T.make(sl); });
    // every rider holds the grips: each hand within 12 cm of its grip
    const far = [];
    for (const sl of T.slots) if (sl.rider && sl.v.grips) { sl.v.o.updateMatrixWorld(true); const A = sl.rider;
      for (const [arm, g] of [[A.armL, sl.v.grips[0]], [A.armR, sl.v.grips[1]]]) { const hand = arm.children.find(c => Math.abs(c.position.y + .42) < .01); const hp = hand.getWorldPosition(new (hand.position.constructor)()), gp = sl.v.o.localToWorld(new (hand.position.constructor)(...g)); const d = hp.distanceTo(gp); if (d > .12) far.push(sl.id + ' ' + d.toFixed(2)); } }
    // a moving one moves
    const p0 = m.v.o.position.clone();
    await new Promise(r => setTimeout(r, 1500)); const moved = m.v.o.position.distanceTo(p0);
    // a child rides a bicycle and gets off again
    const it = __sv.interactables.find(i => i.id.startsWith('bike_')); h.place(it.x + 1, it.z + 1); await new Promise(r => setTimeout(r, 400)); it.act(h, __sv);
    const riding = !!(h.riding && h.riding.vehicle); h.dismount();
    return { n: T.slots.length, ids: [...ids], all: Object.keys(V.VEHICLES).length, far, moved, riding, off: !h.riding };
  });
  for (const id of ['honda67', 'cub', 'dream', 'scooter', 'xichlo', 'postie', 'tramModern', 'touristCart', 'miniBike', 'roadster', 'sedan']) ok(r.ids.includes(id), 'missing in the valley: ' + id);
  ok(!r.far.length, 'hands off the grips: ' + r.far.slice(0, 6).join(', '));
  ok(r.moved > .5, 'traffic did not move (' + r.moved + ')'); ok(r.riding && r.off, 'could not ride a bicycle and get off');
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `${r.all} models; ${r.n} vehicles in the valley; riders' hands on the grips; traffic moves; a child rides a bicycle and gets off`;
});

await check('dialogtap', async () => {
  // (round R, owner: "there shouldn't be any repeats, the child just taps the speech box as OK") a speech box has no
  // Hear-again or OK buttons for any age; a tap on the box goes on, and the last tap closes it
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const r = [];
  for (const age of ['little', 'big']) {
    await P.page.evaluate(age => { __sv.heroes.forEach(h => { h.profile.age = age; }); __sv.dialog('Bà Năm', [['Hello!', 'Chào con!'], ['Shall we play?', 'Chơi nhé?']]); }, age);
    await P.page.waitForSelector('.dialog:not(.out)');
    const btns = await P.page.evaluate(() => [...document.querySelectorAll('.dialog:not(.out) button')].filter(e => !e.matches('.dask, .dch')).map(e => e.className));
    ok(!btns.length, `${age}: extra buttons ${btns.join(', ')}`);
    await P.page.click('.dialog:not(.out) .dtext'); await P.page.waitForTimeout(150);
    ok(await P.page.evaluate(() => document.querySelector('.dialog:not(.out) .dtext').textContent.includes('play')), `${age}: a tap did not go on`);
    await P.page.click('.dialog:not(.out) .dtext'); await P.page.waitForTimeout(400);
    ok(await P.page.evaluate(() => !document.querySelector('.dialog:not(.out)')), `${age}: the last tap did not close it`);
    r.push(age);
  }
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return 'no repeat or OK buttons for under-5s or older children; tapping the box goes on and closes it';
});

await check('viwords', async () => {
  // (round R, owner: "bánh khọt" and "nước mía" said by the English voice can't be understood) Vietnamese names and dishes
  // inside English lines are cut out and said by the Vietnamese voice: by the recorded pack, the phone voice and online voices
  const { viRuns } = await import('../js/viwords.js'), show = t => viRuns(t).map(([l, x]) => l === 'vi' ? '[' + x + ']' : x).join('');
  const cases = [['Buy some bánh khọt?', 'Buy some [bánh khọt]?'], ['Welcome to Hội An and Bắc Ninh!', 'Welcome to [Hội An] and [Bắc Ninh]!'],
    ['I am Bác 2. Every afternoon Bác 3, Bác 4 and I play cards.', 'I am [Bác 2]. Every afternoon [Bác 3], [Bác 4] and I play cards.'],
    ['We went to Nha Trang and Vũng Tàu.', 'We went to [Nha Trang] and [Vũng Tàu].'], ['Phố Hai Quê is home.', '[Phố Hai Quê] is home.'],
    ['Long ago, a kind girl called An Tiêm was sent', 'Long ago, a kind girl called [An Tiêm] was sent'], ['Xiè xie means thank you!', 'Xiè xie means thank you!'], ['Let us play a game!', 'Let us play a game!']];
  for (const [t, want] of cases) ok(show(t) === want, `cut: ${show(t)} (wanted ${want})`);
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const line = "I am Miss Tam. I teach at the secondary school, trường cấp 2. After school I help at my family's sugarcane juice cart, nước mía, on Two Homes Street, just like in Bà Rịa."; // Cô Tam's line as English says it
  const r = await P.page.evaluate(async line => {
    // a phone with an English and a Vietnamese voice: record what each utterance says, and in which language
    const said = [], fake = [{ name: 'Karen', lang: 'en-AU', localService: true }, { name: 'Linh', lang: 'vi-VN', localService: true }];
    window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
    speechSynthesis.getVoices = () => fake; speechSynthesis.speak = u => { said.push([u.lang, u.text]); setTimeout(() => u.onend && u.onend(), 5); };
    speechSynthesis.dispatchEvent(new Event('voiceschanged'));
    const V = await import('/js/voice.js'), H = await import('/js/packhash.js');
    await V.sayDevice('en', 'Buy some bánh khọt from Vũng Tàu, please!');
    const pack = V.voicePack(), h = H.lineHash('en', line);
    return { said, rec: pack && pack.lines[h], old: pack && pack.lines[H.packHash('en', line)], url: V.packUrl('en', line, 'f'), h };
  }, line);
  ok(JSON.stringify(r.said) === JSON.stringify([['en-AU', 'Buy some'], ['vi-VN', 'bánh khọt'], ['en-AU', 'from'], ['vi-VN', 'Vũng Tàu'], ['en-AU', ', please!']]), 'phone voice: ' + JSON.stringify(r.said));
  ok(r.rec === 'fm' || r.rec === 'mf', `the pack has no two-voice recording of Cô Tam's line (${r.rec})`);
  ok(!r.old && r.url.endsWith(r.h + '.mp3'), 'the old all-English recording is still used');
  const mp3 = fs.statSync(`../voices/en/f/${r.h}.mp3`).size;
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `${cases.length} lines cut right; the phone says the Vietnamese words with its Vietnamese voice; recorded lines use both voices (Cô Tam ${(mp3 / 1024).toFixed(0)} KB)`;
});

// No phone emoji anywhere (owner, round R): every emoji on screen is the game's own drawing (js/emojiswap.js), on the
// page (menus, Grown-ups, games, speech boxes) and on canvases (signs, name tags, the mini-map)
await check('noemoji', async () => {
  const bad = [];
  const scan = (P, where) => P.page.evaluate(w => {
    const EMO = /\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])*(?:‍\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])*)*|[\u{1F1E6}-\u{1F1FF}]{2}/gu, out = new Set();
    const t0 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = t0.nextNode(); t; t = t0.nextNode()) { const p = t.parentElement; if (!p || p.closest('script,style,svg,textarea,input') || !p.getClientRects().length) continue; const s = t.nodeValue; for (const m of s.matchAll(EMO)) if (s[m.index + m[0].length] !== '︎') out.add(m[0] + ' (' + w + ')'); }
    return [...out];
  }, where).then(r => bad.push(...r));
  { const P = await open(b, { w: 820, h: 1180, touch: true, play: false, lang: 'vi' });
    await P.page.click('.screen.title .press', { force: true }); await P.page.waitForSelector('.screen.who'); await P.page.click('.modes button[data-m=split]'); await scan(P, 'who'); await P.ctx.close(); }
  const P = await open(b, { w: 1180, h: 820, lang: 'vi' }); await clear(P.page);
  await scan(P, 'valley');
  await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForTimeout(500); await scan(P, 'Vui chơi'); await clear(P.page);
  for (const t of ['map', 'bag', 'log', 'album', 'passport', 'games', 'cam', 'friend']) { await P.page.evaluate(t => __sv.openPad(0, t), t); await P.page.waitForTimeout(400); await scan(P, 'Pad ' + t); await clear(P.page); }
  await P.page.evaluate(async () => { (await import('/js/ui.js')).openGrownups(() => { }); }); await P.page.waitForTimeout(500);
  await P.page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; })); await P.page.waitForTimeout(300); await scan(P, 'Grown-ups'); await clear(P.page);
  await P.page.evaluate(() => { __sv.dialog('Bà Năm', [['🌸 Hello! 🇻🇳 🇦🇺', '🌸 Chào con! 🇻🇳 🇦🇺']]); }); await P.page.waitForTimeout(400); await scan(P, 'speech box'); await clear(P.page);
  const ids = await P.page.evaluate(async () => Object.keys((await import('/js/games/frame.js')).GAMES));
  for (const id of ids) { await P.page.evaluate(id => { __sv.playGame(0, id, 'replay'); }, id); await P.page.waitForTimeout(400); await scan(P, 'game ' + id); await P.page.evaluate(() => { document.querySelector('.gl .gl-x')?.click(); }); await P.page.waitForTimeout(250); }
  // a canvas label with a flag and a flower is painted with the drawings (blue from the Australian flag)
  const cv = await P.page.evaluate(() => { const c = document.createElement('canvas'); c.width = 200; c.height = 60; const g = c.getContext('2d'); g.font = '40px sans-serif'; g.textBaseline = 'middle'; g.fillText('Jack 🇦🇺 🌸', 4, 30); const d = g.getImageData(0, 0, 200, 60).data; let blue = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 2] > 80 && d[i] < 30 && d[i + 1] < 60) blue++; return blue; });
  if (cv < 200) bad.push('canvas labels still use phone emoji');
  const noArt = await P.page.evaluate(() => [...(window.__svNoArt || [])]); if (noArt.length) bad.push('no drawing yet: ' + noArt.join(' '));
  if (P.errors.length) bad.push(...P.errors);
  await P.ctx.close();
  ok(!bad.length, [...new Set(bad)].slice(0, 10).join(' · '));
  return `no phone emoji on Who's playing, the valley, Vui chơi, 8 Pad tabs, Grown-ups, a speech box and ${ids.length} games; painted labels use the drawings`;
});

await check('arch', async () => {
  // the import map: groups of files importing each other in a circle may only get fewer (tests/arch.mjs)
  const { execFileSync } = await import('child_process');
  let out = ''; try { out = execFileSync(process.execPath, ['arch.mjs'], { encoding: 'utf8' }); } catch (e) { ok(false, (e.stdout || '') + ''); }
  return out.trim().split('\n')[0];
});

await check('mapcoords', async () => {
  // (round T) js/content/map.js is the only place that holds world positions: the files that build the valley place their
  // things from a place's anchor, never at a position written as plain numbers (tests/mapcoords.mjs; r54 had 103)
  const { strayCoords, FILES } = await import('./mapcoords.mjs'), f = strayCoords('../js');
  ok(!f.length, f.slice(0, 12).map(x => `${x.file}:${x.line} ${x.text}`).join('; ') + (f.length > 12 ? ` (+${f.length - 12})` : ''));
  return `no world positions outside js/content/map.js in ${FILES.length} files`;
});

await check('regions', async () => {
  // (round T) every named area can be stood in somewhere in the valley, and the big places read as themselves at their
  // middle: the Dawn Plateau at home (it read as meadow once the plateau was lowered: no passport, songs or "you were in")
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), seen = new Set();
    for (let x = -W.HALF + 2; x < W.HALF - 2; x += 2) for (let z = -W.HALF + 2; z < W.HALF - 2; z += 2) seen.add(W.regionAt(x, z));
    const missing = Object.keys(W.REGION_NAMES).filter(k => !seen.has(k));
    const at = { plateau: [W.PLATEAU.x, W.PLATEAU.z], village: [W.VILLAGE.x, W.VILLAGE.z], town: [W.TOWN.x, W.TOWN.z], market: [W.MARKET.x, W.MARKET.z], aussie: [W.AUSSIE.x, W.AUSSIE.z] };
    const wrong = Object.entries(at).filter(([k, [x, z]]) => W.regionAt(x, z) !== k).map(([k, [x, z]]) => `${k} reads ${W.regionAt(x, z)}`);
    const home = W.regionAt(W.PLATEAU.x - 3, W.PLATEAU.z - 4);
    return { missing, wrong, home, n: Object.keys(W.REGION_NAMES).length };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.missing.length, `areas nowhere in the valley: ${r.missing.join(', ')}`);
  ok(!r.wrong.length, r.wrong.join('; '));
  ok(r.home === 'plateau', `the home spot reads ${r.home}, not plateau`);
  ok(!errs.length, errs.join(' | '));
  return `${r.n} areas all in the valley; home, Lotus Village, Phố Hai Quê, Chợ Ba Miền and Aussie Corner read as themselves`;
});

await check('bridges', async () => {
  // (round T2, RIVER-004, ROAD-009) every bridge spans its own water: at least 4 m of water under the middle of the span,
  // both ends on land, the deck is walkable; every bridge landmark stands on its bridge; and no road runs through water anywhere
  // except on a bridge deck
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), M = await import('/js/content/map.js'), G = __sv, bad = [];
    const at = (B, u, v = 0) => B.axis === 'z' ? [B.c + v, u] : [u, B.c + v];
    for (const B of W.BRIDGES) {
      // the water under the deck: at least 4 m of it, all within the middle 60 % of the span (the ends rest on raised banks)
      const span = B.a1 - B.a0; let wet = 0, first = null, last = null; for (let u = B.a0; u <= B.a1; u += .25) { const [x, z] = at(B, u); if (W.heightAt(x, z) < W.WATER - .3) { wet += .25; if (first == null) first = u; last = u; } }
      if (wet < 4 || first < B.a0 + span * .2 || last > B.a1 - span * .2) bad.push(`${B.id}: ${wet} m of water under it, from ${first} to ${last} (span ${B.a0} to ${B.a1})`);
      for (const u of [B.a0 - 1.5, B.a1 + 1.5]) { const [x, z] = at(B, u); if (W.heightAt(x, z) < W.WATER + .5) bad.push(`${B.id}: an end is not on land (${x},${z})`); }
      const [mx, mz] = at(B, (B.a0 + B.a1) / 2), y = G.world.groundAt(mx, mz, B.h + 2); if (Math.abs(y - B.h) > .6) bad.push(`${B.id}: deck not walkable (${y.toFixed(1)} vs ${B.h})`);
      if (B.over && !W.RIVERS.some(R => R.id === B.over)) bad.push(`${B.id}: over unknown water ${B.over}`);
      // (the Dragon Bridge is its own landmark, built with the roads: no postcard spot in the map)
      if (B.landmark && M.landmarkAt(B.landmark)) { const [lx, lz] = M.landmarkAt(B.landmark); if (!W.bridgeAt(lx, lz, B.w / 2 + .1)) bad.push(`${B.id}: its landmark ${B.landmark} is not on it`); }
    }
    let wetRoad = 0; const where = [];
    for (const L of G.world.roadLines) L.pts.forEach(([x, z], i) => { if (!L.deck[i] && W.heightAt(x, z) < W.WATER - .2) { wetRoad++; if (where.length < 6) where.push(`${x.toFixed(0)},${z.toFixed(0)}`); } });
    if (wetRoad) bad.push(`${wetRoad} road points in water off any deck: ${where.join(' ')}`);
    return { bad, n: W.BRIDGES.length, lm: W.BRIDGES.filter(B => B.landmark).map(B => B.landmark) };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.bad.length, r.bad.slice(0, 10).join('; '));
  ok(!errs.length, errs.join(' | '));
  return `${r.n} bridges each over its water, ends on land, decks walkable; landmarks on their bridges: ${r.lm.join(', ')}; no road in water`;
});

await check('boats', async () => {
  // (round T2, RIVER-002/005/006) ride every boat end to end, 1 m at a time: the water under it and 1.5 m either side
  // is deep enough (at the piers a little shallower), every deck it passes is high enough over it, and every pier's land
  // end joins a road or footpath; the raft stops by every bridge it passes under
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), M = await import('/js/content/map.js'), G = __sv, bad = [], THREE = await import('/vendor/three.module.js');
    const F = G.ferries.ferries, info = [];
    for (const f of F) {
      const box = new THREE.Box3().setFromObject(f.model), tall = box.max.y - W.WATER, name = f.boat === 'vtboat' ? 'Vũng Tàu boat' : f.harbour ? 'harbour ferry' : f.line ? 'raft line' : f.loop ? 'lake ferry' : 'crossing raft';
      let shallow = 0, low = 0, first = '';
      const stopPts = f.stops.map(s => f.path[s.i]);
      for (let i = 0; i < f.path.length - (f.loop ? 0 : 1); i++) { const a = f.path[i], c = f.path[(i + 1) % f.path.length], L = Math.hypot(c.x - a.x, c.z - a.z), n = Math.max(1, Math.ceil(L));
        for (let k = 0; k < n; k++) { const x = a.x + (c.x - a.x) * k / n, z = a.z + (c.z - a.z) * k / n, ux = -(c.z - a.z) / (L || 1), uz = (c.x - a.x) / (L || 1);
          const nearStop = stopPts.some(p => Math.hypot(p.x - x, p.z - z) < 6), lim = nearStop ? W.WATER - .25 : W.WATER - .8;
          const hs = [0, -1.5, 1.5].map(o => W.heightAt(x + ux * o, z + uz * o)); if ((nearStop ? hs[0] : Math.max(...hs)) > lim) { shallow++; if (!first) first = `${x.toFixed(0)},${z.toFixed(0)}`; }
          const B = W.bridgeAt(x, z, 4); if (B && B.h - tall < .5) low++; } }
      if (shallow) bad.push(`${name}: ${shallow} m too shallow (first at ${first})`);
      if (low) bad.push(`${name}: ${low} m under a deck too low for it`);
      for (const s of f.stops) { const p = s.dock && s.dock.pier && s.dock.pier.land; if (!p) continue; const rd = W.roadDist(p.x, p.z); if (!rd.road || rd.d > rd.road.w / 2 + 3) bad.push(`${name}: the pier at ${p.x.toFixed(0)},${p.z.toFixed(0)} (${s.name()}) joins no road (${rd.d.toFixed(1)} m)`); }
      info.push(`${name} ${f.stops.length} stops`);
    }
    const raft = F.find(f => f.line), want = (M.BOATS.find(b => b.id === 'raft').bridgeStops || []).map(s => s.bridge), have = raft ? raft.stops.map(s => s.bridge).filter(Boolean) : [];
    const missing = want.filter(id => !have.includes(id)); if (missing.length) bad.push('the raft does not stop by ' + missing.join(', '));
    if (!F.some(f => f.harbour)) bad.push('no Sydney Harbour ferry');
    // (round T3) every boat the map gives two piers runs: the Sydney Harbour ferry and the Sài Gòn boat to Vũng Tàu
    for (const B of M.BOATS.filter(B => B.piers)) if (!F.some(f => f.boat === B.id)) bad.push(`no boat ${B.id}`);
    return { bad, info };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.bad.length, r.bad.slice(0, 10).join('; '));
  ok(!errs.length, errs.join(' | '));
  return r.info.join(', ') + '; every route deep enough, under high enough decks, every pier on a road or path';
});

await check('plots', async () => {
  // (round T3, ROUND-T.md T3) the garden plots: at least 60 (two Memory Villages and up to three spare by each city); each level
  // within 5 cm, off every road and all water, its front within 2 m of a road's edge, a unique id and address, and nothing
  // standing on it (no solid cell, no collider, no building box); one garden mesh for all of them
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), G = __sv, bad = []; await G.solidsReady;
    const PL = W.PLOTS, ids = new Set(), en = new Set(), vi = new Set(), by = {};
    for (const p of PL) {
      const B = W.plotBox(p), tag = `${p.id} (${p.x.toFixed(0)},${p.z.toFixed(0)})`; by[p.village] = (by[p.village] || 0) + 1;
      if (ids.has(p.id)) bad.push('two plots called ' + p.id); ids.add(p.id);
      if (en.has(p.address[0]) || vi.has(p.address[1])) bad.push(`${tag}: address ${p.address[0]} used twice`); en.add(p.address[0]); vi.add(p.address[1]);
      let lo = 1e9, hi = -1e9, road = '', wet = false, solid = 0;
      for (let x = B.x0 + .15; x <= B.x1 - .15; x += .5) for (let z = B.z0 + .15; z <= B.z1 - .15; z += .5) {
        const h = W.heightAt(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h);
        const rd = W.roadDist(x, z); if (rd.road && rd.d < rd.road.w / 2) road = rd.road.id;
        if (h < W.WATER + .5 || W.waterAt(x, z, 4)) wet = true;
        if (G.world.solidAt(x, z)) solid++;
      }
      if (hi - lo > .05) bad.push(`${tag}: not level (${(hi - lo).toFixed(2)} m)`);
      if (road) bad.push(`${tag}: on the road ${road}`);
      if (wet) bad.push(`${tag}: in the water`);
      if (solid) bad.push(`${tag}: ${solid} solid cells on it`);
      const fx = p.x + Math.sin(p.rot) * p.d / 2, fz = p.z + Math.cos(p.rot) * p.d / 2, fr = W.roadDist(fx, fz);
      if (!fr.road || fr.d - fr.road.w / 2 > 2) bad.push(`${tag}: its front is ${(fr.d - (fr.road ? fr.road.w / 2 : 0)).toFixed(1)} m from a road`);
      const inside = (x, z, m = 0) => x > B.x0 - m && x < B.x1 + m && z > B.z0 - m && z < B.z1 + m;
      const col = G.world.colliders.find(c => inside(c.x, c.z, c.r * .5)); if (col) bad.push(`${tag}: something stands on it (${col.x.toFixed(0)},${col.z.toFixed(0)})`);
      const box = G.world.boxes.find(o => !o.room && o.x1 > B.x0 && o.x0 < B.x1 && o.z1 > B.z0 && o.z0 < B.z1); if (box) bad.push(`${tag}: a building box overlaps it`);
    }
    let gardens = 0; G.scene.traverse(o => { if (o.userData.plots) gardens++; });
    return { n: PL.length, bad, by, gardens, count: G.plots ? G.plots.count : 0 };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.n >= 60, `only ${r.n} plots (want 60 or more)`);
  ok(!r.bad.length, r.bad.slice(0, 10).join('; ') + (r.bad.length > 10 ? ` … ${r.bad.length} in all` : ''));
  ok(r.gardens === 1 && r.count === r.n, `the gardens are ${r.gardens} meshes for ${r.count} of ${r.n} plots (want one mesh for all)`);
  ok(!errs.length, errs.join(' | '));
  return `${r.n} plots (${Object.entries(r.by).map(([k, v]) => `${k} ${v}`).join(', ')}): each level, dry, off the roads, its front by a road, a unique address, nothing on it; one garden mesh`;
});

await check('roadtone', async () => {
  // (round T2, ROAD-014, Concept D "B"; round T4a ROAD-015) every asphalt road carries its region's colour, one shared material per colour,
  // and the ring road round the home island is closed
  const M = await import('../js/content/map.js'), bad = [];
  for (const R of M.ROADS) if (R.kind === 'asphalt' && !(R.tone in M.ROAD_TONES)) bad.push(`${R.id} has no colour`);
  const ring = M.ROADS.find(R => R.id === 'ring'); if (!ring || !ring.loop) bad.push('the ring road is not a closed loop');
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const mats = await P.page.evaluate(() => { const s = new Set(); __sv.scene.traverse(o => { if (o.userData.road && o.material && o.material.map) s.add(o.material.uuid); }); return s.size; });
  // (round T4a, ROAD-015) the markings: a yellow centre dash on Vietnam's roads, light concrete kerbs on Australia's
  const mark = await P.page.evaluate(async () => {
    const M = await import('/js/content/map.js'), { THREE } = await import('/js/gfx.js'), mid = id => { const R = M.ROADS.find(r => r.id === id), [a, c] = R.pts; return [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2]; };
    const at = ([x, z], px, py) => { let got = null; __sv.scene.traverse(o => { if (got || !o.userData.road || !o.material || !o.material.map) return; o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox;
      if (x > bb.min.x && x < bb.max.x && z > bb.min.z && z < bb.max.z) { const im = o.material.map.image, g = im.getContext('2d'); got = [...g.getImageData(px, py, 1, 1).data].slice(0, 3); } }); return got; };
    return { vnDash: at(mid('vn_north'), 31, 60), auKerb: at(mid('link_au'), 1, 60), auMid: at(mid('link_au'), 20, 60) };
  });
  const errs = P.errors; await P.ctx.close();
  { const [r, g, bl] = mark.vnDash || [0, 0, 0]; ok(r > 200 && g > 150 && bl < 120, `Vietnam's road has no yellow centre dash: rgb ${mark.vnDash}`); }
  { const k = mark.auKerb || [0, 0, 0], m = mark.auMid || [0, 0, 0]; ok(k[0] > 180 && k[0] > m[0] + 40, `Australia's road has no concrete kerb: kerb rgb ${k}, road rgb ${m}`); }
  const tones = new Set(M.ROADS.filter(R => R.kind === 'asphalt').map(R => M.ROAD_TONES[R.tone] || 'grey'));
  ok(!bad.length, bad.join('; '));
  ok(mats <= tones.size + 2, `${mats} road materials for ${tones.size} asphalt colours (one each, plus dirt and footpath)`);
  ok(!errs.length, errs.join(' | '));
  return `${M.ROADS.filter(R => R.kind === 'asphalt').length} asphalt roads in ${tones.size} colours, ${mats} road materials; the ring road is closed; a yellow centre dash in Vietnam, kerbs in Australia`;
});

await check('friendgames', async () => {
  // (r63, owner: "all games of multiplayer should only be between the players"; "the Caro board can be bigger") on a
  // phone: Tiến Lên with one friend seats just the two children (no computer players); a 15 × 15 Caro board from the
  // inviter's choice has 225 squares, each at least 44 px, in a board that scrolls; the invitation window offers sizes
  const r = {};
  for (const [game, size] of [['tienlen', null], ['caro', 15]]) {
    const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
    r[game] = await P.page.evaluate(async ([game, size]) => {
      const G = __sv, wait = ms => new Promise(res => setTimeout(res, ms));
      const online = { mine: 0, names: ['Bé Na', 'Bé Bin'], seed: 'r63test', size: size || undefined, move() { }, next: () => new Promise(() => { }), onMove() { }, all: () => new Promise(() => { }) };
      G.playGameOnline(game, 2, online); await wait(2500);
      if (game === 'tienlen') { const opp = [...document.querySelectorAll('.tl-opp .tl-p b')].map(e => e.textContent), mine = document.querySelectorAll('.tl-hand .tl-card').length; return { opp, mine, text: document.body.textContent.includes('Anh Ba') || document.body.textContent.includes('Con Vật') }; }
      const cells = [...document.querySelectorAll('.caro-c')], w = cells.length ? cells[0].getBoundingClientRect().width : 0, wrap = document.querySelector('.caro-wrap');
      return { cells: cells.length, w, scrolls: !!wrap && wrap.scrollWidth > wrap.clientWidth, pageWide: document.documentElement.scrollWidth > innerWidth + 1 };
    }, [game, size]);
    r[game].errs = P.errors; await P.ctx.close();
  }
  // the invitation window: level and, for Caro, the board's size
  const Q = await open(b, { w: 390, h: 844, touch: true }); await clear(Q.page);
  const pick = await Q.page.evaluate(async () => { const G = __sv; G.inviteGame('caro', 'nobody'); await new Promise(res => setTimeout(res, 600));
    const sizes = [...document.querySelectorAll('[data-size]')].map(e => +e.dataset.size), lv = document.querySelectorAll('[data-lvl]').length, small = [...document.querySelectorAll('[data-size],[data-lvl]')].filter(e => { const q = e.getBoundingClientRect(); return q.width < 44 || q.height < 44; }).length;
    return { sizes, lv, small }; });
  await Q.page.screenshot({ path: 'out/friendgames-invite.png' }); const qerr = Q.errors; await Q.ctx.close();
  const t = r.tienlen, c = r.caro;
  ok(t.opp.length === 1 && t.opp[0] === 'Bé Bin' && !t.text && t.mine === 13, 'Tiến Lên with one friend: ' + JSON.stringify(t));
  ok(c.cells === 225 && c.w >= 44 && c.scrolls && !c.pageWide, 'Caro 15 × 15 on a phone: ' + JSON.stringify(c));
  ok(pick.sizes.join(',') === '3,6,9,13,15,19' && pick.lv === 5 && !pick.small, 'the invitation window: ' + JSON.stringify(pick));
  const errs = [...t.errs, ...c.errs, ...qerr]; ok(!errs.length, errs.join(' | '));
  return `Tiến Lên with one friend: 2 children, no computer players; Caro 15 × 15: 225 squares of ${c.w.toFixed(0)} px in a scrolling board; the invitation offers 5 levels and 6 board sizes`;
});

await check('micoff', async () => {
  // (r63, owner: "the microphone should always be off until the user turns it on"; on an iPhone the tap did nothing)
  // starting or joining a room never asks for the microphone; the HUD's Mic button starts off; one tap asks (inside the
  // tap) and turns it on; the next tap turns it off (the track goes quiet), the next on again
  const P = await open(b, { w: 900, h: 640, pre: `(() => { window.__gum = 0; const md = navigator.mediaDevices; if (!md) return; const real = md.getUserMedia.bind(md);
    md.getUserMedia = c => { window.__gum++; const a = new AudioContext(), o = a.createOscillator(), d = a.createMediaStreamDestination(); o.connect(d); o.start(); return Promise.resolve(d.stream); }; })()` });
  await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const { Net } = await import('/js/net.js'), G = __sv, wait = ms => new Promise(r => setTimeout(r, ms)), said = [];
    Net.on('status', s => said.push(s.key));
    const startMuted = Net.muted;
    Net.host({ name: 'Bé Na' }).catch(() => { }); await wait(1500);
    const asked = window.__gum, hint = said.includes('mictap');
    const btn = () => document.querySelector('.dk.call'), label = () => btn() && btn().querySelector('small').textContent;
    G.huds.forEach(hd => hd.setCall(true, false, Net.muted || !Net.mic)); const before = label();
    await G.toggleMute(); const on = { mic: !!Net.mic, muted: Net.muted, live: Net.mic && Net.mic.getAudioTracks()[0].enabled, label: label(), asked: window.__gum };
    await G.toggleMute(); const off = { muted: Net.muted, live: Net.mic.getAudioTracks()[0].enabled, label: label(), asked: window.__gum };
    await G.toggleMute(); const again = { muted: Net.muted, live: Net.mic.getAudioTracks()[0].enabled };
    try { Net.close(); } catch (e) { }
    return { startMuted, asked, hint, before, on, off, again };
  });
  const errs = P.errors.filter(e => !/peer|Peer|socket|lost connection/i.test(e)); await P.ctx.close();
  ok(r.startMuted && r.asked === 0, `starting a room asked for the microphone ${r.asked} times (muted at start: ${r.startMuted})`);
  ok(r.hint, 'no "your microphone is off" hint when the room started');
  ok(r.before === 'Mic off', `the Mic button says "${r.before}" before a tap`);
  ok(r.on.mic && !r.on.muted && r.on.live && r.on.label === 'Mic on' && r.on.asked === 1, 'the first tap: ' + JSON.stringify(r.on));
  ok(r.off.muted && !r.off.live && r.off.label === 'Mic off' && r.off.asked === 1, 'the second tap: ' + JSON.stringify(r.off));
  ok(!r.again.muted && r.again.live, 'the third tap: ' + JSON.stringify(r.again));
  ok(!errs.length, errs.join(' | '));
  return 'a room starts with the microphone off and asks for nothing; Mic off → one tap asks and turns it on → off → on';
});

await check('gates', async () => {
  // (r63, ROAD-016; owner: "at the gate of Hà Nội it is blocked and I can't go through") a child walks through every
  // gate on a road's end, from 8 m outside to 3 m inside (through the gate onto the square), along the road: nothing
  // solid stops them and the ground never steps more than 25 cm from one half metre to the next (a bridge deck on the way
  // is the `bridges` check's)
  const P = await open(b, { w: 900, h: 640, play: false });
  await P.page.waitForFunction(() => __sv.world && __sv.world.solidAt, null, { timeout: 90000 });
  const r = await P.page.evaluate(async () => {
    const W = __sv.world, w = await import('/js/world.js'), M = await import('/js/content/map.js'), bad = []; let n = 0, worst = 0;
    for (const R of M.ROADS) (R.gates || []).forEach((g, k) => { if (!g) return; n++;
      const pts = R.pts, [x0, z0] = k ? pts[pts.length - 1] : pts[0], [x1, z1] = k ? pts[pts.length - 2] : pts[1], L = Math.hypot(x0 - x1, z0 - z1), ux = (x0 - x1) / L, uz = (z0 - z1) / L;
      let prev = null; for (let t = -8; t <= 3; t += .5) { const x = x0 + ux * t, z = z0 + uz * t, h = w.heightAt(x, z);
        if (W.platforms.some(P => { const p = P.apron || P; return !P.tower && x > p.x0 - .4 && x < p.x1 + .4 && z > p.z0 - .4 && z < p.z1 + .4; })) { prev = null; continue; } // (r66: with Round U a bridge's 1.2 m apron is part of it, with the 0.4 m edge js/solids.js gives every deck)
        const pos = { x, y: h, z }; W.collide(pos, .35); if (Math.hypot(pos.x - x, pos.z - z) > .2) { bad.push(`${g} (${R.id}): blocked ${t.toFixed(1)} m from the gate`); break; }
        if (prev != null) { const st = Math.abs(h - prev); worst = Math.max(worst, st); if (st > .25) { bad.push(`${g} (${R.id}): a ${st.toFixed(2)} m step ${t.toFixed(1)} m from the gate`); break; } } prev = h; } });
    return { n, worst, bad };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.n >= 15, `only ${r.n} gates found`);
  ok(!r.bad.length, r.bad.join('; '));
  ok(!errs.length, errs.join(' | '));
  return `${r.n} gates walked through, nothing in the way, the biggest step ${(r.worst * 100).toFixed(0)} cm`;
});

await check('water', async () => {
  // (round T4a, RIVER-008) the water map: one water plane and one draw, its picture 1024 px or smaller, painted once and
  // read back from the device on the next start; each water its colour (Sông Hồng red-brown, the sea blue, the lake
  // turquoise), a foam line by the shore. (RIVER-009) reeds and water hyacinth: two instanced meshes, none on a road,
  // deck or pier, hyacinth never on a boat route
  const P = await open(b, { w: 900, h: 640, play: false });
  const pic = async () => { await P.page.waitForFunction(() => __sv.waterPic && __sv.waterPic.ready && __sv.reeds && __sv.ferries, null, { timeout: 90000 }); return P.page.evaluate(() => __sv.waterPic.from); };
  const first = await pic();
  for (let i = 0; i < 75; i++) { if (await P.page.evaluate(async () => { try { const k = await caches.open('sv-world'); return (await k.keys()).some(r => r.url.includes('/water.png')); } catch (e) { return true; } })) break; await P.page.waitForTimeout(200); }
  await P.page.reload(); await P.page.waitForSelector('.screen.title', { timeout: 90000 }); const second = await pic();
  ok(first === 'painted' && second === 'cache', `water map: first start ${first}, second start ${second} (should be painted, then from the cache)`);
  const r = await P.page.evaluate(async () => {
    const G = __sv, W = await import('/js/world.js'), M = await import('/js/content/map.js'), cv = G.waterPic.canvas, g = cv.getContext('2d');
    const px = (x, z) => { const i = Math.floor((x / W.SIZE + .5) * cv.width), j = Math.floor((z / W.SIZE + .5) * cv.height); return [...g.getImageData(i, j, 1, 1).data]; };
    const planes = [], mats = new Set(); G.scene.traverse(o => { if (o.isMesh && o.material && o.material.customProgramCacheKey && o.material.customProgramCacheKey() === 'svwater') { planes.push(o); mats.add(o.material.uuid); } });
    const tex = planes[0] && planes[0].material.userData, tx = planes.length ? cv : null;
    // a spot in the middle of Sông Hồng, the lake, the sea; a shore: the lake's edge (deep middle vs. the water's edge)
    const hong = M.WATERS.find(w => w.id === 'hong').pts[2], deep = px(W.LAKE.x, W.LAKE.z + W.LAKE.r * .3);
    let shore = 0; for (let a = 0; a < 6.3; a += .05) for (let d = W.LAKE.r * .6; d < W.LAKE.r + 4; d += .5) { const x = W.LAKE.x + Math.cos(a) * d, z = W.LAKE.z + Math.sin(a) * d; if (W.heightAt(x, z) < W.WATER - .2 && W.heightAt(x, z) > W.WATER - 1) { shore = Math.max(shore, px(x, z)[3]); } }
    // reeds and hyacinth: where every one stands
    const items = []; for (const m of G.reeds.meshes) { const a = m.instanceMatrix.array; for (let i = 0; i < m.count; i++) items.push({ k: m.userData.reeds ? 'reeds' : 'hyacinth', x: a[i * 16 + 12], z: a[i * 16 + 14] }); }
    const bad = [];
    for (const it of items) {
      const rd = W.roadDist(it.x, it.z); if (rd.road && rd.d < rd.road.w / 2 + 1) bad.push(`${it.k} on road ${rd.road.id || rd.road.kind} at (${it.x.toFixed(0)}, ${it.z.toFixed(0)})`);
      if (G.world.platforms.some(p => it.x > p.x0 - .5 && it.x < p.x1 + .5 && it.z > p.z0 - .5 && it.z < p.z1 + .5)) bad.push(`${it.k} on a deck or pier at (${it.x.toFixed(0)}, ${it.z.toFixed(0)})`);
      if (it.k === 'hyacinth') for (const F of G.ferries.ferries) for (let i = 0; i < F.path.length - 1; i++) { const a = F.path[i], c = F.path[i + 1], dx = c.x - a.x, dz = c.z - a.z, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((it.x - a.x) * dx + (it.z - a.z) * dz) / L2));
        if (Math.hypot(it.x - a.x - dx * t, it.z - a.z - dz * t) < 4) { bad.push(`hyacinth on a boat route at (${it.x.toFixed(0)}, ${it.z.toFixed(0)})`); break; } }
    }
    return { planes: planes.length, mats: mats.size, size: tx ? Math.max(cv.width, cv.height) : 0, hong: px(hong[0], hong[1]), lake: deep, sea: px(0, W.SIZE / 2 - 8), shore, deepA: deep[3],
      reeds: items.filter(i => i.k === 'reeds').length, hyacinth: items.filter(i => i.k === 'hyacinth').length, meshes: G.reeds.meshes.length, bad: bad.slice(0, 8), nbad: bad.length };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.planes === 1 && r.mats === 1, `${r.planes} water planes with ${r.mats} materials (should be one, one draw)`);
  ok(r.size > 0 && r.size <= 1024, `water map ${r.size} px (1024 or smaller)`);
  const [hr, hg, hb] = r.hong, [lr, lg, lb] = r.lake, [sr, sg, sb] = r.sea;
  ok(hr > hb + 40 && hr > hg, `Sông Hồng is not red-brown: rgb ${r.hong.slice(0, 3)}`);
  ok(sb > sr + 60 && sb > sg, `the sea is not blue: rgb ${r.sea.slice(0, 3)}`);
  ok(lb > lr + 60 && lg > lr + 60, `the lake is not turquoise: rgb ${r.lake.slice(0, 3)}`);
  ok(r.shore > 200 && r.deepA < 80, `no foam line by the lake's shore (alpha by the shore ${r.shore}, deep water ${r.deepA})`);
  ok(r.meshes === 2 && r.reeds >= 50 && r.hyacinth >= 20, `${r.meshes} meshes, ${r.reeds} reeds, ${r.hyacinth} hyacinth (two meshes, at least 50 and 20)`);
  ok(!r.nbad, `${r.nbad} reeds or hyacinth in the wrong place: ${r.bad.join('; ')}`);
  ok(!errs.length, errs.join(' | '));
  return `one water plane, map ${r.size} px painted then from the cache; Sông Hồng rgb ${r.hong.slice(0, 3)}, sea ${r.sea.slice(0, 3)}, lake ${r.lake.slice(0, 3)}, foam by the shore; ${r.reeds} reeds and ${r.hyacinth} hyacinth in 2 meshes, none on a road, deck, pier or boat route`;
});

await check('surface', async () => {
  // (round T4a, WORLD-014) footsteps by surface: surfaceAt at known spots of the map
  const P = await open(b, { w: 900, h: 640, play: false });
  await P.page.waitForFunction(() => __sv.ferries, null, { timeout: 90000 });
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), M = await import('/js/content/map.js'), G = __sv, on = (x, z, y) => W.surfaceAt(x, z, y);
    const road = id => { const R = M.ROADS.find(r => r.id === id), [a, c] = R.pts; return [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2]; };
    const vn = road('vn_north'), dirt = road('mv_e1'), city = W.CITIES.find(c => c.id === 'hanoi'), lake = [W.LAKE.x, W.LAKE.z];
    // the beach: the first dry spot north of the sea, low and sandy, on the meridian of the Sài Gòn mouth's east
    let beach = null; for (let z = 236; z > 150 && !beach; z -= .5) { const h = W.heightAt(60, z); if (h > W.WATER + .3 && h < 1.4) beach = [60, z]; }
    const B = M.BRIDGES.find(b => b.id === 'haique'), deck = B.axis === 'x' ? [(B.a0 + B.a1) / 2, B.c] : [B.c, (B.a0 + B.a1) / 2];
    const pier = G.ferries.ferries.flatMap(F => F.stops.map(s => s.dock && s.dock.pier)).find(p => p && p.tip);
    const home = M.PLACES.find(p => p.id === 'home').at;
    let grass = null; for (let k = 0; k < 400 && !grass; k++) { const x = home[0] + Math.cos(k) * (10 + k * .1), z = home[1] + Math.sin(k) * (10 + k * .1), rd = W.roadDist(x, z); if (W.heightAt(x, z) > 2 && (!rd.road || rd.d > rd.road.w / 2 + 2)) grass = [x, z]; }
    const got = {
      road: on(vn[0], vn[1]), town: on(city.x, city.z), dirt: on(dirt[0], dirt[1]), sand: beach && on(beach[0], beach[1]), water: on(lake[0] + W.LAKE.r * .5, lake[1]),
      wood: on(deck[0], deck[1], W.WATER + B.h), pier: pier && on(pier.tip.x, pier.tip.z, pier.tip.y), grass: grass && on(grass[0], grass[1])
    };
    return got;
  });
  const errs = P.errors; await P.ctx.close();
  const want = { road: 'road', town: 'road', dirt: 'dirt', sand: 'sand', water: 'water', wood: 'wood', pier: 'wood', grass: 'grass' };
  const wrong = Object.keys(want).filter(k => r[k] !== want[k]).map(k => `${k}: ${r[k]} (should be ${want[k]})`);
  ok(!wrong.length, wrong.join('; '));
  ok(!errs.length, errs.join(' | '));
  return Object.entries(r).map(([k, v]) => `${k} ${v}`).join(', ');
});

await check('walkaway', async () => {
  // a villager's words and the chat window stay while the child stands near, and close by themselves once the child
  // walks away (6 m; owner, round 30)
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], C = await import('/js/chat.js'), x0 = h.pos.x, z0 = h.pos.z, wait = ms => new Promise(r => setTimeout(r, ms));
    G.dialog('Bà Năm', [['Hello there, little one!', 'Chào con!']]); C.openChat(G, 0, Object.keys(C.PERSONAS)[0]);
    await wait(400); h.place(x0 + 3, z0); await wait(1200);
    const near = { dialog: !!document.querySelector('.dialog:not(.out)'), chat: !!document.querySelector('.chatbox') };
    h.place(x0 + 9, z0); await wait(1500);
    const far = { dialog: !!document.querySelector('.dialog:not(.out)'), chat: !!document.querySelector('.chatbox') };
    return { near, far };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.near.dialog && r.near.chat && !r.far.dialog && !r.far.chat && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return '3 m away the talk box and the chat stay; 9 m away both have closed by themselves';
});

await check('ages', async () => {
  // two age groups split at 5 (owner, round 30): under-5s get bigger answer buttons, and the right answer wiggles after
  // 10 s or two misses; 5 and up get no hint. Every game is open to both groups.
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const F = await import('/js/games/frame.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    const run = async little => {
      const els = [1, 2, 3].map(n => { const e = document.createElement('button'); e.className = 'choice'; e._v = n; document.body.appendChild(e); return e; });
      const api = { little, closed: false, right() { }, wrong() { } };
      const done = F.untilRight(api, els, e => e._v === 3);
      const hintAt = [];
      for (const k of [0, 1]) { els[k].click(); await wait(50); hintAt.push(els[2].classList.contains('hint')); }
      els[2].click(); await done; const after = els[2].classList.contains('hint'); els.forEach(e => e.remove());
      return { hintAt, after };
    };
    const small = await run(true), big = await run(false);
    const g = F.openGame('colors', { players: [{ name: 'A', levels: {} }], little: true }); await wait(300);
    const layer = !!document.querySelector('.gl.little'); document.querySelector('.gl-x').click(); await g;
    return { small, big, layer, hintMs: F.HINT_AFTER };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.small.hintAt[0] && r.small.hintAt[1] && !r.small.after && !r.big.hintAt.some(Boolean) && r.layer && r.hintMs === 10000 && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return 'under 5: big buttons, the right answer wiggles after two misses (or 10 s), and stops once tapped; 5 and up: no hint';
});

await check('simple', async () => {
  // the Simple screen (round I, js/simple.js): an under-5 starts on it; any game or story is one tap away (A11Y-003);
  // when the game ends the path comes back; 🌳 Valley switches to the 3D world and is remembered; a big kid starts in
  // the valley and can open it from the dock; two players on one device never see it
  const P = await open(b, { w: 390, h: 844, touch: true, screen: null });
  await P.page.waitForSelector('.simple-screen:not([hidden]) .sp-catcard, .simple-screen:not([hidden]) .sp-stop', { timeout: 20000 });
  await P.page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d.remove()));
  const r = { start: true };
  // (Round U, owner 11 Oct: separate sections; replaces bug #30's one long road) each tab first shows its categories as
  // big picture cards; a card opens that category's own short road, with a big Back button to the cards
  r.groupsFirst = await P.page.evaluate(() => { const v = __sv.simple.view, back = document.querySelector('.sp-back'); return v.cat === null && v.cats.length > 3 && !v.stops.length && document.querySelectorAll('.sp-catcard').length === v.cats.length && back.hidden && document.querySelectorAll('.sp-discover').length === 1; });
  await P.page.locator('.sp-catcard').first().click(); await P.page.waitForTimeout(300);
  r.section = await P.page.evaluate(() => { const v = __sv.simple.view, back = document.querySelector('.sp-back'), bb = back.getBoundingClientRect(); return { cat: v.cat, stops: v.stops.length, heads: document.querySelectorAll('.sp-stop.grp').length, back: !back.hidden && Math.min(bb.width, bb.height) >= 64 }; });
  await P.page.click('.sp-back'); await P.page.waitForTimeout(300); r.backToCards = await P.page.evaluate(() => __sv.simple.view.cat === null && document.querySelectorAll('.sp-catcard').length > 3);
  await P.page.locator('.sp-catcard').first().click(); await P.page.waitForTimeout(300);
  // round M: the game opens straight over the Simple screen (it never hides first, so the valley does not flash up)
  await P.page.evaluate(() => { window.__flash = false; const t = setInterval(() => { if (!__sv.simple.open) window.__flash = true; if (document.querySelector('.gl')) clearInterval(t); }, 20); });
  await P.page.locator('.sp-stop:not(.grp)').first().click(); await P.page.waitForSelector('.gl', { timeout: 10000 }); r.game = true; r.flash = await P.page.evaluate(() => window.__flash);
  await P.page.evaluate(() => document.querySelector('.gl-x').click());
  r.back = await P.page.waitForFunction(() => __sv.simple.open && !__sv.simple.busy && !document.querySelector('.gl'), null, { timeout: 8000 }).then(() => true, () => false); // free again at once
  await P.page.click('.sp-tabs [data-tab="tales"]'); await P.page.waitForTimeout(300); r.talesCards = await P.page.evaluate(() => __sv.simple.view.cat === null);
  await P.page.locator('.sp-catcard').first().click(); await P.page.waitForTimeout(300); await P.page.locator('.sp-stop:not(.grp)').first().click();
  r.tale = await P.page.waitForSelector('.theatre', { timeout: 10000 }).then(() => true, () => false);
  await P.page.evaluate(() => document.querySelector('.theatre .th-x').click());
  for (let k=0;k<6;k++){ console.log('DBG', JSON.stringify(await P.page.evaluate(() => ({ open: __sv.simple.open, busy: __sv.simple.busy, th: document.querySelectorAll('.theatre').length, gl: !!document.querySelector('.gl'), paused: __sv.paused })))); await P.page.waitForTimeout(800);}
  await P.page.waitForFunction(() => __sv.simple.open && !__sv.simple.busy && !document.querySelector('.theatre'), null, { timeout: 8000 }).catch(() => { }); // (the story fades out first)
  await P.page.evaluate(() => document.querySelectorAll('.dialog, .reward').forEach(d => d.remove()));
  await P.page.click('.sp-valley'); await P.page.waitForTimeout(500);
  r.valley = await P.page.evaluate(() => ({ open: __sv.simple.open, screen: __sv.heroes[0].profile.screen, dock: !document.querySelector('.simplesw').hidden, paused: __sv.paused }));
  await P.page.click('.simplesw'); r.reopen = await P.page.evaluate(() => __sv.simple.open);
  const errs = P.errors; await P.ctx.close();
  // a big kid, and two players
  const B = await open(b, { w: 390, h: 844, touch: true, screen: null });
  await B.page.evaluate(() => { __sv.simple.hide(); __sv.heroes[0].profile.age = 'big'; delete __sv.heroes[0].profile.screen; __sv.simple.start(); });
  await B.page.waitForTimeout(1200); r.big = await B.page.evaluate(() => __sv.simple.open); await B.ctx.close();
  // a phone on its side: the bar is a rail on the left and the path scrolls sideways; every picture still ≥ 64 px
  const W = await open(b, { w: 844, h: 390, touch: true, screen: 'simple' });
  await W.page.waitForSelector('.simple-screen:not([hidden]) .sp-catcard, .simple-screen:not([hidden]) .sp-stop', { timeout: 20000 });
  r.wide = await W.page.evaluate(() => { const s = document.querySelector('.simple-screen'), t = s.querySelector('.sp-tabs').getBoundingClientRect(), sc = s.querySelector('.sp-scroll'), pics = [...s.querySelectorAll('.sp-pic')].map(e => e.getBoundingClientRect()), tabs = [...s.querySelectorAll('.sp-tabs button')].map(e => e.getBoundingClientRect());
    return { wide: s.classList.contains('wide'), rail: t.left < 5 && t.height > 300, sideways: sc.scrollWidth > sc.clientWidth && sc.scrollHeight <= sc.clientHeight + 2, inView: pics.slice(0, 3).every(p => p.top >= 0 && p.bottom <= innerHeight), big: pics.every(p => p.width >= 64) && tabs.every(p => Math.min(p.width, p.height) >= 64) }; });
  await W.ctx.close();
  const S = await open(b, { w: 1280, h: 800, mode: 'split', screen: null }); await S.page.waitForTimeout(1500);
  r.split = await S.page.evaluate(() => ({ open: __sv.simple.open, dock: [...document.querySelectorAll('.simplesw')].some(d => !d.hidden) })); await S.ctx.close();
  ok(r.groupsFirst && r.section.cat && r.section.stops >= 1 && r.section.heads === 1 && r.section.back && r.backToCards && r.talesCards && !r.flash && r.game && r.back && r.tale && !r.valley.open && r.valley.screen === 'valley' && r.valley.dock && !r.valley.paused && r.reopen && r.wide.wide && r.wide.rail && r.wide.sideways && r.wide.inView && r.wide.big && !r.big && !r.split.open && !r.split.dock && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return 'under 5 starts on the category cards; a card opens its own short road, Back returns to the cards; a game and a story each two taps away, the road comes back after; Valley remembered; the “Big pictures” switch reopens it; on its side a rail and a sideways path; big kid and two players start in the valley';
});

await check('adventure', async () => {
  // round J (owner's brief: "an adventure world containing places children want to visit"): one activity list places
  // every game; an under-5 sees one group at a time on one page that scrolls (round P, owner; it was six a page) and every one is a drawn picture; a tap answers at once and a
  // second tap can't start a game twice; a big kid taps once to look and again to play, sees ✨ on new games and can
  // search; Discover jumps to any area; Ông Cú cheers a new star; the landscape stands still in Calm mode; opening and
  // closing the screen 25 times leaves no extra listeners or elements behind
  const P = await open(b, { w: 390, h: 844, touch: true, screen: 'simple' });
  await P.page.waitForSelector('.simple-screen:not([hidden]) .sp-catcard, .simple-screen:not([hidden]) .sp-stop', { timeout: 20000 });
  await P.page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d.remove()));
  const r = {};
  // the list: every game is placed exactly once, and nothing is listed that isn't a game
  r.list = await P.page.evaluate(async () => { const { GAMES } = await import('/js/games/registry.js'), A = await import('/js/content/activities.js'), ids = Object.keys(GAMES), keys = Object.keys(A.GAME_INFO);
    return { missing: ids.filter(i => !A.GAME_INFO[i]), extra: keys.filter(k => !GAMES[k] && k !== 'familyquiz') /* Family Quiz is there only once the family has written questions in Studio */, badArea: keys.filter(k => !A.AREAS.some(a => a.key === A.GAME_INFO[k][0])), games: ids.length }; });
  // walk every under-5 section (Round U: the category cards, then each category's own road)
  r.walk = await P.page.evaluate(async () => {
    const { GAMES } = await import('/js/games/registry.js'), A = await import('/js/content/activities.js'), out = { notDrawn: [], tooBig: [] };
    const cats = __sv.simple.view.cats, stops = []; let heads = 0;
    document.querySelectorAll('.sp-catcard .sp-pic').forEach(p => { if (!p.querySelector('.art')) out.notDrawn.push(p.parentElement.getAttribute('aria-label')); });
    for (const c of cats) {
      __sv.simple.openGroup('games', c); const v = __sv.simple.view; stops.push(...v.stops); heads += document.querySelectorAll('.sp-stop.grp').length;
      document.querySelectorAll('.sp-stop .sp-pic').forEach(p => { if (!p.querySelector('.art')) out.notDrawn.push(p.parentElement.getAttribute('aria-label')); });
    }
    __sv.simple.openGroup('games', null);
    out.tooBig.push(...stops.filter(id => id !== 'songs' && A.gameInfo(id).ageMin >= 5));
    const want = Object.keys(GAMES).filter(id => A.gameInfo(id).ageMin < 5);
    const order = A.AREAS.map(a => a.key).filter(k => cats.includes(k));
    return { cats: cats.length, inOrder: JSON.stringify(order) === JSON.stringify(cats), heads, missed: want.filter(id => !stops.includes(id)), notDrawn: out.notDrawn, tooBig: out.tooBig, stops: stops.length };
  });
  // places: China and India (asia) always come last
  r.placesLast = await P.page.evaluate(() => { __sv.simple.show('places'); const c = __sv.simple.view.cats; return c[c.length - 1]; });
  await P.page.evaluate(() => __sv.simple.show('games'));
  // Discover: a big picture for every area; tapping Music goes there
  await P.page.click('.sp-discover'); await P.page.waitForSelector('.sp-find:not([hidden]) .sp-card');
  r.find = await P.page.evaluate(() => ({ cards: document.querySelectorAll('.sp-card').length, search: !!document.querySelector('.sp-q') }));
  await P.page.click('.sp-card[data-t="games"][data-a="music"]'); await P.page.waitForTimeout(200); r.music = await P.page.evaluate(() => { const h = [...document.querySelectorAll('.sp-stop.grp')].find(b => /Music|Âm nhạc/.test(b.getAttribute('aria-label'))), r = h && h.getBoundingClientRect(); return __sv.simple.view.cat === 'music' && r && r.top >= 0 && r.top < innerHeight / 2 ? 'music' : 'lost'; });
  // a double tap starts the game once
  await P.page.evaluate(() => { window.__starts = 0; const pg = __sv.playGame; __sv.playGame = (...a) => { window.__starts++; return pg(...a); }; const s = [...document.querySelectorAll('.sp-stop:not(.grp)')].find(x => !/^(Songs|Bài hát)$/.test(x.getAttribute('aria-label'))); s.click(); s.click(); setTimeout(() => s.click(), 120); }); // (a game, not the Music group's 🎵 Songs)
  await P.page.waitForSelector('.gl', { timeout: 10000 }); await P.page.waitForTimeout(400);
  r.starts = await P.page.evaluate(() => window.__starts);
  await P.page.evaluate(() => document.querySelector('.gl-x').click());
  await P.page.waitForFunction(() => __sv.simple.open, null, { timeout: 8000 }).catch(() => { });
  await P.page.evaluate(() => document.querySelectorAll('.dialog, .reward').forEach(d => d.remove()));
  // Ông Cú is there, and cheers when a new star was won since the path was last open
  r.owl = await P.page.evaluate(async () => { const owl = !!document.querySelector('.sp-owl .art'); __sv.simple.hide(); const p = __sv.heroes[0].profile; p.wins = p.wins || {}; p.wins.bunny = (p.wins.bunny || 0) + 4; __sv.simple.show(); return { owl, cheer: document.querySelector('.sp-owl').classList.contains('cheer') }; });
  // Calm mode: the landscape stands still
  r.calm = await P.page.evaluate(() => { document.body.classList.add('calm'); const a = getComputedStyle(document.querySelector('.sp-cloud')).animationName; document.body.classList.remove('calm'); return a; });
  // 25 times open and closed: no more listeners, elements or screens than before
  const cdp = await P.ctx.newCDPSession(P.page);
  const listeners = async () => { const w = await cdp.send('Runtime.evaluate', { expression: 'window' }), d = await cdp.send('Runtime.evaluate', { expression: 'document' }); return (await cdp.send('DOMDebugger.getEventListeners', { objectId: w.result.objectId })).listeners.length + (await cdp.send('DOMDebugger.getEventListeners', { objectId: d.result.objectId })).listeners.length; };
  const nodes = () => P.page.evaluate(() => document.getElementsByTagName('*').length);
  const l0 = await listeners(), n0 = await nodes();
  for (let i = 0; i < 25; i++) await P.page.evaluate(() => { __sv.simple.hide(); __sv.simple.show(); });
  r.leak = { listeners: (await listeners()) - l0, nodes: (await nodes()) - n0, screens: await P.page.evaluate(() => document.querySelectorAll('.simple-screen').length) };
  const errs = P.errors; await P.ctx.close();
  // a big kid: the first tap shows, the second plays; ✨ on a game that came after the last look; search finds "Đập Niêu" without accents
  const B = await open(b, { w: 390, h: 844, touch: true, screen: 'simple' });
  await B.page.evaluate(() => { const p = __sv.heroes[0].profile; p.age = 'big'; p.seenActs = undefined; __sv.simple.hide(); __sv.simple.show(); p.seenActs = p.seenActs.filter(x => x !== 'game:bunny'); __sv.simple.hide(); __sv.simple.show('games'); __sv.simple.openGroup('games', 'animals'); document.querySelectorAll('.dialog').forEach(d => d.remove()); });
  r.big = await B.page.evaluate(() => ({ stops: __sv.simple.view.stops.length, newOn: [...document.querySelectorAll('.sp-stop')].filter(s => s.querySelector('.sp-new')).map(s => s.getAttribute('aria-label')), dots: document.querySelectorAll('.sp-level').length === 0 })); // stars only: no difficulty dots (owner)
  await B.page.locator('.sp-stop:not(.grp)').first().click(); await B.page.waitForTimeout(700);
  r.big.firstTap = await B.page.evaluate(() => ({ game: !!document.querySelector('.gl'), sel: !!document.querySelector('.sp-stop.sel .sp-play') }));
  await B.page.locator('.sp-stop.sel').click(); r.big.secondTap = await B.page.waitForSelector('.gl', { timeout: 10000 }).then(() => true, () => false);
  await B.page.evaluate(() => document.querySelector('.gl-x').click());
  await B.page.waitForFunction(() => __sv.simple.open, null, { timeout: 8000 }).catch(() => { });
  await B.page.evaluate(() => document.querySelectorAll('.dialog, .reward').forEach(d => d.remove()));
  await B.page.click('.sp-discover'); await B.page.fill('.sp-q', 'dap nieu'); await B.page.waitForTimeout(200);
  r.big.search = await B.page.evaluate(() => [...document.querySelectorAll('.sp-found .sp-card b')].map(b => b.textContent));
  errs.push(...B.errors); await B.ctx.close();
  ok(!r.list.missing.length && !r.list.extra.length && !r.list.badArea.length, 'activity list: ' + JSON.stringify(r.list));
  ok(r.walk.cats >= 5 && r.walk.heads === r.walk.cats && r.walk.inOrder && r.placesLast === 'asia' && !r.walk.missed.length && !r.walk.notDrawn.length && !r.walk.tooBig.length, 'under-5 path: ' + JSON.stringify(r.walk));
  ok(r.find.cards >= 18 && !r.find.search && r.music === 'music', 'discover: ' + JSON.stringify(r.find) + ' ' + r.music);
  ok(r.starts === 1, 'a double tap started the game ' + r.starts + ' times');
  ok(r.owl.owl && r.owl.cheer, 'Ông Cú: ' + JSON.stringify(r.owl));
  ok(r.calm === 'none', 'the landscape still moves in Calm mode: ' + r.calm);
  ok(r.leak.listeners <= 0 && r.leak.nodes <= 5 && r.leak.screens === 1, 'after 25 opens: ' + JSON.stringify(r.leak));
  ok(r.big.stops > 6 && r.big.dots && r.big.newOn.includes('Feed the Bunny') && r.big.newOn.length === 1 && !r.big.firstTap.game && r.big.firstTap.sel && r.big.secondTap && r.big.search.some(t => /Smash the Pot/.test(t)), 'big kid: ' + JSON.stringify(r.big));
  ok(!errs.length, errs.join(' | '));
  return `${r.list.games} games in 11 areas; under-5: ${r.walk.cats} category cards, each its own road (${r.walk.stops} stops), every one drawn, China and India last in places; Discover ${r.find.cards} areas; double tap starts once; big kid: two taps, ✨ new, search; Ông Cú cheers; still in Calm; 25 opens: +${r.leak.listeners} listeners, +${r.leak.nodes} elements`;
});

await check('gamelevel', async () => {
  // round M (owner): every game has Easy · Medium · Hard in its top bar; choosing another level starts it again at that
  // level and is remembered for that game and child; Festivals sit in the main Grown-ups settings, not under Advanced
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const r = {};
  await P.page.evaluate(() => { __sv.heroes[0].profile.age = 'big'; __sv.heroes[0].profile.difficulty = 'easy'; __sv.playGame(0, 'counting'); });
  await P.page.waitForSelector('.gl .gl-lvl', { timeout: 10000 });
  r.first = await P.page.evaluate(() => { const b = document.querySelector('.gl-lvl').getBoundingClientRect(); return { text: document.querySelector('.gl-lvl').textContent.trim(), w: b.width, h: b.height, inside: b.right <= innerWidth && b.left >= 0 }; });
  await P.page.click('.gl-lvl'); await P.page.waitForSelector('.gl-lvlpick [data-l="hard"]');
  r.choices = await P.page.evaluate(() => [...document.querySelectorAll('.gl-lvlpick [data-l]')].map(b => b.getBoundingClientRect().height >= 64 ? b.dataset.l : 'small'));
  await P.page.click('.gl-lvlpick [data-l="hard"]');
  await P.page.waitForFunction(() => { const l = document.querySelector('.gl:not(.out) .gl-lvl'); return l && /Hard/.test(l.textContent); }, null, { timeout: 10000 }).catch(() => { });
  r.after = await P.page.evaluate(() => ({ text: (document.querySelector('.gl:not(.out) .gl-lvl') || {}).textContent, saved: (__sv.heroes[0].profile.gameDiff || {}).counting, games: document.querySelectorAll('.gl:not(.out)').length }));
  await P.page.evaluate(() => document.querySelector('.gl:not(.out) .gl-x').click()); await P.page.waitForTimeout(500);
  // Festivals: in the main settings
  // Festival calendar: only a calendar; no decorations choice in the game or in Grown-ups
  r.fest = await P.page.evaluate(async () => { const U = await import('/js/ui.js'), w = t => new Promise(r => setTimeout(r, t));
    U.openGrownups(); await w(300); const inGrown = !!document.querySelector('.seg.fest, select.fest-pick'); document.querySelectorAll('.modal').forEach(m => m.remove());
    // (bug #32, owner 11 Oct) the calendar is only a calendar: nothing to visit, no decorations choice in the game
    U.openFestivals(__sv, 0); await w(300); before = !!document.querySelector('.modal select.fest-pick, .fest-hold, .fest-grown'), visit = document.querySelectorAll('.modal [data-fest]').length, rows = document.querySelectorAll('.modal .fcal-row').length;
    return { inGrown, before, visit, rows }; });
  const errs = P.errors; await P.ctx.close();
  ok(/Easy/.test(r.first.text) && r.first.h >= 44 && r.first.inside && r.choices.join() === 'easy,medium,hard' && /Hard/.test(r.after.text || '') && r.after.saved === 'hard' && r.after.games === 1 && !r.fest.inGrown && !r.fest.before && r.fest.visit === 0 && r.fest.rows > 0 && !errs.length, JSON.stringify({ r, errs }));
  return 'Easy · Medium · Hard in the game bar (44 px, on screen at 390 px); Hard starts it again at Hard and is remembered; the festival calendar is only a calendar (nothing to visit, no decorations choice)';
});

await check('quiet', async () => {
  // round M (owner: sound kept playing after leaving the game, until it was killed): when the game goes to the
  // background (another app, the lock screen) the audio engine sleeps, music stops scheduling and videos pause; when
  // it comes back, sound comes back
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  await P.page.mouse.click(200, 400); // a tap: iPhone-style, sound is allowed after one
  const r = await P.page.evaluate(async () => {
    const A = await import('/js/audio.js'), S = await import('/js/state.js'), wait = t => new Promise(res => setTimeout(res, t));
    S.settings.music = true; S.settings.sound = true; A.Music.stop(); A.Music.play('field'); const ctx = A.ac(); await ctx.resume().catch(() => { }); await wait(400);
    const v = document.createElement('video'); document.body.appendChild(v);
    const before = { state: ctx.state, next: A.Music.next };
    const hide = h => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => h ? 'hidden' : 'visible' }); document.dispatchEvent(new Event('visibilitychange')); };
    hide(true); await wait(500); const n1 = A.Music.next; A.SFX.tap && A.SFX.tap(); await wait(600);
    const away = { state: ctx.state, scheduling: A.Music.next !== n1, videoPaused: v.paused };
    hide(false); await wait(500);
    const back = { state: ctx.state }; delete document.hidden; delete document.visibilityState; v.remove(); A.Music.stop();
    return { before, away, back };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.before.state === 'running' && r.away.state === 'suspended' && !r.away.scheduling && r.away.videoPaused && r.back.state === 'running' && !errs.length, JSON.stringify({ r, errs }));
  return 'in the background: audio asleep, no music scheduled, videos paused (a sound effect does not wake it); back on screen: sound again';
});

await check('rain', async () => {
  // bug #39 (owner: the rain was a repeating noise): rain is one soft steady hush that fades in and out with the
  // weather, and it never carries on over a game, a story or the Simple screen (the valley rests behind them)
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  await P.page.mouse.click(200, 400);
  const r = await P.page.evaluate(async () => {
    const A = await import('/js/audio.js'), S = await import('/js/state.js'), w = t => new Promise(res => setTimeout(res, t)), G = __sv, out = {};
    S.settings.sound = true; S.settings.noRain = false; await A.ac().resume().catch(() => { });
    out.dry = A.Rain.on;
    G.weather.start(); await w(1500); out.raining = A.Rain.on;
    G.playGame(0, 'caro', 'replay'); await w(1500); out.game = A.Rain.on; out.gameOpen = !!document.querySelector('.gl');
    document.querySelector('.gl .gl-x')?.click(); await w(1500); out.back = A.Rain.on;
    S.settings.sound = false; await w(800); out.soundOff = A.Rain.on; S.settings.sound = true; await w(800);
    G.weather.stop(); await w(1500); out.stopped = A.Rain.on;
    return out;
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.dry && r.raining && r.gameOpen && !r.game && r.back && !r.soundOff && !r.stopped && !errs.length, JSON.stringify({ r, errs }));
  return 'rain hush on while it rains, off under a game and back after it, off with Sound effects off, off when the rain stops';
});

await check('songs', async () => {
  // round N (owner): Trung Thu music at Trung Thu (and Tết at Tết…), Vietnamese tunes in the Vietnam areas, a 🎵 Songs
  // page (from the Simple screen's Music group and from Settings) with hát ru words, a night look and a sleep timer;
  // the family's Studio recordings come first; plus the reef stays in the lake and the star counter clears the top bar
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  await P.page.mouse.click(200, 420);
  const r = await P.page.evaluate(async () => {
    const S = await import('/js/state.js'), A = await import('/js/audio.js'), W = await import('/js/world.js'), C = await import('/js/content/songs.js'), CU = await import('/js/custom.js'), w = t => new Promise(res => setTimeout(res, t)), G = __sv, out = {};
    S.settings.music = true; A.Music.stop();
    // a festival: its own songs
    S.settings.festival = 'midautumn'; G.festivals.rebuild(); await w(800); out.trungthu = A.Music.key;
    S.settings.festival = 'none'; G.festivals.rebuild();
    // the Vietnam village: Vietnamese tunes
    const h = G.heroes[0]; h.pos.x = W.VILLAGE.x; h.pos.z = W.VILLAGE.z + 4; h.pos.y = W.heightAt(h.pos.x, h.pos.z); await w(1200); out.region = G.regionOf[0]; out.village = A.Music.key;
    // the family's recording comes first for its tags
    CU.CUSTOM.music = [{ id: 'bairu', file: 'content/music/bairu.mp3', en: 'Our lullaby', vi: 'Bài ru của mẹ', tags: ['lullaby', 'midautumn'] }];
    out.famFest = C.songsFor('midautumn'); out.famVn = C.songsFor('vn');
    // the 🎵 Songs page: lullabies with words, night, sleep timer; the valley leaves the music alone while it is open
    const pg = G.openSongs('lullaby'); await w(300);
    document.querySelector('.songs [data-s="ru1"]').click(); await w(300);
    out.page = { night: document.querySelector('.songs').classList.contains('night'), words: document.querySelectorAll('.sg-words p').length, key: A.Music.key, pinned: A.Music.pinned, family: !!document.querySelector('.songs [data-g="family"]'), timer: document.querySelectorAll('.sg-sleep [data-t]').length };
    await w(1200); out.stillLullaby = A.Music.key;
    A.Music.fadeOut(.3); await w(600); out.faded = A.Music.key;
    pg.close(); out.closed = { page: !!document.querySelector('.songs'), pinned: A.Music.pinned };
    delete CU.CUSTOM.music;
    // the reef: inside the lake, on ground under the water
    out.reef = (G.world.waterSites || []).map(s => ({ id: s.id, inside: Math.hypot(s.x - W.LAKE.x, s.z - W.LAKE.z) + s.r < W.LAKE.r - 2, under: W.heightAt(s.x, s.z) < W.WATER - .3 }));
    return out;
  });
  // the Simple screen's Music group starts with 🎵 Songs; Settings has a Songs card
  await P.page.evaluate(() => { __sv.simple.show(); __sv.simple.openGroup('games', 'music'); document.querySelectorAll('.dialog').forEach(d => d.remove()); });
  r.simple = await P.page.evaluate(async () => { const first = __sv.simple.view.stops.find(x => x === 'songs'); [...document.querySelectorAll('.sp-stop')].find(b => /^(Songs|Bài hát)$/.test(b.getAttribute('aria-label'))).click(); await new Promise(res => setTimeout(res, 400)); const open = !!document.querySelector('.songs'); document.querySelector('.songs .sg-x').click(); __sv.simple.hide(); return { first, open }; });
  // the star counter sits under the game's top bar (it covered 📺 on notched phones)
  await P.page.evaluate(() => { __sv.playGame(0, 'counting'); }); await P.page.waitForSelector('.gl .starbox'); // (not waiting for the game to end)
  r.star = await P.page.evaluate(() => { const s = document.querySelector('.gl .starbox').getBoundingClientRect(), hb = [...document.querySelectorAll('.gl-head button')].map(b => b.getBoundingClientRect()); return { clear: hb.every(b => s.top >= b.bottom - 1 || s.bottom <= b.top || s.right <= b.left || s.left >= b.right) }; });
  const errs = P.errors; await P.ctx.close();
  ok(['trungthu1', 'trungthu2'].includes(r.trungthu), 'Trung Thu music: ' + r.trungthu);
  ok(r.region === 'village' && ['village', 'village2', 'vn_sang', 'vn_dong', 'folk'].includes(r.village), 'Vietnam area music: ' + JSON.stringify([r.region, r.village]));
  ok(r.famFest.join() === 'file:bairu' && r.famVn.includes('vn_sang'), 'family recordings first: ' + JSON.stringify([r.famFest, r.famVn]));
  ok(r.page.night && r.page.words >= 4 && r.page.key === 'ru1' && r.page.pinned && r.page.family && r.page.timer === 3 && r.stillLullaby === 'ru1' && r.faded === null && !r.closed.page && !r.closed.pinned, 'songs page: ' + JSON.stringify(r.page) + ' ' + r.stillLullaby + ' ' + r.faded + ' ' + JSON.stringify(r.closed));
  ok(r.simple.first === 'songs' && r.simple.open, 'Simple screen songs: ' + JSON.stringify(r.simple));
  ok(r.reef.length === 2 && r.reef.every(x => x.inside && x.under), 'water landmarks: ' + JSON.stringify(r.reef));
  ok(r.star.clear && !errs.length, JSON.stringify({ star: r.star, errs }));
  return `Trung Thu → ${r.trungthu}; Lotus Village → ${r.village}; family recordings first; Songs page: lullaby words, night, sleep timer, valley music left alone; Simple screen Music group starts with Songs; reef and Hạ Long inside the lake; star counter clear of the top bar`;
});

await check('realphotos', async () => {
  // (round R privacy, 9 Oct, owner: "landmark photos served from our own site") the photos are only the ones listed in
  // photos/index.json (paths inside photos/), with their credit as words; the game never asks Wikipedia or Wikimedia; a
  // place with none says the photos are on their way; 360° (Google) opens only after a grown-up's press and hold.
  // (round O) 360° opens on top of the photos.
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const outside = []; P.page.on('request', q => { if (/wikipedia\.org|wikimedia\.org|openverse/.test(q.url())) outside.push(q.url()); });
  await P.page.route('**/photos/index.json*', r => r.fulfill({ json: { 'en-saigon-central-post-office': [
    { src: 'photos/en-saigon-central-post-office/1.jpg', file: 'File:Lead photo.jpg', caption: 'The post office', credit: 'Photographer · CC BY 2.0 · Wikipedia' },
    { src: 'photos/en-saigon-central-post-office/2.jpg', file: 'File:Other view.jpg', caption: 'Inside the hall', credit: 'Someone · CC BY-SA 4.0' },
    { src: 'https://upload.wikimedia.org/a/elsewhere.jpg', file: 'File:Elsewhere.jpg', caption: 'not ours', credit: 'x' }] } }));
  await P.page.route('**/photos/en-saigon-central-post-office/*.jpg', r => r.fulfill({ body: png, contentType: 'image/png' }));
  await P.page.route('https://maps.google.com/**', r => r.fulfill({ body: '<html><body>map</body></html>', contentType: 'text/html' }));
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/realworld.js'), wait = ms => new Promise(x => setTimeout(x, ms));
    W.openPhotos('Saigon Central Post Office', W.REAL.postoffice[0], { id: 'postoffice' });
    for (let k = 0; k < 40 && !document.querySelector('.rv-img'); k++) await wait(150);
    const v = document.querySelector('.realview'), cap = v.querySelector('.rv-credit') ? v.querySelector('.rv-credit').textContent : '', none = v.classList.contains('none'), dots = v.querySelectorAll('.rv-dots i').length;
    const srcs = [...v.querySelectorAll('.rv-img')].map(i => i.getAttribute('src')), links = v.querySelectorAll('.rv-cap a').length;
    // (10 Oct, owner) Use the internet off: a grown-up presses and holds first; on: the map opens straight away
    const S = await import('/js/state.js'); S.settings.online = false;
    v.querySelector('.rv-360').click(); await wait(400);
    const gate = document.querySelector('.modal.rvgate'), early = !!document.querySelector('.rvmap iframe'), says = gate ? /Google/.test(gate.textContent) : false;
    const btn = gate.querySelector('.rv-ok'), tap = Math.round(btn.getBoundingClientRect().height);
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(1900);
    const map = document.querySelector('.modal.rvmap:not(.rvgate)'), q = map.querySelector('.card').getBoundingClientRect(), top = document.elementFromPoint(q.left + q.width / 2, q.top + 30);
    const opened = !!map.querySelector('iframe');
    document.querySelectorAll('.modal').forEach(e => e.remove());
    S.settings.online = true; v.querySelector('.rv-360').click(); await wait(400);
    const direct = !document.querySelector('.modal.rvgate') && !!document.querySelector('.rvmap iframe');
    document.querySelectorAll('.realview, .modal').forEach(e => e.remove());
    W.openPhotos('Uluru', W.REAL.uluru[0], { id: 'uluru' }); for (let k = 0; k < 30 && !document.querySelector('.realview.none'); k++) await wait(100);
    const empty = !!document.querySelector('.realview.none');
    return { none, dots, cap, srcs, links, gate: !!gate, early, says, tap, opened, onTop: !!(top && top.closest('.rvmap')), empty, direct };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.none && r.dots === 2 && /Photographer/.test(r.cap) && r.srcs.every(x => /^photos\//.test(x)) && !r.links && r.gate && !r.early && r.says && r.tap >= 44 && r.opened && r.onTop && r.direct && r.empty && !outside.length && !errs.length, JSON.stringify(Object.assign(r, { outside, errs })));
  return `2 photos from photos/index.json (a web address left out), credit “${r.cap}” as words; nothing asked of Wikipedia or Wikimedia; a place with none says they are on their way; 360° asks a grown-up (says it opens Google) while Use the internet is off, then opens on top of the photos; with it on, opens straight away`;
});

await check('firstplayer', async () => {
  // round P (owner): no ready-made characters; a new device asks the child to make their own first (name, look, photo)
  const P = await open(b, { w: 390, h: 844, touch: true, lang: 'vi', play: false, pre: () => { localStorage.setItem('sv2_profiles', '[]'); } });
  await P.page.click('.screen.title .press', { force: true }); await P.page.waitForSelector('.screen.who');
  const before = await P.page.evaluate(() => ({ first: !!document.querySelector('.who-card.first .make'), picks: document.querySelectorAll('.pick[data-id]').length }));
  await P.page.click('.who .make'); await P.page.waitForSelector('.modal.editor #nm');
  await P.page.fill('#nm', 'Mai'); await P.page.evaluate(() => document.querySelector('#eSave').click());
  await P.page.waitForSelector('.who .go:not([disabled])', { timeout: 5000 });
  await P.page.click('.who .go'); await P.page.waitForFunction(() => window.__sv && window.__sv.heroes.length > 0);
  const r = await P.page.evaluate(() => ({ name: __sv.heroes[0].profile.name, saved: JSON.parse(localStorage.getItem('sv2_profiles')).map(p => p.name) }));
  const errs = P.errors; await P.ctx.close();
  ok(before.first && !before.picks && r.name === 'Mai' && r.saved.length === 1 && r.saved[0] === 'Mai' && !errs.length, JSON.stringify({ before, r, errs }));
  return 'a new device shows “Make my character” and no ready-made players; the child made “Mai” and plays as Mai';
});

await check('grownupsui', async () => {
  // round P (owner): on a phone the action button sits on the right above Jump and Run (the left half is the joystick's)
  // and the spoken words near the top; Grown-ups in groups that open and close, no credits editor; (round R privacy, 9 Oct)
  // the privacy notice first and no voice engine or voice key
  const P = await open(b, { w: 390, h: 844, touch: true, lang: 'vi' }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const wait = ms => new Promise(x => setTimeout(x, ms)), h = __sv.huds[0];
    __sv.paused = true; h.setAction({ label: () => 'Nhặt Lá dong', icon: '🌿' }); await wait(300); // (paused: the valley's own loop would hide it again)
    const a = h.q('.act').getBoundingClientRect(), mv = h.q('.hud-br').getBoundingClientRect();
    const { say } = await import('/js/voice.js'); say('A test line.', 'Một câu thử.'); await wait(400);
    const cap = document.querySelector('.caption'), c = cap ? cap.getBoundingClientRect() : null;
    const { openGrownups } = await import('/js/ui.js'); openGrownups(); await wait(400);
    const secs = [...document.querySelectorAll('.grownups details.gsec')].map(d => d.dataset.sec), open = [...document.querySelectorAll('.grownups details.gsec[open]')].map(d => d.dataset.sec);
    // (round R privacy, 9 Oct) no voice engine or voice key any more; the privacy notice is its own small block at the top
    const eng = document.querySelector('.grownups details.xeng, .grownups #xKey, .grownups #xTts, .grownups #xClone'), credits = !!document.querySelector('.grownups #crName');
    const priv = document.querySelector('.grownups details.g-priv'), firstSec = document.querySelector('.grownups details.gsec');
    return { act: [a.left, a.top, a.right, a.bottom].map(Math.round), moves: Math.round(mv.top), w: innerWidth, cap: c ? [Math.round(c.top), Math.round(c.bottom)] : null, secs, open, engine: !!eng, privacy: priv ? priv.querySelectorAll('li').length : 0, privFirst: !!(priv && firstSec && priv.compareDocumentPosition(firstSec) & Node.DOCUMENT_POSITION_FOLLOWING), privTap: priv ? Math.round(priv.querySelector('summary').getBoundingClientRect().height) : 0, credits };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.act[0] > r.w / 2 - 40 && r.act[3] <= r.moves + 2 && r.cap && r.cap[0] < 260, 'phone layout: ' + JSON.stringify(r));
  ok(r.secs.length >= 8 && r.secs.includes('sound') && r.secs.includes('online') && r.open.join() === 'players' && !r.engine && r.privacy === 6 && r.privFirst && r.privTap >= 44 && !r.credits && !errs.length, 'grown-ups: ' + JSON.stringify(Object.assign(r, { errs })));
  return `action button on the right above Jump/Run (${r.act.join(',')}), words at the top (${r.cap.join('–')} px); Grown-ups: ${r.secs.length} groups (${r.secs.join(', ')}), the privacy notice first (${r.privacy} lines), no voice engine or voice key, no credits editor`;
});

await check('playhub', async () => {
  // round O (owner): the pink button is "Play" with a 🎵 Songs tab (songs belong with the games, not in Settings);
  // battery: on a phone the valley is drawn 30 times a second, and not at all behind the Simple screen or the Songs page
  const P = await open(b, { w: 390, h: 844, touch: true, lang: 'vi' }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, wait = ms => new Promise(x => setTimeout(x, ms)), R = G.renderer, orig = R.render; let n = 0; R.render = function (...a) { n++; return orig.apply(this, a); };
    const count = async ms => { n = 0; await wait(ms); return n; };
    const out = { label: document.querySelector('.dk.games small').textContent, perSec: await count(2000) / 2 };
    G.openQuick(0); await wait(300); out.settingsSongs = !!document.querySelector('#qSongs'); document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
    G.openGamesHub(0); await wait(300); out.title = document.querySelector('.hub h2').textContent;
    document.querySelector('.hubtabs [data-tab="songs"]').click(); await wait(300);
    out.groups = [...document.querySelectorAll('[data-songs]')].map(b => b.dataset.songs);
    document.querySelector('[data-songs="lullaby"]').click(); await wait(600);
    out.songsPage = !!document.querySelector('.songs.night'); out.songsDraws = await count(1500);
    document.querySelector('.songs .sg-x').click(); await wait(300);
    G.simple.show(); await wait(400); out.simpleDraws = await count(1500); G.simple.hide(); await wait(300);
    out.backDraws = await count(1000);
    R.render = orig; return out;
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.label === 'Vui chơi' && /Vui chơi/.test(r.title) && !r.settingsSongs && r.groups.includes('lullaby') && r.groups.length >= 4 && r.songsPage, 'play hub: ' + JSON.stringify(r));
  ok(r.perSec <= 34 && r.songsDraws === 0 && r.simpleDraws === 0 && r.backDraws > 0 && !errs.length, 'battery: ' + JSON.stringify(Object.assign(r, { errs })));
  return `“${r.label}” with 🎵 ${r.groups.length} song groups (lullabies open the night page), none in Settings; phone draws ${r.perSec}/s, none behind the Songs page or the Simple screen`;
});

await check('a11y', async () => {
  // accessibility rules (round I, ARCHITECTURE §9.6): UI-004 touch targets, A11Y-001 reduced motion, A11Y-002 readable
  // captions, A11Y-004 under-5s hear every game's instruction (A11Y-003 simple paths: the "simple" check)
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const small = (min, sel = 'button, a[href], [role=button], input[type=checkbox], select') => P.page.evaluate(([min, sel]) => {
    const out = [];
    for (const e of document.querySelectorAll(sel)) {
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      if (!(r.width > 0 && r.height > 0) || s.visibility === 'hidden' || e.closest('[hidden]') || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue;
      if (Math.min(r.width, r.height) < min - .5) out.push(((e.className && String(e.className)) || e.tagName).split(' ')[0] + ':' + e.textContent.trim().slice(0, 10) + '=' + Math.round(Math.min(r.width, r.height)));
    }
    return out;
  }, [min, sel]);
  const bad = {};
  const at = async (name, fn, min = 44, sel) => { await fn(); await P.page.waitForTimeout(500); const s = await small(min, sel); if (s.length) bad[name] = s.slice(0, 6); await clear(P.page); };
  await at('valley', async () => { });
  for (const t of ['map', 'bag', 'log', 'album', 'passport', 'games', 'cam', 'friend']) await at('pad-' + t, () => P.page.evaluate(t => __sv.openPad(0, t), t));
  await at('games hub', () => P.page.evaluate(() => __sv.openGamesHub(0)));
  await at('quick settings', () => P.page.evaluate(() => __sv.openQuick(0)));
  // under 5: the answers in a game are at least 64 px; the Simple screen's pictures and bar too
  await P.page.evaluate(async () => { const F = await import('/js/games/frame.js'); window.__g = F.openGame('colors', { players: [__sv.heroes[0].profile], level: 1, little: true }); });
  await P.page.waitForTimeout(1200); { const s = await small(64, '.gl .choice'); if (s.length) bad['little answers'] = s; }
  await P.page.evaluate(() => document.querySelector('.gl-x').click()); await P.page.waitForTimeout(500); await clear(P.page);
  await at('simple screen', () => P.page.evaluate(() => __sv.simple.show()), 64, '.sp-pic, .sp-tabs button, .sp-again, .sp-grown');
  await P.page.evaluate(() => __sv.simple.hide());
  // readable captions: shown even with the voice off, ≥ 16 px, contrast ≥ 4.5 : 1 (on white behind, the worst case), ≥ 2.5 s
  const cap = await P.page.evaluate(async () => {
    const V = await import('/js/voice.js'); V.say('Look at the pretty kite!', 'Nhìn con diều đẹp chưa kìa!');
    await new Promise(r => setTimeout(r, 2400)); const c = document.querySelector('.caption'); if (!c) return null;
    const s = getComputedStyle(c), rgb = x => x.match(/[\d.]+/g).map(Number), fg = rgb(s.color), bg = rgb(s.backgroundColor), a = bg[3] ?? 1;
    const mix = bg.slice(0, 3).map((v, k) => v * a + 255 * (1 - a)), L = c3 => { const [r, g, b] = c3.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
    const l1 = L(fg.slice(0, 3)), l2 = L(mix);
    return { shown: c.classList.contains('show'), px: parseFloat(s.fontSize), contrast: +((Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05)).toFixed(1) };
  });
  // reduced motion: the device's "Reduce motion" turns on Calm mode and no animation runs for ever
  await P.page.emulateMedia({ reducedMotion: 'reduce' }); await P.page.waitForTimeout(300);
  await P.page.evaluate(() => __sv.simple.show()); await P.page.waitForTimeout(600);
  const motion = await P.page.evaluate(() => ({ calm: document.body.classList.contains('calm'), forever: document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations === Infinity).map(a => (a.animationName || '') + '@' + ((a.effect.target && a.effect.target.className && String(a.effect.target.className).split(' ')[0]) || '')).slice(0, 8) }));
  await P.page.evaluate(() => __sv.simple.hide()); await P.page.emulateMedia({ reducedMotion: 'no-preference' });
  // under 5: every game says what to do when it opens
  const quiet = await P.page.evaluate(async () => {
    const F = await import('/js/games/frame.js'), V = await import('/js/voice.js'), out = [];
    let heard = 0; V.spoken.push(() => { heard++; });
    for (const id of Object.keys(F.GAMES)) {
      heard = 0; const g = F.openGame(id, { players: [__sv.heroes[0].profile], level: 1, little: true });
      for (let k = 0; k < 30 && !heard; k++) await new Promise(r => setTimeout(r, 100));
      if (!heard) out.push(id);
      const x = document.querySelector('.gl-x'); if (x) x.click(); await Promise.race([g, new Promise(r => setTimeout(r, 1500))]);
      document.querySelectorAll('.gl, .modal, .dialog, .reward').forEach(e => e.remove());
    }
    return { n: Object.keys(F.GAMES).length, quiet: out };
  });
  const errs = P.errors.filter(e => !/getUserMedia|NotAllowed/.test(e)); await P.ctx.close();
  ok(!Object.keys(bad).length && cap && cap.shown && cap.px >= 16 && cap.contrast >= 4.5 && motion.calm && !motion.forever.length && !quiet.quiet.length && !errs.length,
    JSON.stringify({ bad, cap, motion, quiet: quiet.quiet, errs: errs.slice(0, 5) }));
  return `touch targets ≥ 44 px on 12 screens, ≥ 64 px for under-5 answers and the Simple screen; captions ${cap.px} px, contrast ${cap.contrast}:1, still up at 2.4 s; Reduce motion → Calm, nothing loops; all ${quiet.n} games speak their instruction to an under-5`;
});

await check('unit', async () => {
  // Node unit tests (architecture §10): the L0 core (ids, events, seeded random, geometry), node --test tests/unit
  const { execFileSync } = await import('child_process');
  let out = ''; try { out = execFileSync(process.execPath, ['--test', ...fs.readdirSync('unit').filter(f => f.endsWith('.test.mjs')).map(f => 'unit/' + f)], { encoding: 'utf8' }); } catch (e) { ok(false, ((e.stdout || '') + '').split('\n').filter(l => /^not ok|Error/.test(l)).slice(0, 6).join(' | ')); }
  const pass = (out.match(/^# pass (\d+)/m) || [])[1], fail = (out.match(/^# fail (\d+)/m) || [])[1];
  ok(+fail === 0 && +pass > 0, out.slice(-400));
  return `${pass} unit tests passed`;
});

await check('events', async () => {
  // architecture step 1: the event bus carries what happened, by id, alongside today's calls; the places sticker book
  // (js/placebook.js) only listens to it: walking into Lotus Village for the first time gives its sticker once
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], W = await import('/js/world.js'), I = await import('/js/i18n.js'), S = await import('/js/state.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    const seen = [], stickers = []; G.events.on('*', (p, n) => { seen.push(n); if (n === 'StickerEarned') stickers.push(p.placeId); });
    delete (h.profile.placeStickers || {}).village; delete (h.profile.visited || {}).village;
    h.place(W.VILLAGE.x, W.VILLAGE.z + 6);
    for (let k = 0; k < 8; k++) { await wait(300); document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove()); G.paused = false; }
    const got = !!(h.profile.placeStickers || {}).village;
    h.place(W.VILLAGE.x - 40, W.VILLAGE.z + 40); await wait(900); h.place(W.VILLAGE.x, W.VILLAGE.z + 6); await wait(900);
    const earned = stickers.filter(x => x === 'place:village').length;
    G.playGame(0, 'colors', 'replay'); await wait(700); document.querySelector('.gl .gl-x')?.click(); await wait(500);
    S.settings.lang = 'vi'; I.applyLang(); S.settings.lang = 'en'; I.applyLang();
    // the album page shows the book
    G.openPad && G.openPad(0); await wait(300);
    return { got, earned, seen: [...new Set(seen)], recent: G.events.recent().slice(-3).map(e => e.name), ids: G.events.recent().filter(e => e.name === 'ActivityStarted').map(e => e.payload.defId) };
  });
  const errs = P.errors; await P.ctx.close();
  const need = ['PlayerEnteredVillage', 'PlayerLeftVillage', 'StickerEarned', 'ActivityStarted', 'ActivityAbandoned', 'LanguageChanged'];
  ok(r.got && r.earned === 1 && need.every(n => r.seen.includes(n)) && r.ids.includes('game:colors') && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `events seen: ${need.join(', ')}; Lotus Village sticker given once (a second visit gives none)`;
});

await check('postcards', async () => {
  // Studio → Family album → postcards (js/familycards.js): a family photo for Lotus Village arrives when the child walks
  // in (once), shows in the album page, and opens big; Studio's place list is the game's sticker-book place list
  const P = await open(b, { w: 900, h: 640, play: false });
  const jpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  await P.page.route('**/content/custom.json*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ album: [{ id: 'f1', photo: 'content/album/f1.jpg', en: 'Grandma at the market', vi: 'Bà ở chợ', place: 'village' }, { id: 'f2', photo: 'content/album/f2.jpg', en: 'Our garden', vi: 'Vườn nhà mình', place: 'lake' }, { id: 'bad', photo: 'https://example.com/x.jpg', place: 'village' }] }) }));
  await P.page.route('**/content/album/*.jpg', r => r.fulfill({ contentType: 'image/jpeg', body: jpg }));
  await P.page.reload(); await start(P.page); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], W = await import('/js/world.js'), F = await import('/js/familycards.js'), C = await import('/js/custom.js'), PB = await import('/js/placebook.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    const got = []; G.events.on('PostcardEarned', p => got.push(p.postcardId));
    h.profile.familyCards = {}; delete (h.profile.visited || {}).village;
    if (G.regionOf[0] === 'village') { h.place(W.HOME.x, W.HOME.z); await wait(900); }
    h.place(W.VILLAGE.x, W.VILLAGE.z + 6); for (let k = 0; k < 6; k++) { await wait(300); document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove()); G.paused = false; }
    h.place(W.HOME.x, W.HOME.z); await wait(900); h.place(W.VILLAGE.x, W.VILLAGE.z + 6); await wait(900);
    const box = document.createElement('div'); box.innerHTML = F.familyCardsHTML(h.profile); document.body.appendChild(box);
    const shown = { on: box.querySelectorAll('.famcard.on').length, waiting: box.querySelectorAll('.famcard:not(.on)').length };
    box.querySelector('[data-fam]') && F.bindFamilyCards(box, () => { }); box.querySelector('[data-fam]')?.click(); await wait(300);
    const big = document.querySelector('.famview img'), loaded = !!(big && big.complete && big.naturalWidth > 0); document.querySelector('.famview')?.click(); box.remove();
    const studio = await (await fetch('/studio/ui/app.js')).text(), ids = [...studio.slice(studio.indexOf('const ALBUM_PLACES')).split('];')[0].matchAll(/\['([a-z]+)'/g)].map(m => m[1]);
    return { got, shown, loaded, valid: C.customAlbum().length, studioSame: ids.slice().sort().join() === PB.PLACES.map(x => x.id).sort().join(), ids: ids.length };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.got.length === 1 && r.got[0] === 'postcard:family/f1' && r.shown.on === 1 && r.shown.waiting === 1 && r.loaded && r.valid === 2 && r.studioSame && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `a family photo for Lotus Village arrived once as a postcard, shows in the album and opens big; a photo from outside the game folder is ignored; Studio offers the same ${r.ids} places`;
});

await check('familyphotos', async () => {
  // (round R privacy, 9 Oct) family photos are family-only: custom.json names them family:<name>; without the family code
  // the game shows none (drawn faces stay); with it they come from api/family/<name> (the code in x-family-code), are kept
  // in the "sv-family" cache for offline days, and a code the website no longer takes clears them
  const P = await open(b, { w: 900, h: 640, play: false }), NAME = 'Abcdefghijklmnopqrstuvwx', CODE = 'ABCDEFGHJKMN';
  const jpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  let asked = [], good = CODE;
  await P.page.route('**/content/custom.json*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ album: [{ id: 'f1', photo: 'family:' + NAME, en: 'Grandma', vi: 'Bà', place: 'village' }], faces: { 'Bà Năm': { photo: 'family:' + NAME, skin: '#f0c0a0' } } }) }));
  await P.page.route('**/api/family/*', r => { const c = r.request().headers()['x-family-code'] || ''; asked.push(c); return c === good ? r.fulfill({ contentType: 'image/jpeg', headers: { 'Cache-Control': 'private, no-store' }, body: jpg }) : r.fulfill({ status: 401, body: 'no' }); });
  await P.page.reload(); await start(P.page); await clear(P.page);
  const r1 = await P.page.evaluate(async () => { const C = await import('/js/custom.js'); return { album: C.customAlbum().length, face: !!C.customFace('Bà Năm') }; });
  const r2 = await P.page.evaluate(async code => { const C = await import('/js/custom.js'); const res = await C.setFamilyCode(code); const c = await caches.open('sv-family'), kept = (await c.keys()).length, swHas = (await Promise.all((await caches.keys()).filter(k => k !== 'sv-family').map(async k => (await (await caches.open(k)).keys()).some(q => /api\/family|__family/.test(q.url))))).some(Boolean);
    return { res, album: C.customAlbum().length, photo: (C.customAlbum()[0] || {}).photo || '', face: !!C.customFace('Bà Năm'), kept, swHas }; }, CODE.toLowerCase().replace(/(.{4})/g, '$1-'));
  good = 'SOMETHINGNEW';
  const r3 = await P.page.evaluate(async () => { const C = await import('/js/custom.js'); const res = await C.refreshFamilyPhotos({ all: true }); return { res, album: C.customAlbum().length, caches: (await caches.keys()).includes('sv-family') }; });
  const errs = P.errors; await P.ctx.close();
  ok(r1.album === 0 && !r1.face && r2.res.ok && r2.album === 1 && /^blob:/.test(r2.photo) && r2.face && r2.kept === 1 && !r2.swHas && asked.includes(CODE) && r3.res.bad && r3.album === 0 && !r3.caches && !errs.length, JSON.stringify({ r1, r2, r3, asked, errs }));
  return 'no code: no family photos; with the code: fetched with x-family-code, kept in sv-family (never the game cache), a changed code clears them';
});

await check('myhouse', async () => {
  // decorate your house (js/myhouse.js): the farmhouse door leads into the child's own room with 8 spots; a free
  // teddy goes on the floor, a clock costs 12 coins (refused with 5, bought with 50), a family postcard can hang on a
  // wall; it is kept per child, still there after leaving and coming back, and each change says "HomeDecorated"
  const P = await open(b, { w: 900, h: 640, play: false });
  const jpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  await P.page.route('**/content/custom.json*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ album: [{ id: 'f1', photo: 'content/album/f1.jpg', en: 'Grandma', vi: 'Bà', place: 'village' }] }) }));
  await P.page.route('**/content/album/*.jpg', r => r.fulfill({ contentType: 'image/jpeg', body: jpg }));
  await P.page.reload(); await start(P.page); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], S = await import('/js/state.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    const ev = []; G.events.on('HomeDecorated', p => ev.push(p.item));
    h.profile.homeDeco = {}; h.profile.familyCards = { f1: 1 }; h.profile.houseGuideSeen = true;   // (the first-visit guide has its own check: houseguide)
    const doorIt = G.interactables.find(i => i.id === 'myhouse_door'); doorIt.act(h, G); await wait(1600);
    const inside = !!h.indoors && h.indoors.mine, spots = G.interactables.filter(i => /^deco_/.test(i.id)).length;
    const pickIn = async (spot, key) => { G.interactables.find(i => i.id === 'deco_' + spot).act(h, G); await wait(300); const b = document.querySelector(`.decor [data-k="${key}"]`); const had = !!b; b && b.click(); await wait(300); document.querySelector('.decor .x')?.click(); await wait(200); return had; };
    await pickIn(0, 'teddy');
    S.farm.coins = 5; await pickIn(1, 'clock'); const refused = !h.profile.homeDeco[1] && S.farm.coins === 5;
    S.farm.coins = 50; await pickIn(1, 'clock'); const bought = h.profile.homeDeco[1] === 'clock' && S.farm.coins === 38;
    const cardOnWall = await pickIn(4, 'card:f1'), cardOnFloor = await (async () => { G.interactables.find(i => i.id === 'deco_2').act(h, G); await wait(300); const x = !!document.querySelector('.decor [data-k="card:f1"]'); document.querySelector('.decor .x')?.click(); await wait(200); return x; })();
    G.homes.leave(h); await wait(1400); const out = !h.indoors;
    doorIt.act(h, G); await wait(1600); const kept = JSON.stringify(h.profile.homeDeco); G.homes.leave(h); await wait(1400);
    return { inside, spots, refused, bought, cardOnWall, cardOnFloor, out, kept, ev, paused: G.paused };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.inside && r.spots === 8 && r.refused && r.bought && r.cardOnWall && !r.cardOnFloor && r.out && r.kept === '{"0":"teddy","1":"clock","4":"card:f1"}' && r.ev.join() === 'decor:teddy,decor:clock,postcard:family/f1' && !r.paused && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return '8 spots; a free teddy, a 12-coin clock (refused with 5, bought with 50), grandma\'s postcard on a wall (not on the floor); all still there after going out and back in';
});

await check('houseguide', async () => {
  // (Round U item 11) the first time a child walks into their own house, a guide says how to decorate (sparkles, coins,
  // family photos, change or take away), in the chosen language; it is not shown again, and the ❓ sign in the room repeats it
  const P = await open(b, { w: 900, h: 640 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], wait = ms => new Promise(r => setTimeout(r, ms)), lines = [];
    const tapThrough = async () => { for (let i = 0; i < 8; i++) { const d = document.querySelector('.dialog:not(.out)'); if (!d) break; lines.push(d.querySelector('.dtext').textContent); d.click(); await wait(250); } };
    delete h.profile.houseGuideSeen;
    const doorIt = G.interactables.find(i => i.id === 'myhouse_door'); doorIt.act(h, G); await wait(1700);
    const first = !!document.querySelector('.dialog:not(.out)'); await tapThrough();
    const n1 = lines.length, seen = h.profile.houseGuideSeen === true, unpaused = !G.paused;
    const help = G.interactables.find(i => i.id === 'house_help'); help && help.act(h, G); await wait(400);
    const again = !!document.querySelector('.dialog:not(.out)'); await tapThrough();
    G.homes.leave(h); await wait(1400);
    doorIt.act(h, G); await wait(1700); const quiet = !document.querySelector('.dialog:not(.out)'); G.homes.leave(h); await wait(1400);
    return { first, n1, seen, unpaused, help: !!help, again, n2: lines.length - n1, quiet, lines: lines.slice(0, 4), paused: G.paused };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.first && r.n1 === 4 && r.seen && r.unpaused && r.help && r.again && r.n2 === 4 && r.quiet && !r.paused && r.lines.every(l => l.length > 20 && !/[✨]/.test(l)) && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return '4 steps the first time in the house, not again on the next visit; the ❓ sign repeats them';
});

await check('guide', async () => {
  // (Round U) Ông Cú as a guide: after his welcome, each visit he explains one new thing (money, the house, the bus, the
  // signposts, family missions, the job boards, talking to people, the sound button) on a page with a drawn picture,
  // read aloud; the next visit it is the next one, and after the last he starts again
  const P = await open(b, { w: 900, h: 640 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, wait = ms => new Promise(r => setTimeout(r, ms));
    const { OWL_LESSONS } = await import('/js/content/owllessons.js'), { pic } = await import('/js/art.js');
    const drawn = OWL_LESSONS.every(l => pic(l.icon).includes('class="art')), bothLangs = OWL_LESSONS.every(l => l.lines.every(([en, vi]) => en && vi && en !== vi));
    const story = G.lanterns; G.lanterns = { ...story, owl: async () => false };   // (past the story's prologue)
    p.quests.owl = true; p.owlLessons = [];
    const owl = G.interactables.find(i => i.id === 'npc_owl'), got = [];
    const visit = async () => {
      owl.act(h, G); let card = null;
      for (let k = 0; k < 40 && !card; k++) { await wait(150); const d = document.querySelector('.dialog:not(.out)'); if (d) { d.click(); await wait(200); } card = document.querySelector('.owl-lesson:not(.out)'); }
      if (!card) return null;
      const art = !!card.querySelector('.sb-art .art'), text = card.querySelector('.sb-text').textContent, paused = G.paused;
      for (let k = 0; k < 4 && document.querySelector('.owl-lesson:not(.out)'); k++) { document.querySelector('.owl-lesson:not(.out) .qt-go').click(); await wait(400); }
      await wait(300);
      return { art, text: text.slice(0, 30), paused, gone: !document.querySelector('.owl-lesson:not(.out)') };
    };
    for (let n = 0; n < OWL_LESSONS.length + 1; n++) { const v = await visit(); got.push(v && v.art && v.paused && v.gone ? p.owlLessons[p.owlLessons.length - 1] : JSON.stringify(v)); }
    G.lanterns = story;
    return { drawn, bothLangs, got, n: OWL_LESSONS.length, ids: OWL_LESSONS.map(l => l.id), paused: G.paused };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.drawn && r.bothLangs && r.got.slice(0, r.n).join() === r.ids.join() && r.got[r.n] === r.ids[0] && !r.paused && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.n} things Ông Cú explains, one per visit in order (${r.ids.join(', ')}), each with a drawn picture; then he starts again`;
});

await check('prices', async () => {
  // (Round U) price pictures and change, sellers remember you: every food stall and kiosk has a price sign (one coin
  // picture per coin, up to 10); paying with more counts the change on, one coin at a time; the next visit the seller
  // greets the child by name on screen, but the spoken words have no name (HANDOFF rule 11)
  const P = await open(b, { w: 900, h: 640 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, S = await import('/js/state.js'), V = await import('/js/voice.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    for (let k = 0; k < 40 && !G.world.priceTags; k++) await wait(100);
    const { VENDORS } = await import('/js/vendors.js');
    const food = G.world.stalls.filter(s => s.tap && VENDORS.some(v => 'v_' + v.id === s.tap && v.food));
    const tagged = food.filter(s => G.world.priceTags.some(t => 'v_' + t.id === s.tap)).length, maxPrice = Math.max(...VENDORS.map(v => v.food[3]));
    const said = []; const hear = t => said.push(t); V.spoken.push(hear);
    const v = VENDORS.find(x => x.id === 'bahai'); delete (p.regulars || {}).bahai; p.name = 'Kiwi';
    const it = G.interactables.find(i => i.id === 'v_bahai');
    const talk = async (buy) => { const lines = []; it.act(h, G); for (let k = 0; k < 20; k++) { await wait(250); const d = document.querySelector('.dialog:not(.out)'); if (!d) { if (lines.length) break; continue; } const t = d.querySelector('.dtext').textContent; if (lines[lines.length - 1] !== t) lines.push(t); const chs = d.querySelectorAll('.dch'); if (chs.length) { (buy && lines.length === 1 ? chs[0] : chs[chs.length - 1]).click(); } else d.click(); } return lines; };
    S.farm.coins = 50; const before = S.farm.coins; said.length = 0;
    const first = await talk(true); const paid = before - S.farm.coins;
    const changeLine = first.find(l => /change/i.test(l)) || '';
    said.length = 0; const second = await talk(false), spokeName = said.some(t => /Kiwi/.test(t));
    V.spoken.splice(V.spoken.indexOf(hear), 1);
    return { stalls: food.length, tagged, maxPrice, price: v.food[3], paid, changeLine, first: first.slice(0, 2), greet: second[0], spokeName, said: said.slice(0, 2), paused: G.paused };
  });
  const errs = P.errors; await P.ctx.close();
  const counted = (r.changeLine.match(/,/g) || []).length >= 3;   // price 6 paid with 10: 4 coins counted on
  ok(r.stalls >= 20 && r.tagged === r.stalls && r.maxPrice <= 10 && r.paid === r.price && counted && /Kiwi/.test(r.greet || '') && !r.spokeName && !r.paused && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.tagged} food stalls and kiosks have a coin-picture price; change counted on ("${r.changeLine.slice(0, 70)}…"); the seller greets Kiwi by name on screen, not out loud`;
});

await check('jobs', async () => {
  // (Round U) a job board in every place: off the roads; a child takes a job (find a lost hen near the farm, then take
  // eggs to a market stall), a bobbing picture shows where; tapping it gives coins and says what the place is for
  const P = await open(b, { w: 900, h: 640 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, S = await import('/js/state.js'), W = await import('/js/world.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    for (let k = 0; k < 50 && !G.jobs; k++) await wait(100);
    const { JOBS } = await import('/js/content/jobs.js'), { pic } = await import('/js/art.js');
    const want = G.PLACES.filter(pl => pl.key && JOBS[pl.key]).length, boards = G.jobs.boards.length;
    const offRoad = G.jobs.boards.every(B => W.edgeDist(B.x, B.z) > 2), drawn = Object.values(JOBS).every(J => J.jobs.every(j => pic(j.icon).includes('class="art')));
    const delivers = Object.values(JOBS).flatMap(J => J.jobs.filter(j => j.kind === 'deliver')), stallsFor = delivers.every(j => G.world.stalls.some(s => s.place === j.to));
    const close = async () => { for (let k = 0; k < 20; k++) { await wait(200); const rw = document.querySelector('.reward'); if (rw) { rw.click(); continue; } const d = document.querySelector('.dialog:not(.out)'); if (d) { const c = d.querySelectorAll('.dch'); c.length ? c[0].click() : d.click(); continue; } if (!G.paused) break; } };
    p.jobsDone = {}; const B = G.jobs.boards.find(x => x.key === 'farm'); const run = [];
    for (const step of [0, 1]) {
      const job = G.interactables.find(i => i.id === 'job_farm'); job.act(h, G); await close();
      const a = G.jobs.active.get(h), t = a && G.interactables.find(i => i.id === 'jobt_farm');
      const near = a && a.job.kind === 'deliver' ? G.world.stalls.some(s => s.place === 'market' && Math.hypot(s.x - t.x, s.z - t.z) < 4) : t && Math.hypot(t.x - B.x, t.z - B.z) >= 9.5;
      const coins = S.farm.coins; t && t.act(h, G); await close();
      run.push({ kind: a && a.job.kind, near, pay: S.farm.coins - coins, gone: !G.jobs.active.has(h) && !G.interactables.some(i => i.id === 'jobt_farm') });
    }
    return { want, boards, offRoad, drawn, stallsFor, run, done: p.jobsDone.farm, paused: G.paused };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.boards === r.want && r.want >= 14 && r.offRoad && r.drawn && r.stallsFor && r.run.map(x => x.kind).join() === 'find,deliver' && r.run.every(x => x.near && x.pay === 3 && x.gone) && r.done === 2 && !r.paused && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.boards} job boards off the roads; find the hen near the farm, then take eggs to a market stall: +3 coins each, and what the place is for`;
});

await check('wayfind', async () => {
  // (Round U) "Where is…?": the 🧭 button shows pictures (home, my house, Ông Cú, the market, every village and city);
  // tapping Hà Nội lays sparkles along the roads ahead of the child, a new stretch as they walk; arriving says so and
  // the sparkles go; every place in the valley can be reached along the roads from home
  const P = await open(b, { w: 1280, h: 800 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], W = await import('/js/world.js'), F = await import('/js/wayfind.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    for (let k = 0; k < 50 && !G.wayfind; k++) await wait(100);
    const btn = document.querySelector('.hud .z-where'), bb = btn.getBoundingClientRect(); btn.click(); await wait(300);
    const picks = [...document.querySelectorAll('.wherepick .wp-pick')], drawn = picks.every(p => p.querySelector('.art')), names = picks.map(p => p.getAttribute('aria-label'));
    const hanoi = picks.find(p => /Hà Nội|Hanoi/.test(p.getAttribute('aria-label'))); hanoi.click(); await wait(800);
    const t = G.wayfind.trail, shown = G.wayfind.shown;
    const off = shown.filter(([x, z]) => { const d = W.roadDist(x, z); return !(d.road && d.d <= d.road.w / 2 + .3) && W.edgeDist(x, z) > .3; }).map(p => p.map(Math.round)), onRoad = !off.length;   // (on a road, or a place's paved street)
    const gaps = t.pts.slice(1, -1).every((p, k) => Math.hypot(p[0] - t.pts[k][0], p[1] - t.pts[k][1]) < 6.5);
    // walk a stretch: the sparkles move on ahead
    const mid = t.pts[16]; h.place(mid[0], mid[1]); await wait(1300); const moved = G.wayfind.trail && G.wayfind.trail.i > 10 && G.wayfind.shown.length > 5;
    const end = G.PLACES.find(p => p.key === 'hanoi'); h.place(end.x + 3, end.z + 3); await wait(1300); const arrived = !G.wayfind.trail && G.wayfind.shown.length === 0;
    // every target can be reached from home
    const g = F.roadGraph(G.PLACES), home = G.PLACES.find(p => p.key === 'farm'), unreachable = G.wayfind.targets().filter(x => { const r = F.route(g, home.x, home.z, x.x, x.z); return !r || Math.hypot(r.pts[r.pts.length - 2][0] - x.x, r.pts[r.pts.length - 2][1] - x.z) > 40; }).map(x => x.id);
    return { off, size: Math.min(bb.width, bb.height), picks: picks.length, drawn, names: names.slice(0, 5), shown: shown.length, onRoad, gaps, len: Math.round(t.pts.length * 4), moved, arrived, unreachable, paused: G.paused };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.size >= 44 && r.picks >= 16 && r.drawn && r.shown >= 20 && r.onRoad && r.gaps && r.moved && r.arrived && !r.unreachable.length && !r.paused && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.picks} pictures to choose from; to Hà Nội: ${r.shown} sparkles at a time on the roads (about ${r.len} m), moving on ahead, gone on arrival; every place reachable from home`;
});

await check('dayplan', async () => {
  // (Round U) the villagers' day: a job picture over each head; at dusk the ones with a house nearby walk to its door and go
  // in, the rest light a lantern, lanterns glow over the stalls; in the morning everyone comes back out to their spot; an
  // umbrella in the rain; and nobody ever walks on a road or through a house
  const P = await open(b, { w: 900, h: 640 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, W = G.world, wait = ms => new Promise(r => setTimeout(r, ms)), S = await import('/js/state.js'), { pic } = await import('/js/art.js');
    for (let k = 0; k < 80 && !G.dayPlan; k++) await wait(100);
    const D = G.dayPlan, all = D.list; G.paused = true; const V = { filter: f => all.filter(v => !v.external).filter(f), every: f => all.every(f), get length() { return all.filter(v => !v.external).length; }, [Symbol.iterator]: () => all.filter(v => !v.external)[Symbol.iterator]() };   // (people who move on their own, a parade, keep to it)   // (the checks drive the clock by hand)
    const jobs = V.every(v => v.tag && v.tag.parent === v.o && pic(v.job[0]).includes('class="art')), titled = V.every(v => v.job[1] && v.job[2]);
    const bad = new Set(); let t = 0;
    const run = (secs) => { G.paused = false; for (let i = 0; i < secs * 10; i++) { t += .1; W.update(.1, t); for (const v of V) { if (v.inside) continue; const p = v.o.position, moved = Math.hypot(p.x - v.home.x, p.z - v.home.z); if (moved > 1.1 && !D.offRoad(p.x, p.z)) bad.add(v.it.id); } } G.paused = true; };
    S.settings.alwaysDay = false;
    W.time = .86; run(40);
    const night = { inside: V.filter(v => v.inside).length, withDoor: V.filter(v => v.door).length, lamps: V.filter(v => !v.door && v.lamp.visible).length, noDoor: V.filter(v => !v.door).length, lights: D.lights.filter(l => l.visible).length, stalls: D.lights.length };
    W.time = .4; run(40);
    const day = { out: V.filter(v => !v.inside).length, home: V.filter(v => Math.hypot(v.o.position.x - v.home.x, v.o.position.z - v.home.z) < 3).length, lights: D.lights.filter(l => l.visible).length };
    G.weather.start(); run(1); const umb = V.filter(v => v.umb.visible).length; G.weather.stop(); run(1);
    G.paused = false;
    return { n: V.length, all: all.length, jobs, titled, night, day, umb, bad: [...bad].slice(0, 5) };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.n > 10 && r.jobs && r.titled && r.night.withDoor > 0 && r.night.inside === r.night.withDoor && r.night.lamps === r.night.noDoor && r.night.lights === r.night.stalls && r.day.out === r.n && r.day.home === r.n && r.day.lights === 0 && r.umb === r.n && !r.bad.length && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.n} villagers with a job picture; at night ${r.night.inside} go home through their door, ${r.night.lamps} light a lantern, ${r.night.lights} stall lanterns; all back out in the morning; umbrellas in the rain; nobody on a road or in a house`;
});

await check('animalhomes', async () => {
  // (Round U) animals with homes: Lotus Village's hens walk into their coop at dusk and come out in the morning; the
  // ducks gather in the middle of the lake for the night; the village dog follows a child who visits, then goes home
  const P = await open(b, { w: 900, h: 640 });
  const r = await P.page.evaluate(async () => {
    const G = __sv, W = G.world, h = G.heroes[0], wait = ms => new Promise(r => setTimeout(r, ms)), S = await import('/js/state.js');
    for (let k = 0; k < 80 && !G.animalHomes; k++) await wait(100);
    const A = G.animalHomes; let t = 0; S.settings.alwaysDay = false;
    const run = secs => { G.paused = false; for (let i = 0; i < secs * 10; i++) { t += .1; W.update(.1, t); } G.paused = true; };
    const V = G.PLACES.find(p => p.key === 'village'); h.place(A.coop.x + 6, A.coop.z + 6); G.paused = true;
    const spread0 = A.ducks.reduce((s, c) => s + Math.hypot(c.cx - A.lake[0], c.cz - A.lake[1]), 0) / A.ducks.length;
    W.time = .86; run(45);
    const night = { hensIn: A.hens.filter(a => a.inside).length, hens: A.hens.length, littleIn: A.critHens.filter(c => c.inside).length, little: A.critHens.length, ducks: A.ducks.reduce((s, c) => s + Math.hypot(c.cx - A.lake[0], c.cz - A.lake[1]), 0) / A.ducks.length };
    W.time = .4; run(30);
    const day = { hensOut: A.hens.filter(a => !a.inside && a.m.visible).length, littleOut: A.critHens.filter(c => !c.inside && c.s.visible).length, ducks: A.ducks.reduce((s, c) => s + Math.hypot(c.cx - A.lake[0], c.cz - A.lake[1]), 0) / A.ducks.length };
    // the dog: the child stands beside it, then walks off a few metres; the dog comes along
    const d = A.dog.m.position; h.place(d.x + 3, d.z); run(1); const h0 = [h.pos.x, h.pos.z]; h.place(h0[0] + 6, h0[1] + 2); run(8);
    const follows = !!A.dog.following && Math.hypot(d.x - h.pos.x, d.z - h.pos.z) < 4;
    h.place(V.x + 80, V.z + 80); run(1); const goneHome = !A.dog.following;
    G.paused = false;
    return { coop: !!A.coop, night, day, spread0: +spread0.toFixed(1), follows, goneHome };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.coop && r.night.hens >= 3 && r.night.hensIn === r.night.hens && r.night.littleIn === r.night.little && r.night.ducks < r.spread0 * .6 && r.day.hensOut === r.night.hens && r.day.littleOut === r.night.little && r.day.ducks > r.night.ducks && r.follows && r.goneHome && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.night.hens} hens and ${r.night.little} little hens into the coop at night and out in the morning; ducks together on the lake at night; the village dog follows a visiting child and goes home`;
});

await check('names', async () => {
  // every game file: no name used that is never defined or imported (TypeScript's TS2304 on all of js/, nothing else
  // judged). Moving code between files (the architecture steps) is where this goes wrong; it once stopped the game.
  const { execFileSync } = await import('child_process'), tsc = 'node_modules/.bin/tsc';
  if (!fs.existsSync(tsc)) return 'skipped (run npm install in tests)';
  let out = ''; try { out = execFileSync(tsc, ['-p', 'tsconfig.names.json'], { encoding: 'utf8', maxBuffer: 64e6 }); } catch (e) { out = (e.stdout || '') + ''; }
  const bad = out.split('\n').filter(l => /TS2304/.test(l) && !l.startsWith('../vendor'));
  ok(!bad.length, bad.slice(0, 6).join(' | '));
  return `${fs.readdirSync('../js', { recursive: true }).filter(f => String(f).endsWith('.js')).length} game files: every name is defined or imported`;
});

await check('soundsw', async () => {
  // (Round U, owner 11 Oct: "there are no sounds and voices option to turn on and off") the Simple screen's Sound button
  // and the valley's Sound button open three big switches (music, sounds, voice); each turns only its own sound on or off
  const out = [];
  const P = await open(b, { w: 390, h: 844, touch: true, screen: null }); const page = P.page;
  await page.waitForSelector('.simple-screen:not([hidden]) .sp-sound', { timeout: 20000 });
  await page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d.remove()));
  const flip = async (k, want) => { await page.click(`.soundsheet .ss-sw[data-k="${k}"]`); await page.waitForTimeout(200); const v = await page.evaluate(() => { const s = __sv.settings; return { music: !!s.music, sound: !!s.sound, voice: !!s.voice }; }); return v; };
  await page.click('.sp-sound'); await page.waitForSelector('.soundsheet .ss-sw', { timeout: 5000 }).catch(() => out.push('Simple screen: no Sound switches'));
  if (!out.length) {
    const s0 = await page.evaluate(() => ({ music: !!__sv.settings.music, sound: !!__sv.settings.sound, voice: !!__sv.settings.voice }));
    const s1 = await flip('voice'); if (s1.voice === s0.voice || s1.sound !== s0.sound || s1.music !== s0.music) out.push('voice switch: ' + JSON.stringify([s0, s1]));
    const s2 = await flip('music'); if (s2.music === s1.music || s2.voice !== s1.voice) out.push('music switch: ' + JSON.stringify([s1, s2]));
    const s3 = await flip('sound'); if (s3.sound === s2.sound || s3.voice !== s2.voice) out.push('sound switch: ' + JSON.stringify([s2, s3]));
    const n = await page.evaluate(() => document.querySelectorAll('.soundsheet .ss-sw').length); if (n !== 3) out.push(n + ' switches');
    await page.click('.soundsheet .ss-done'); await page.waitForTimeout(300);
  }
  // the valley: the dock's Sound button (computer size, where the dock shows it)
  const Q = await open(b, { w: 1280, h: 800 }); await clear(Q.page);
  await Q.page.click('.hud .dk.snd'); const v = await Q.page.waitForSelector('.soundsheet .ss-sw', { timeout: 5000 }).then(() => true, () => false);
  if (!v) out.push('valley: the Sound button opens no switches');
  const errs = P.errors.concat(Q.errors); await P.ctx.close(); await Q.ctx.close();
  ok(!out.length && !errs.length, out.join(' | ') + JSON.stringify(errs));
  return 'Sound on the Simple screen and in the valley: music, sounds and voice, each switched on its own';
});

await check('chips', async () => {
  // (Round U, owner 11 Oct: "these buttons should tell what they are when hover or tap") the coin, orb and Leafy chips on
  // the top bar and in the Backpack: each has a name to hover (title) and a tap shows a card with its name and what it is
  // for, in English and in Vietnamese
  const out = [];
  for (const lang of ['en', 'vi']) {
    const P = await open(b, { w: 820, h: 1180, touch: true, lang }); await clear(P.page); const page = P.page;
    for (const where of ['hud', 'bag']) {
      if (where === 'bag') { await page.evaluate(() => __sv.openPad(0, 'bag')); await page.waitForTimeout(600); }
      const scope = where === 'hud' ? '.hud' : '.bag-top';
      for (const k of ['money', 'orbs', 'leafy']) {
        const sel = `${scope} [data-chip="${k}"]`, title = await page.getAttribute(sel, 'title').catch(() => null);
        if (!title) { out.push(`${lang} ${where} ${k}: no name to hover`); continue; }
        await page.evaluate(() => document.querySelectorAll(".chipcard").forEach(c => c.classList.remove("on"))); await page.click(sel); await page.waitForFunction(() => document.querySelector(".chipcard.on"), null, { timeout: 3000 }).catch(() => {});
        const card = await page.evaluate(() => { const c = document.querySelector('.chipcard.on'); return c ? c.textContent : ''; });
        if (!card.includes(title)) out.push(`${lang} ${where} ${k}: a tap shows "${card.slice(0, 60)}"`);
        if (lang === 'en' && /[ăâđêôơư]/i.test(card)) out.push(`${where} ${k}: Vietnamese in English`);
      }
    }
    const errs = P.errors; await P.ctx.close(); if (errs.length) out.push(lang + ': ' + errs.join(' '));
  }
  ok(!out.length, out.join(' | '));
  return 'coins, Sparkle Orbs and Leafies: a name to hover and a card on tap, top bar and Backpack, English and Vietnamese';
});

await check('hscroll', async () => {
  // (Round U, owner 11 Oct: "I can't drag left and right on phone or desktop"; "on a tablet I can't scroll down the Map")
  // the Backpack's tab row moves sideways and the Pad's Map page moves down, on a phone and a tablet by finger (also with
  // the browser's own touch scrolling switched off, as strict as Safari: js/scrollhelp.js moves them by hand) and on a
  // computer by mouse drag and wheel
  const out = [];
  for (const [name, w, h, touch] of [['phone', 390, 760, true], ['tablet', 820, 1180, true], ['computer', 1280, 800, false]]) {
    const P = await open(b, { w, h, touch }); await clear(P.page); const page = P.page, cdp = await page.context().newCDPSession(page);
    await page.waitForTimeout(600);
    const at = sel => page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + Math.min(q.height / 2, 300) }; }, sel);
    const finger = async (sel, dx, dy) => { const r = await at(sel); if (!r) return; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y }] }); for (let k = 1; k <= 10; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: r.x + dx * k / 10, y: r.y + dy * k / 10 }] }); await page.waitForTimeout(20); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(250); };
    const mouse = async (sel, dx) => { const r = await at(sel); if (!r) return; await page.mouse.move(r.x, r.y); await page.mouse.down(); for (let k = 1; k <= 8; k++) await page.mouse.move(r.x + dx * k / 8, r.y); await page.mouse.up(); await page.waitForTimeout(200); };
    const read = () => page.evaluate(() => { const j = document.querySelector('.jumpnav'), b = document.querySelector('.pad-body'); return { jn: j ? Math.round(j.scrollLeft) : -1, jnMax: j ? j.scrollWidth - j.clientWidth : -1, body: b ? Math.round(b.scrollTop) : -1, bodyMax: b ? b.scrollHeight - b.clientHeight : -1 }; });
    for (const strict of touch ? [false, true] : [false]) {
      if (strict) await page.addStyleTag({ content: '.jumpnav, .pad-body, .modal, .jumpnav button { touch-action: none !important; }' });
      await page.evaluate(() => { document.querySelectorAll('.modal .x').forEach(x => x.click()); __sv.openPad(0, 'bag'); }); await page.waitForTimeout(700);
      if (touch) await finger('.jumpnav', -200, 0); else await mouse('.jumpnav', -200);
      const bag = await read();
      if (!touch) { await page.evaluate(() => { const j = document.querySelector('.jumpnav'); j.scrollLeft = 0; }); const r = await at('.jumpnav'); await page.mouse.move(r.x, r.y); await page.mouse.wheel(0, 200); await page.waitForTimeout(250); }
      const wheel = await read();
      await page.evaluate(() => { document.querySelectorAll('.modal .x').forEach(x => x.click()); __sv.openPad(0, 'map'); }); await page.waitForTimeout(700);
      if (touch) await finger('.pad-body', 0, -350); else { const r = await at('.pad-body'); await page.mouse.move(r.x, r.y); await page.mouse.wheel(0, 600); await page.waitForTimeout(300); }
      const map = await read();
      const tag = name + (strict ? ' (strict)' : '');
      if (bag.jnMax > 4 && bag.jn < 40) out.push(`${tag}: the Backpack row did not move (${JSON.stringify(bag)})`);
      if (!touch && bag.jnMax > 4 && wheel.jn < 40) out.push(`${tag}: the wheel did not move the Backpack row`);
      if (map.bodyMax > 4 && map.body < Math.min(60, map.bodyMax)) out.push(`${tag}: the Map page did not move down (${JSON.stringify(map)})`);
    }
    const errs = P.errors; await P.ctx.close(); if (errs.length) out.push(name + ': ' + errs.join(' '));
  }
  ok(!out.length, out.join(' | '));
  return 'the Backpack row moves by finger (phone, tablet, also as strict as Safari), by mouse drag and by wheel; the Map page moves down on every size';
});

await check('joins', async () => {
  // ROAD-017 (Round U, owner 11 Oct: "they are not connecting smoothly, there are different elevations when connecting
  // roads or bridges"): walk the middle of every road in 25 cm steps (and 3 m on into a road it joins, 6 m through a gate): the ground under
  // a child's feet never jumps more than 6 cm, at a junction, a bridge deck or a place's flat level
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const W = await import('/js/world.js'), G = __sv, out = []; let n = 0;
    for (const R of W.ROADS) {
      const pts = R.pts, ext = (a, b2, d) => { const L = Math.hypot(b2[0] - a[0], b2[1] - a[1]) || 1; return [a[0] + (a[0] - b2[0]) / L * d, a[1] + (a[1] - b2[1]) / L * d]; };
      const joins = q => { const d = W.roadDist(q[0], q[1]); return d.road && d.road !== R && d.d < d.road.w / 2 ? q : null; };
      // (and 6 m on through a gate into the place it leads to)
      const g = R.gates || [], into = (end, a, b2) => g[end] ? ext(a, b2, 6) : joins(ext(a, b2, 3));
      const line = R.loop ? pts.concat([pts[0]]) : [into(0, pts[0], pts[1]), ...pts, into(1, pts[pts.length - 1], pts[pts.length - 2])].filter(Boolean);
      let prev = null;
      for (let i = 0; i < line.length - 1; i++) { const [ax, az] = line[i], [bx, bz] = line[i + 1], m = Math.ceil(Math.hypot(bx - ax, bz - az) / .25);
        for (let k = 0; k <= m; k++) { const x = ax + (bx - ax) * k / m, z = az + (bz - az) * k / m, y = G.world.groundAt(x, z); n++; if (prev != null && Math.abs(y - prev) > .06) { out.push(`${R.id}: ${(Math.abs(y - prev) * 100).toFixed(0)} cm step at ${x.toFixed(0)},${z.toFixed(0)}`); prev = null; break; } prev = y; } }
    }
    return { out, n };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.out.length && r.n > 5000 && !errs.length, r.out.slice(0, 12).join(' | ') + JSON.stringify(errs));
  return `${r.n} steps along every road and into every junction and bridge: no step over 6 cm (ROAD-017)`;
});

await check('ride', async () => {
  // (Round U, owner 11 Oct: "all vehicles can be ridden, public transport can get in with fares") every parked car and
  // motorbike can be driven (Jump gets off); a bus takes a big kid for its fare and an under-5 for free, to the next stop;
  // every bus route has a stop with its picture timetable; a moving private car never offers a lift
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page); const page = P.page;
  const r = await page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], T = G.traffic, I = G.interactables, out = {};
    out.drive = I.filter(i => /^drive_/.test(i.id)).length; out.bike = I.filter(i => /^bike_/.test(i.id)).length;
    out.rides = I.filter(i => /^ride_/.test(i.id)).length; out.stops = (G.world.busStops || []).length;
    out.lift = T.slots.filter(s => s.mover && !/^(bus|tram|taxi|touristCart|xichlo)/.test(s.id)).some(s => I.some(i => i.id === 'ride_' + T.slots.indexOf(s)));
    // drive a parked car
    const car = I.find(i => /^drive_/.test(i.id) && /car/i.test(i.label())); if (car) { h.place(car.x + 1, car.z); car.act(h, G); out.driving = !!h.riding && !!h.riding.vehicle; h.dismount(); out.off = !h.riding; }
    return out;
  });
  // a bus: a big kid pays, an under-5 rides free
  const bus = async age => page.evaluate(async age => {
    const G = __sv, h = G.heroes[0], I = G.interactables, { farm } = await import('/js/state.js');
    h.profile.age = age; farm.coins = 50; const c0 = farm.coins;
    const it = I.find(i => /^ride_/.test(i.id) && G.traffic.slots[+i.id.slice(5)].id.startsWith('bus')); if (!it) return { none: true };
    h.place(it.x + 2, it.z); const p = it.act(h, G);
    await new Promise(res => { const t = setInterval(() => { const c = document.querySelectorAll('.dialog .dchoices button'); if (c.length) { clearInterval(t); setTimeout(() => { c[0].click(); res(); }, 500); } }, 100); setTimeout(res, 8000); });
    await p; const on = !!h.carry, paid = c0 - farm.coins;
    h.carry = null; G.traffic.slots.forEach(s => { if (s.passenger === h) s.passenger = null; });
    return { on, paid };
  }, age);
  r.big = await bus('big'); r.little = await bus('little');
  const errs = P.errors; await P.ctx.close();
  ok(r.drive >= 20 && r.bike >= 4 && r.rides >= 4 && r.stops >= 4 && !r.lift && r.driving && r.off && r.big.on && r.big.paid > 0 && r.little.on && r.little.paid === 0 && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.drive} parked cars and motorbikes to drive, ${r.bike} bicycles, ${r.rides} buses, trams and taxis to ride (big kid paid ${r.big.paid}, under-5 free), ${r.stops} bus stops; no lifts from strangers`;
});

await check('familymissions', async () => {
  // (Round U, owner 11 Oct: 15 tasks for family missions, week and bedtime, and a short guide) Grown-ups → Family lists 15
  // ready-made missions (day, week, bedtime) with switches and the family-play guide; the ones turned on (one of each kind
  // to start) show in the child's Adventures with a "?" guide; a done day mission comes back the next day
  const P = await open(b, { w: 900, h: 700 }); await clear(P.page); const page = P.page;
  const r = await page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], { settings } = await import('/js/state.js'), F = await import('/js/content/familymissions.js');
    const box = document.createElement('div'); box.innerHTML = G.parents.grownupsHTML(true); document.body.appendChild(box);
    const out = { ready: box.querySelectorAll('[data-fmready]').length, on: box.querySelectorAll('[data-fmready]:checked').length, guide: box.querySelectorAll('.fmguide .fmg').length };
    box.remove();
    const log = () => { const d = document.createElement('div'); d.innerHTML = G.parents.logHTML(h.profile); return d; };
    const L = log(); out.child = L.querySelectorAll('[data-mtick]').length; out.help = !!L.querySelector('.fmhelp');
    out.kinds = F.FAMILY_MISSIONS.reduce((a, m) => (a[m.kind] = (a[m.kind] || 0) + 1, a), {});
    // tick the day one: gone; a day later: back
    const id = 'r_f_table'; G.parents.tick ? 0 : 0; settings.missionsDone = { ...(settings.missionsDone || {}), [id]: { [h.profile.id]: Date.now() } };
    out.afterTick = log().querySelectorAll(`[data-mtick="${id}"]`).length;
    settings.missionsDone[id][h.profile.id] = Date.now() - 864e5 * 1.1; out.nextDay = log().querySelectorAll(`[data-mtick="${id}"]`).length;
    const bad = F.FAMILY_MISSIONS.filter(m => !m.en || !m.vi || /[ăâđêôơư]/i.test(m.en.replace(/"[^"]*"/g, ''))).map(m => m.id); out.bad = bad;
    return out;
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.ready === 15 && r.on === 3 && r.guide === 4 && r.child >= 3 && r.help && r.kinds.day === 5 && r.kinds.week === 5 && r.kinds.bedtime === 5 && r.afterTick === 0 && r.nextDay === 1 && !r.bad.length && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return '15 ready-made missions (5 day, 5 week, 5 bedtime) with switches, 3 on to start, the family-play guide for grown-ups and the child (?), a day mission back the next day';
});

await check('wearbag', async () => {
  // (Round U, owner 11 Oct: "all clothes and accessories when bought should show in the wear area unless they are worn;
  // clothes as per gender") the Backpack lists everything bought and not worn (tap to wear) and what is worn (tap to take
  // off); the shop shows a girl the girls' things and the ones for both first, the rest behind More
  const P = await open(b, { w: 900, h: 700 }); await clear(P.page); const page = P.page;
  const r = await page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], p = h.profile, S = await import('/js/content/shop.js'), st = await import('/js/state.js'), w = t => new Promise(r => setTimeout(r, t));
    p.look.set = 'girl'; p.owned.clothes = []; const top = S.CLOTHES.find(it => it.slot === 'top' && it.for !== 'b'), feet = S.CLOTHES.find(it => it.slot === 'feet' && it.for !== 'b');
    st.farm.coins = 999; S.buy(p, 999, top.id); S.buy(p, 999, feet.id); S.wear(p, 'top', 'none'); S.wear(p, 'feet', 'none');
    const out = {};
    for (let k = 0; k < 20 && !document.querySelector('.pad [data-wear]'); k++) { if (!document.querySelector('.pad')) { G.paused = false; G.openPad(0, 'bag'); } await w(300); }
    const ids = () => [...document.querySelectorAll('.pad [data-wear]')].map(b => b.dataset.wear), worn = () => [...document.querySelectorAll('.pad [data-unwear]')].map(b => b.dataset.unwear);
    out.before = ids(); document.querySelector(`.pad [data-wear="${top.id}"]`)?.click(); await w(300);
    out.after = ids(); out.worn = worn(); out.look = p.look.top === top.id;
    document.querySelector('.pad [data-unwear="top"]')?.click(); await w(300); out.back = ids().includes(top.id);
    document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
    // the shop: a girl sees no boys-only thing until More
    if (G.shop && G.shop.on()) { G.shop.openShop(0); await w(400); const boys = new Set(S.CLOTHES.filter(it => it.for === 'b').map(it => it.id));
      const seen = () => [...document.querySelectorAll('.shopk .kitem')].map(b => b.dataset.id);
      let any = false; for (const tab of document.querySelectorAll('.shopk [data-tab]')) { tab.click(); await w(150); if (seen().some(id => boys.has(id) && !S.owns(p, id))) any = true; }
      out.boysFirst = any; const more = document.querySelector('.shopk .kmore'); if (more) { more.click(); await w(200); } out.more = !!more;
      document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false; } else out.noShop = true;
    return { ...out, top: top.id, feet: feet.id };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.before.includes(r.top) && r.before.includes(r.feet) && !r.after.includes(r.top) && r.worn.includes('top') && r.look && r.back && (r.noShop || (!r.boysFirst && r.more)) && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `bought clothes wait in the Backpack (tap to wear, tap to take off); the shop shows a girl's set first${r.noShop ? ' (shop off here)' : ', the rest behind More'}`;
});

await check('talk', async () => {
  // (Round U, owner 11 Oct: "all NPCs should be able to talk and should throw facts or slangs") every person standing in
  // the valley has a tap within reach; the villagers without words of their own tell a fact or a saying of their
  // region, in the chosen language
  const out = [];
  for (const lang of ['en', 'vi']) {
    const P = await open(b, { w: 800, h: 600, lang }); await clear(P.page); await P.page.waitForTimeout(1200);
    const r = await P.page.evaluate(async lang => {
      const G = __sv, me = new Set(G.heroes.map(h => h.av && h.av.root)), people = [];
      G.scene.traverse(o => { if (o.userData.avatar && !me.has(o) && o.parent === G.scene) people.push(o); });
      const silent = people.filter(o => !G.interactables.some(i => Number.isFinite(i.x) && Math.hypot(i.x - o.position.x, i.z - o.position.z) < 3)).map(o => [Math.round(o.position.x), Math.round(o.position.z)]);
      const v = G.interactables.find(i => /^villager_/.test(i.id)); let said = '';
      if (v) { v.act(G.heroes[0], G); await new Promise(r => setTimeout(r, 600)); said = (document.querySelector('.dialog .dtext') || {}).textContent || ''; document.querySelectorAll('.dialog').forEach(d => d.remove()); G.paused = false; }
      return { people: people.length, silent, villagers: G.interactables.filter(i => /^villager_/.test(i.id)).length, said };
    }, lang);
    if (r.silent.length || !r.villagers || r.said.length < 15 || (lang === 'en' && /[ăâđêơư]/i.test(r.said))) out.push(lang + ' ' + JSON.stringify(r));
    const errs = P.errors; await P.ctx.close(); if (errs.length) out.push(errs.join(' '));
  }
  ok(!out.length, out.join(' | '));
  return 'every person in the valley answers a tap; the villagers without their own words tell a fact or a saying of their region, in English or Vietnamese';
});

await check('bilingual', async () => {
  // (Round U, owner 11 Oct: Grandma Huệ spoke Vietnamese with English set) no English slot of an [English, Vietnamese]
  // pair (an array, T(…, …) or { en, vi }) holds a Vietnamese sentence; names, songs and sayings that stay Vietnamese
  // on purpose are listed with a reason in tools/lang-allow.json (tools/lang-audit.mjs)
  const { audit } = await import('../tools/lang-audit.mjs'), r = audit();
  ok(!r.length, r.slice(0, 12).map(x => `${x.file}:${x.line} "${x.en}"`).join(' | '));
  return 'every English line is English (names, songs and sayings on the allow list)';
});

await check('rules', async () => {
  // the rule registry (architecture step 0): js/content/rules.js is exactly what docs/ARCHITECTURE.md §9 says, and every
  // rule id the code and the checks name (ROAD-003, VEH-001, PRIV-004…) is in it
  const { execFileSync } = await import('child_process');
  try { execFileSync(process.execPath, ['../tools/rules-from-doc.mjs', '--check'], { encoding: 'utf8' }); } catch (e) { ok(false, (e.stdout || '') + ''); }
  const { RULES } = await import('../js/content/rules.js');
  const src = ['../js/validate.js', 'run.mjs', 'perf-baseline.json'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const named = [...new Set([...src.matchAll(/\b([A-Z]{2,8}-\d{3})\b/g)].map(m => m[1]))], missing = named.filter(id => !RULES[id]);
  ok(!missing.length, 'named in code but not in the registry: ' + missing.join(', '));
  return `${Object.keys(RULES).length} rules, the same in the document and the code; ${named.length} rule ids named by the checks, all known`;
});

await check('coop', async () => {
  // together quests (js/coop.js): in a room with a friend both devices get the same 3 places from the room code; a
  // place counts only with the friend within 15 m; all 3 give coins and the next quest. (A pretend friend here; the
  // real two-device path is the same positions the multiplayer and cloud checks already carry.)
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], N = (await import('/js/net.js')).Net, C = await import('/js/coop.js'), W = await import('/js/world.js'), S = await import('/js/state.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    const same = C.questFor('4321', 0).join() === C.questFor('4321', 0).join() && C.questFor('4321', 0).join() !== C.questFor('4321', 1).join();
    Object.defineProperty(N, 'connected', { get: () => true, configurable: true }); N.code = '4321';
    const friend = { id: 'peer-x', pos: { x: 0, y: 0, z: 0 } }; G.partners['peer-x'] = friend;
    G.coop.tick(); const quest = G.coop.quest, coins0 = S.farm.coins;
    const spot = id => { // a point inside the place, found from the map
      for (let r2 = 0; r2 < W.HALF; r2 += 4) for (let a = 0; a < 6.28; a += .5) { const x = Math.cos(a) * r2, z = Math.sin(a) * r2; if (W.regionAt(x, z) === id) return [x, z]; }
      for (let x = -W.HALF + 10; x < W.HALF - 10; x += 3) for (let z = -W.HALF + 10; z < W.HALF - 10; z += 3) if (W.regionAt(x, z) === id) return [x, z]; // (round T: the whole valley, from the map's size)
    };
    const [ax, az] = spot(quest[0]); h.place(ax, az); friend.pos = { x: ax + 40, y: h.pos.y, z: az }; await wait(200); G.coop.tick();
    const alone = !!G.coop.done[quest[0]];
    friend.pos = { x: ax + 5, y: h.pos.y, z: az }; G.coop.tick(); const together = !!G.coop.done[quest[0]];
    for (const id of quest.slice(1)) { const [x, z] = spot(id); h.place(x, z); friend.pos = { x: x + 3, y: h.pos.y, z }; await wait(150); G.coop.tick(); }
    const after = { coins: S.farm.coins - coins0, next: G.coop.count, newQuest: G.coop.quest.join() !== quest.join() };
    // (visiting the village can start a story scene; close it, as a child would, before opening the Pad)
    document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false;
    G.openPad(0, 'log'); await wait(400); const shown = !!document.querySelector('.pad-body') && /Together quest/.test(document.querySelector('.pad-body').textContent);
    document.querySelector('.modal .x')?.click();
    delete G.partners['peer-x']; delete N.connected; N.code = null;
    return { same, quest, alone, together, after, shown };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.same && r.quest.length === 3 && !r.alone && r.together && r.after.coins === 15 && r.after.next === 1 && r.after.newQuest && r.shown && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `room 4321's quest: ${r.quest.join(', ')}; a place counts only with the friend near (40 m away: no, 5 m: yes); all 3 gave coins and a new quest`;
});

await check('report', async () => {
  // the play report (js/report.js): a game played and a minute of play are counted for the child who played, and
  // Grown-ups shows them for that child (this week's minutes, favourite games, places)
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], R = await import('/js/report.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    h.profile.stats.days = {}; h.profile.stats.played = {};
    for (const id of ['colors', 'colors', 'counting']) { G.playGame(0, id, 'replay'); await wait(600); document.querySelector('.gl .gl-x')?.click(); await wait(500); }
    R.addMinute(h.profile); R.addMinute(h.profile);
    const d = h.profile.stats.days[R.dayKey()], played = h.profile.stats.played;
    const m = R.openReport(h.profile); await wait(300);
    const txt = m.textContent, bars = m.querySelectorAll('.rep-day').length; m.close();
    return { d, played, bars, hasWeek: /This week: 2 minutes, 3 games/.test(txt), fav: /Rainbow Paints/.test(txt) };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.d && r.d.games === 3 && r.d.min === 2 && r.played.colors === 2 && r.played.counting === 1 && r.bars === 7 && r.hasWeek && r.fav && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return '3 games and 2 minutes counted today for the child who played; the report shows the week (7 days), the favourite games and what was collected';
});

await check('iphone', async () => {
  // the owner's iPhone screenshots (round F): (1) "no microphone" although the phone has one: friends meet with no tap
  // and iPhone opens the microphone only after a tap; now it says "tap to talk", opens it on the next tap and puts it
  // into the open calls; only a phone with really no microphone hears "no microphone". (2) Pad → Friends: the player's
  // buttons squeezed so their words broke into single letters. (3) The friend bar under the map lay on the round buttons.
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, N = (await import('/js/net.js')).Net, wait = ms => new Promise(r => setTimeout(r, ms)), said = [];
    N.on('status', s => said.push(s.key));
    // 1. the microphone: refused without a tap, works after one, goes into an open call
    let asks = 0, replaced = 0; const md = navigator.mediaDevices, real = md.getUserMedia.bind(md);
    md.getUserMedia = async c => { asks++; if (asks <= 1) { const e = new Error('needs a tap'); e.name = 'NotAllowedError'; throw e; } return real({ audio: true }); };
    N.calls.set('peer-y', { peerConnection: { getSenders: () => [{ track: { kind: 'audio' }, replaceTrack: async () => { replaced++; } }] } });
    N.mic = null; N.cloudOn = true; await N.getMic();
    const first = said.slice(), noMicYet = !N.mic;
    // round O: a tap anywhere no longer asks again (each ask could bring the iPhone's question up again)…
    document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); await wait(400); const askedOnTap = asks;
    // …the 🎙️ Microphone on button (or the call button) does
    await N.getMic(); for (let k = 0; k < 50 && !(N.mic && said.includes('micon')); k++) await wait(100);
    const micAfterTap = !!N.mic, after = said.slice(), tapAsks = askedOnTap;
    md.getUserMedia = async () => { const e = new Error('none'); e.name = 'NotFoundError'; throw e; }; N.mic = null; said.length = 0; await N.getMic(); const reallyNone = said.slice();
    // bug #55 (owner's iPhone: a tap on the microphone did nothing): a try made without a tap hangs for ever; a tap
    // still asks afresh (says "Asking…", then "on"); when the old try answers late its microphone is stopped, not used
    const replacedFirst = replaced; md.getUserMedia = real; N.mic = null; said.length = 0;
    let late = null; md.getUserMedia = () => new Promise(res => { late = res; });
    const hung = N.getMic(); await wait(100);
    let fresh = 0; md.getUserMedia = c => { fresh++; return real({ audio: true }); };
    const tapMic = await N.getMic(true), tapSaid = said.slice();
    const extra = await real({ audio: true }); late(extra); const hungGot = await hung; await wait(100);
    const lateStopped = extra.getAudioTracks().every(t => t.readyState === 'ended'), kept = N.mic === tapMic && hungGot === tapMic, micons = said.filter(k => k === 'micon').length;
    // blocked after a tap (iPhone has no userActivation): how to allow it, not "tap Microphone on"
    N.mic.getTracks().forEach(t => t.stop()); N.mic = null; said.length = 0;
    md.getUserMedia = async () => { const e = new Error('blocked'); e.name = 'NotAllowedError'; throw e; }; await N.getMic(true); const blocked = said.slice();
    // an iPhone home-screen game older than iOS 14.3 has no getUserMedia: say so, not "no microphone"
    said.length = 0; md.getUserMedia = undefined; Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', configurable: true });
    await N.getMic(true); const old = said.slice(); delete navigator.userAgent;
    // a status still tells friends (it was once cut off by a comment): 'left' shares the new status
    const share = G.shareStatus; let shared = 0; G.shareStatus = () => { shared++; }; N.emit('status', { key: 'left' }); G.shareStatus = share;
    md.getUserMedia = real; N.calls.delete('peer-y'); N.cloudOn = false; N.mic = null;
    // 2. Pad → Friends with a player in the room: no button taller than two lines, all inside the card
    Object.defineProperty(N, 'connected', { get: () => true, configurable: true }); N.code = '1234'; N.remotes['peer-z'] = { id: 'peer-z', name: 'Mít', look: {}, friend: 'ABCDE2' };
    G.openPad(0, 'friend'); await wait(500);
    const row = document.querySelector('.prow.roomp'), card = document.querySelector('.pad .card, .modal.pad .card') || document.querySelector('.pad');
    const btns = row ? [...row.querySelectorAll('.btn')] : [], lh = btns.length ? parseFloat(getComputedStyle(btns[0]).lineHeight) || 20 : 20;
    const tall = btns.filter(x => x.getBoundingClientRect().height > lh * 2 + 24).map(x => x.textContent.trim());
    const cr = row ? row.getBoundingClientRect() : null, outside = btns.filter(x => { const q = x.getBoundingClientRect(); return cr && (q.right > cr.right + 1 || q.left < cr.left - 1); }).length;
    // the 🎙️ button in Friends: what happened shows in the panel (blocked here)
    const mute = document.querySelector('#oMute'); md.getUserMedia = async () => { const e = new Error('blocked'); e.name = 'NotAllowedError'; throw e; };
    if (mute) mute.click(); await wait(400); md.getUserMedia = real; N.mic = null;
    const panelSays = (document.querySelector('.pad .online .status') || {}).textContent || '';
    document.querySelector('.modal .x')?.click(); await wait(300);
    delete N.remotes['peer-z']; delete N.connected; N.code = null;
    // 3. the friend bar and the round buttons under the map never overlap
    // (a pretend friend 13 m away: the game shows the bar by itself, as with a real friend)
    const hud = G.huds[0], chip = hud.q('.friendchip'), me = G.heroes[0].pos; G.partners['peer-q'] = { id: 'peer-q', name: 'Mít', pos: { x: me.x + 13, y: me.y, z: me.z } }; G.huds[0].setCall(true, false, false);
    await wait(600);
    const c = chip.getBoundingClientRect(), hit = [...document.querySelectorAll('.hud .tools .dk, .hud .zoomer button, .hud .mini-wrap, .hud .zoom')].filter(e => e.offsetParent).filter(e => { const q = e.getBoundingClientRect(); return q.left < c.right && c.left < q.right && q.top < c.bottom && c.top < q.bottom; }).map(e => e.className);
    const onScreen = c.width > 60 && c.height > 20 && c.right <= innerWidth + 1 && c.left >= 0, chipText = chip.textContent;
    delete G.partners['peer-q']; G.huds[0].setCall(false, false, false);
    return { first, noMicYet, micAfterTap, after, replaced: replacedFirst, reallyNone, tapAsks, fresh, tapSaid, lateStopped, kept, micons, blocked, old, mute: !!mute, panelSays, shared, asksBefore: 1, buttons: btns.length, tall, outside, hit, onScreen, chipText, chip: [c.left, c.top, c.width, c.height].map(Math.round) };
  });
  const errs = P.errors; await P.ctx.close();
  ok((r.first.includes('mictap') || r.first.includes('micdenied')) && !r.first.includes('nomic') && r.noMicYet && r.tapAsks === 1 && r.micAfterTap && r.after.includes('micon') && r.replaced === 1 && r.reallyNone.includes('nomic')
    && r.fresh === 1 && r.tapSaid[0] === 'micask' && r.tapSaid.includes('micon') && r.lateStopped && r.kept && r.micons === 1 && r.blocked.includes('micdenied') && !r.blocked.includes('mictap')
    && r.old.includes('micold') && !r.old.includes('nomic') && r.mute && /Safari/.test(r.panelSays) && r.shared === 1
    && r.buttons >= 4 && !r.tall.length && !r.outside && !r.hit.length && r.onScreen && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return 'microphone: "tap 🎙️ Microphone on" (not "no microphone"), not asked again on every tap, on from the button and put into the open call; real "no microphone" still said; #55: a hung try does not block a tap (asks afresh, "Asking…" then on, the late answer stopped), blocked after a tap says how to allow it (also in the Friends panel), an iPhone older than 14.3 is told so; Friends: ' + r.buttons + ' buttons fit, no word broken; the friend bar touches no button';
});

await check('tienlen', async () => {
  // Tiến Lên deals the cards (owner, round G): cards fly from a deck in the middle to each player in turn, the hand
  // fills up as they arrive, and play starts with 13 cards each
  const P = await open(b, { w: 900, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, wait = ms => new Promise(r => setTimeout(r, ms)), seen = { fly: 0, deck: false, handSizes: new Set() };
    G.playGame(0, 'tienlen', 'replay');
    const t0 = performance.now();
    while (performance.now() - t0 < 6000) {
      seen.fly = Math.max(seen.fly, document.querySelectorAll('.tl-fly').length); seen.deck = seen.deck || !!document.querySelector('.tl-deck');
      seen.handSizes.add(document.querySelectorAll('.tl-hand .tl-card').length);
      if (seen.deck && !document.querySelector('.tl-deck') && !seen.after) seen.after = { hand: document.querySelectorAll('.tl-hand .tl-card').length, opp: [...document.querySelectorAll('.tl-opp .n')].map(e => e.textContent.trim()) }; // (the moment dealing ends)
      await wait(40);
    }
    const { hand, opp } = seen.after || { hand: 0, opp: [] };
    document.querySelector('.gl .gl-x')?.click(); await wait(300);
    return { fly: seen.fly, deck: seen.deck, steps: seen.handSizes.size, hand, opp };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.deck && r.fly >= 1 && r.steps >= 6 && r.hand === 13 && r.opp.every(x => /13/.test(x)) && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `a deck in the middle, cards flying (up to ${r.fly} at once), the hand filled in ${r.steps} steps to 13; each player has 13`;
});

await check('netgames', async () => {
  // games with friends online (js/netgames.js, round G), two devices through the cloud relay: A invites B to Caro from
  // Pad → Friends, B taps Play, both boards show each move, A wins on both screens; then Oẳn tù tì with everyone:
  // both pick, both see both hands, first to 3 points wins
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { friendCode: 'GAMEA2', friendsOn: true, autoMeet: false, friends: [{ code: 'GAMEB3', name: 'Bin' }] } });
  const B = await open(b, { pre, w: 390, h: 760, lang: 'vi', touch: true, settings: { friendCode: 'GAMEB3', friendsOn: true, autoMeet: false, friends: [{ code: 'GAMEA2', name: 'Na' }] } });
  await pairKeys(A, B);
  for (const P of [A, B]) { await clear(P.page); await P.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; }); }
  await A.page.evaluate(async () => __Net.host(__sv.sendHello())); await A.page.evaluate(() => __sv.shareStatus());
  await B.page.waitForFunction(() => { const s = __Net.friends.status.GAMEA2; return s && s.online && s.room; }, null, { timeout: 30000 });
  await B.page.evaluate(() => { __sv.openPad(0, 'friend'); }); await B.page.waitForSelector('[data-joinf]'); await B.page.evaluate(() => document.querySelector('[data-joinf]').click());
  await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 45000 });
  await A.page.waitForFunction(() => Object.keys(__Net.remotes).length > 0, null, { timeout: 30000 });
  for (const P of [A, B]) await P.page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; });
  // Caro: A asks from the Friends tab, B says yes
  await A.page.evaluate(async () => { __sv.openPad(0, 'friend'); await new Promise(r => setTimeout(r, 500)); document.querySelector('[data-caro]').click(); await new Promise(r => setTimeout(r, 400)); document.querySelector('.gamelevel [data-lvl="1"]')?.click(); });
  await B.page.waitForSelector('.dialog .dch', { timeout: 20000 }); const ask = await B.page.evaluate(() => document.querySelector('.dialog .dtext').textContent); await B.page.evaluate(() => document.querySelector('.dialog .dch').click());
  for (const P of [A, B]) await P.page.waitForSelector('.gl .caro', { timeout: 20000 });
  // (a placed piece is marked .put: its emoji is swapped for a drawing, so the text is empty)
  const tap = async (P, i) => { await P.page.waitForFunction(i => { const c = document.querySelectorAll('.caro-c')[i]; return c && !c.classList.contains('put'); }, i); await P.page.evaluate(i => document.querySelectorAll('.caro-c')[i].click(), i); };
  const seen = async (P, i) => P.page.waitForFunction(i => document.querySelectorAll('.caro-c')[i].classList.contains('put'), i, { timeout: 20000 });
  for (const [P, Q, i] of [[A, B, 0], [B, A, 3], [A, B, 1], [B, A, 4], [A, B, 2]]) { await tap(P, i); await seen(Q, i); }
  for (const P of [A, B]) await P.page.waitForSelector('.gl-win', { timeout: 20000 });
  const caro = { a: await A.page.evaluate(() => document.querySelector('.gl-win p').textContent), b: await B.page.evaluate(() => document.querySelector('.gl-win p').textContent), wonCells: await B.page.evaluate(() => document.querySelectorAll('.caro-c.win').length) };
  for (const P of [A, B]) { await P.page.evaluate(() => document.querySelector('.gl-tapout')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await P.page.waitForTimeout(800); await P.page.evaluate(() => { document.querySelectorAll('.gl, .modal').forEach(m => m.remove()); __sv.paused = false; }); }
  // Oẳn tù tì with everyone: A rock, B scissors, three times
  await A.page.evaluate(async () => { __sv.openPad(0, 'friend'); await new Promise(r => setTimeout(r, 500)); document.querySelector('[data-rpsall]').click(); await new Promise(r => setTimeout(r, 400)); document.querySelector('.gamelevel [data-lvl="1"]')?.click(); });
  await B.page.waitForSelector('.dialog .dch', { timeout: 20000 }); await B.page.evaluate(() => document.querySelector('.dialog .dch').click());
  for (const P of [A, B]) await P.page.waitForSelector('.gl .rps-room', { timeout: 20000 });
  let hands = null;
  for (let round = 0; round < 3; round++) {
    for (const [P, k] of [[A, 0], [B, 2]]) { await P.page.waitForFunction(() => document.querySelectorAll('.gl .choice:not([disabled])').length === 3, null, { timeout: 20000 }); await P.page.evaluate(k => document.querySelectorAll('.gl .choice')[k].click(), k); }
    await A.page.waitForFunction(src => { eval(src); return [...document.querySelectorAll('.rps-p .h')].every(e => !/❔|✅/.test(window.withEmo(e))); }, withEmo, { timeout: 20000 });
    if (round === 0) hands = await B.page.evaluate(async src => { eval(src); await new Promise(r => setTimeout(r, 300)); return [...document.querySelectorAll('.rps-p .h')].map(e => window.withEmo(e)); }, withEmo);
  }
  for (const P of [A, B]) await P.page.waitForSelector('.gl-win', { timeout: 20000 });
  const rps = { a: await A.page.evaluate(() => document.querySelector('.gl-win p').textContent), b: await B.page.evaluate(() => document.querySelector('.gl-win p').textContent) };
  const errs = [...A.errors, ...B.errors]; await A.ctx.close(); await B.ctx.close();
  ok(/Caro/.test(ask) && /wins/.test(caro.a) && /thắng/.test(caro.b) && caro.wonCells === 3 && hands && hands.join('') === '✊✌️' && /champion/i.test(rps.a) && /thắng/.test(rps.b) && !errs.length, JSON.stringify({ ask, caro, hands, rps, errs }));
  return `Caro on two devices: "${ask.slice(0, 40)}…", every move on both boards, "${caro.a}" / "${caro.b}"; Oẳn tù tì: both hands shown (${hands.join(' ')}), "${rps.a}" / "${rps.b}"`;
});

await check('together', async () => {
  // playing together online (owner, round G/H), two devices through the cloud relay: a story read together (A turns the
  // page, B's page turns too); any game side by side with everyone's stars; following a friend; a pickup taken by one
  // is gone for the other ("… got it first"); and the real place opens inside the game, not in another app
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { friendCode: 'TOGA22', friendsOn: true, autoMeet: false, friends: [{ code: 'TOGB33', name: 'Bin' }] } });
  const B = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { friendCode: 'TOGB33', friendsOn: true, autoMeet: false, friends: [{ code: 'TOGA22', name: 'Na' }] } });
  await pairKeys(A, B);
  for (const P of [A, B]) { await clear(P.page); await P.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; }); }
  await A.page.evaluate(async () => __Net.host(__sv.sendHello())); await A.page.evaluate(() => __sv.shareStatus());
  await B.page.waitForFunction(() => { const s = __Net.friends.status.TOGA22; return s && s.online && s.room; }, null, { timeout: 30000 });
  await B.page.evaluate(() => { __sv.openPad(0, 'friend'); }); await B.page.waitForSelector('[data-joinf]'); await B.page.evaluate(() => document.querySelector('[data-joinf]').click());
  await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 45000 });
  await A.page.waitForFunction(() => Object.values(__sv.partners).some(P => P.pos.y > -40), null, { timeout: 30000 });
  const clean = async () => { for (const P of [A, B]) await P.page.evaluate(() => { document.querySelectorAll('.modal, .dialog, .gl, .theatre').forEach(m => m.remove()); __sv.paused = false; __sv.netGames.leave(); }); await A.page.waitForTimeout(600); };
  await clean();
  const accept = async () => { await B.page.waitForSelector('.dialog .dch', { timeout: 20000 }); await B.page.evaluate(() => document.querySelector('.dialog .dch').click()); };
  // 1. a story together
  await A.page.evaluate(() => __sv.inviteGame('tale-banhchung', null, 1)); await accept();
  for (const P of [A, B]) await P.page.waitForSelector('.theatre .th-text', { timeout: 20000 });
  await A.page.evaluate(() => document.querySelector('.theatre .th-next').click()); await A.page.waitForTimeout(400); await A.page.evaluate(() => document.querySelector('.theatre .th-next').click());
  await B.page.waitForFunction(() => /princes searched far and wide|youngest prince/.test(document.querySelector('.theatre .th-text').textContent), null, { timeout: 15000 }).catch(() => { });
  const tale = { a: await A.page.evaluate(() => document.querySelector('.theatre .th-text').textContent.slice(0, 40)), b: await B.page.evaluate(() => document.querySelector('.theatre .th-text').textContent.slice(0, 40)) };
  await clean();
  // 2. any game side by side: both see both names, and a star from A shows on B
  await A.page.evaluate(() => __sv.inviteGame('colors', null, 1)); await accept();
  for (const P of [A, B]) await P.page.waitForSelector('.gl .race', { timeout: 20000 });
  await A.page.evaluate(() => __sv.netGames.move(900, 3));
  await B.page.waitForFunction(() => /⭐3/.test(document.querySelector('.gl .race').textContent), null, { timeout: 15000 }).catch(() => { });
  // (10 Oct) only A's one move may be in the race: a story still winding down must not send its page turns into it
  const stray = await B.page.evaluate(() => [...__sv.netGames.session.moves.keys()].filter(n => n !== 900));
  const race = await B.page.evaluate(src => { eval(src); return window.withEmo(document.querySelector('.gl .race')).replace(/\s+/g, ' ').trim(); }, withEmo);
  await clean();
  // 3. follow a friend: A stands 25 m away, B follows
  await A.page.evaluate(() => { const h = __sv.heroes[0]; h.place(h.pos.x + 25, h.pos.z); });
  await B.page.waitForTimeout(1500);
  const idA = await B.page.evaluate(() => Object.keys(__sv.partners)[0]);
  await B.page.evaluate(id => __sv.followFriend(0, id), idA);
  await B.page.waitForFunction(() => { const P = Object.values(__sv.partners)[0], h = __sv.heroes[0]; return Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z) < 6; }, null, { timeout: 30000 }).catch(() => { });
  const follow = await B.page.evaluate(() => { const P = Object.values(__sv.partners)[0], h = __sv.heroes[0]; return Math.round(Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z)); });
  await B.page.evaluate(() => { __sv.heroes[0].followId = null; });
  // 4. first come, first served: A takes a pickup, B's is gone and says who got it
  const pick = await A.page.evaluate(() => { const it = __sv.interactables.find(i => /^g\d+$/.test(i.id) && i.visible()); it.act(__sv.heroes[0], __sv); return it.id; });
  await B.page.waitForFunction(id => { const it = __sv.interactables.find(i => i.id === id); return it && !it.visible() && it.st.by; }, pick, { timeout: 15000 }).catch(() => { });
  const claim = await B.page.evaluate(id => { const it = __sv.interactables.find(i => i.id === id); return { gone: !it.visible(), by: it.st.by || '' }; }, pick);
  // 5. the real place inside the game (playing online means a grown-up turned on Use the internet: no second gate, 10 Oct)
  // (round R privacy, 9 Oct) a grown-up's press and hold first, as it opens Google
  const real = await A.page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); (await import('/js/realworld.js')).openStreetView('opera'); await wait(300); const early = !!document.querySelector('.rvmap iframe'), g = document.querySelector('.rvgate .rv-ok'); if (g) { g.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(1900); } const f = document.querySelector('.rvmap iframe'); return { gate: !!g && !early, direct: !g && early, inGame: !!f, src: f ? f.src.slice(0, 40) : '' }; });
  const errs = [...A.errors, ...B.errors].filter(e => !/maps\.google|google\.com/.test(e)); await A.ctx.close(); await B.ctx.close();
  ok(tale.a === tale.b && /prince/.test(tale.b) && /⭐3/.test(race) && !stray.length && follow < 6 && claim.gone && claim.by && real.direct && real.inGame && !errs.length, JSON.stringify({ tale, race, stray, follow, claim, real, errs }));
  return `story page turned on both ("${tale.b}…"); side by side: "${race}"; following ended ${follow} m behind; pickup ${pick} gone for B ("${claim.by} got it first"); the real place opens in the game straight away (Use the internet is on: owner, 10 Oct; the gate itself is checked by realphotos)`;
});

await check('chests', async () => {
  // treasure chests for two (round G): a child alone on a stone hears that a friend is needed; two children (split
  // screen here; a friend online works the same) on the two stones open it: coins, a treat, and the best-friends sticker
  const P = await open(b, { w: 1280, h: 800, mode: 'split' }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, S = await import('/js/state.js'), wait = ms => new Promise(r => setTimeout(r, ms)), [h0, h1] = G.heroes, c = G.chests.chests[0];
    h0.profile.chests = {}; h1.profile.chests = {}; const coins0 = S.farm.coins, n = G.chests.chests.length;
    h0.place(c.plates[0].x, c.plates[0].z); h1.place(c.x + 30, c.z + 30); await wait(300); G.chests.tick();
    const alone = !!h0.profile.chests[c.id];
    h1.place(c.plates[1].x, c.plates[1].z); await wait(300); G.chests.tick();
    return { n, alone, open0: !!h0.profile.chests[c.id], open1: !!h1.profile.chests[c.id], coins: S.farm.coins - coins0, sticker: h0.profile.stickers.includes('🤝'), page: G.chests.html(h0.profile).includes('1/') };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.n >= 5 && !r.alone && r.open0 && r.open1 && r.coins === 40 && r.sticker && r.page && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.n} chests; one child alone: shut; two on the stones: open for both (+${r.coins} coins, a treat each, the best-friends sticker)`;
});

await check('types', async () => {
  // type checking (owner, round 30): the files that start with // @ts-check are checked against their JSDoc types
  // (js/state.js, js/netmsg.js, studio/core.cjs; tests/tsconfig.json lists them). Needs: cd tests && npm install
  const { execFileSync } = await import('child_process'), tsc = 'node_modules/.bin/tsc';
  if (!fs.existsSync(tsc)) return 'skipped (run npm install in tests)';
  try { execFileSync(tsc, ['-p', '.'], { encoding: 'utf8' }); } catch (e) { ok(false, ((e.stdout || '') + '').split('\n').slice(0, 8).join(' | ')); }
  const n = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8')).files.length;
  return `${n} files type-checked, no errors`;
});

await check('perf', async () => {
  // performance budgets (PERF-001…006, tests/perf-baseline.json): each number may only go down. The test browser draws
  // in software, so frames per second (PERF-002, ≥ 30 at quality Auto) is measured on real phones, not here.
  const base = JSON.parse(fs.readFileSync('perf-baseline.json', 'utf8'));
  // PERF-001's download is measured on the packed copy the website serves (owner, 10 Oct AEST), before compression
  const startMB = await (async () => { const S = await serveFolder(await packedSite()); try {
    const Q = await open(b, { w: 1024, h: 700, play: false, url: S.url });
    const mb = await Q.page.evaluate(() => performance.getEntriesByType('resource').concat(performance.getEntriesByType('navigation')).reduce((a, e) => a + (e.encodedBodySize || e.transferSize || 0), 0) / 1e6);
    await Q.ctx.close(); return mb; } finally { S.close(); } })();
  const P = await open(b, { w: 1024, h: 700, play: false });
  // the map picture: painted once after the title screen, then read back from the device on the next start
  const pic = async () => { await P.page.waitForFunction(() => __sv.mapPic && __sv.mapPic.ready && __sv.bootTimes, null, { timeout: 60000 }); return P.page.evaluate(() => ({ from: __sv.mapPic.from, boot: __sv.bootTimes })); };
  const first = await pic();
  // (wait until the picture is really kept on the device, not a fixed time: saving it can take a moment while the valley finishes building)
  for (let i = 0; i < 75; i++) { if (await P.page.evaluate(async () => { try { const k = await caches.open('sv-world'); return (await k.keys()).some(r => r.url.includes('/map.png')); } catch (e) { return true; } })) break; await P.page.waitForTimeout(200); }
  await P.page.reload(); await P.page.waitForSelector('.screen.title', { timeout: 90000 }); const second = await pic();
  await P.page.evaluate(() => { __sv.renderer.setPixelRatio(.35); dispatchEvent(new Event('resize')); });
  ok(first.from === 'painted' && second.from === 'cache', 'map picture: ' + JSON.stringify({ first, second }));
  await start(P.page); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], W = await import('/js/world.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    // the middle frame of 3 s at a spot (the world's own frames: nothing extra is drawn; villagers walk in and out of view)
    const R = G.renderer, frames = async (x, z) => { h.place(x, z);
      for (let k = 0; k < 6; k++) { await wait(300); document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove()); G.paused = false; }
      const orig = R.render, got = []; R.render = function (...a) { orig.apply(this, a); got.push([R.info.render.calls, R.info.render.triangles]); };
      await wait(3000); R.render = orig; return got; };
    // (round T) at home, by Ông Cú, where every child starts; then in Lotus Village
    const home = await frames(W.PLATEAU.x - 3, W.PLATEAU.z - 4), got = await frames(W.VILLAGE.x, W.VILLAGE.z + 6);
    let texturePx = 0;
    G.scene.traverse(o => { for (const m of o.material ? [].concat(o.material) : []) for (const k in m) { const t = m[k], im = t && t.isTexture && t.image; if (im && im.width) texturePx = Math.max(texturePx, im.width, im.height); } });
    // 10 mini-games, each opened, left running a moment and closed; then memory and leftover page elements
    const ids = Object.keys((await import('/js/games/frame.js')).GAMES).slice(0, 10), gc = () => window.gc && window.gc();
    h.place(W.VILLAGE.x - 30, W.VILLAGE.z + 30); await wait(600); document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove()); G.paused = false;
    gc(); await wait(300); const heap0 = performance.memory.usedJSHeapSize, dom0 = document.getElementsByTagName('*').length;
    for (const id of ids) { G.playGame(0, id, 'replay'); await wait(700); document.querySelector('.gl .gl-x')?.click(); await wait(500); }
    await wait(800); gc(); await wait(300);
    const mid = (i, f = got) => f.map(g => g[i]).sort((a, b) => a - b)[f.length >> 1] || 0;
    return { drawCalls: mid(0), triangles: mid(1), drawCallsHome: mid(0, home), frames: Math.min(got.length, home.length), texturePx,
      heapGrowMB: Math.max(0, (performance.memory.usedJSHeapSize - heap0) / 1e6), domGrow: document.getElementsByTagName('*').length - dom0, games: ids.length };
  });
  const errs = P.errors; await P.ctx.close();
  // (round T) worldMs: from the start of the game's code to a built valley, on the second start (the map picture kept). The
  // test browser draws in software and its timings wander from run to run, so a start counts as slower only past 25 %.
  const got = Object.assign({ startMB, worldMs: second.boot.ready }, r), over = [], gap = [];
  for (const [k, B] of Object.entries(base)) { if (k.startsWith('/')) continue; const v = got[k]; if (v > B.max * (k === 'worldMs' ? 1.25 : 1.03) + (k === 'startMB' ? .05 : 0)) over.push(`${B.rule} ${k} ${+v.toFixed(2)} > ${B.max}`); if (v > B.target) gap.push(`${k} ${Math.round(v)} (budget ${B.target})`); }
  ok(r.frames > 0 && r.games === 10 && !over.length && !errs.length, JSON.stringify({ over, got, errs }));
  return `start ${startMB.toFixed(1)} MB in ${(second.boot.ready / 1000).toFixed(1)} s (map picture kept on the device), home ${r.drawCallsHome} draws, village ${r.drawCalls} draws / ${(r.triangles / 1000).toFixed(0)}k triangles, largest texture ${r.texturePx}px, after 10 games +${r.heapGrowMB.toFixed(1)} MB and ${r.domGrow} elements` + (gap.length ? `; over budget (being reduced): ${gap.join(', ')}` : '');
});

await check('battery', async () => {
  // (battery round, owner 12 Oct AEDT: "my phone gets very hot; on my MacBook it takes almost 10 % at once"; PERF-006)
  // a computer draws at most 60 times a second even on a 120 Hz screen (30 on Fast, Pretty 60, Pretty+ as fast as the
  // screen), phones and tablets 30; the title screen 20; after 15 s with nothing moving a few times a second, and any
  // touch brings it straight back; on Auto the picture is never sharper than 1.5x; far people standing still are one
  // shape; the drawing and battery statistics are recorded and sent only with Analytics on.
  const hz120 = () => { let id = 0; const q = new Map(); window.requestAnimationFrame = cb => { const k = ++id; q.set(k, setTimeout(() => { q.delete(k); cb(performance.now()); }, 1000 / 120)); return k; }; window.cancelAnimationFrame = k => { clearTimeout(q.get(k)); q.delete(k); }; };
  const rate = (page, ms = 2000) => page.evaluate(async ms => { const R = __sv.renderer, o = R.render; let n = 0, ticks = 0; R.render = function (...a) { n++; return o.apply(this, a); };
    let on = true; const tick = () => { ticks++; if (on) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    await new Promise(r => setTimeout(r, ms)); on = false; R.render = o; return { draws: n * 1000 / ms, ticks: ticks * 1000 / ms }; }, ms);
  const capOf = async (opts) => { const P = await open(b, { w: 360, h: 260, play: false, ...opts }); const c = await P.page.evaluate(() => __sv.battery.frameMs); await P.ctx.close(); return Math.round(c * 10) / 10; };
  // the picture's sharpness on a 3x screen with Graphics on Auto, as the game set it (then the test browser draws small)
  const pr = await (async () => { const P = await open(b, { w: 360, h: 260, dpr: 3, play: false, settings: { quality: 'auto' } }); const v = await P.page.evaluate(() => Math.max(__sv.battery.prStart, __sv.battery.prMax)); await P.ctx.close(); return v; })();
  // the caps for each kind of screen and Graphics setting (the cap is set when the game opens)
  const caps = { computerAuto: await capOf({ settings: { quality: 'auto' } }), computerFast: await capOf({ settings: { quality: 'low' } }), computerPretty: await capOf({ settings: { quality: 'high' } }),
    computerPrettyPlus: await capOf({ settings: { quality: 'max' } }), phoneAuto: await capOf({ touch: true, settings: { quality: 'auto' } }), phonePretty: await capOf({ touch: true, settings: { quality: 'high' } }) };
  // the game's own frame gate on a pretend clock: one second of a 60, 120 and 144 Hz screen at each cap
  const gate = async page => page.evaluate(() => { const B = __sv.battery, run = (hz, cap) => { const st = { due: 0 }; let n = 0; for (let t = 1000; t < 3000; t += 1000 / hz + (Math.sin(t) * .3)) if (B.gate(st, t, cap)) n++; return n / 2; };
    return { at60: [60, 120, 144].map(hz => run(hz, 1000 / 60)), at30: [60, 120, 144].map(hz => run(hz, 1000 / 30)), title: [60, 120].map(hz => run(hz, B.titleMs)), idle: [60, 120].map(hz => run(hz, 1000 / B.idleFps)), none: run(120, 0) }; });
  const want = { computerAuto: 16.7, computerFast: 33.3, computerPretty: 16.7, computerPrettyPlus: 0, phoneAuto: 33.3, phonePretty: 16.7 };
  const capsOk = Object.keys(want).every(k => caps[k] === want[k]);
  // a computer with a sharp 120 Hz screen, Graphics on Auto, Analytics on
  const P = await open(b, { w: 360, h: 260, play: false, pre: hz120, settings: { quality: 'auto', countPlayers: true } });
  await P.page.evaluate(() => { window.__svHelloTest = 'manual'; });
  const gates = await gate(P.page);
  const near = (v, w) => Math.abs(v - w) <= 1.5, gatesOk = gates.at60.every(v => near(v, 60)) && gates.at30.every(v => near(v, 30)) && gates.title.every(v => near(v, 20)) && gates.idle.every(v => near(v, 8)) && near(gates.none, 120);
  const title = await rate(P.page);
  await start(P.page); await clear(P.page);
  await P.page.evaluate(async () => { const W = await import('/js/world.js'); __sv.heroes[0].place(W.PLATEAU.x - 3, W.PLATEAU.z - 4); });
  await P.page.mouse.move(200, 150); await P.page.mouse.move(210, 160);
  const play = await rate(P.page);
  // far people standing still: one shape (the still copy); near people and the child keep every moving part
  const people = await P.page.evaluate(async () => { const { OUTLINED } = await import('/js/avatar.js'), h = __sv.heroes[0], v = { far: 0, farStill: 0, near: 0, nearStill: 0, mine: !!h.av._still };
    for (const A of OUTLINED) { if (!A.root.parent || A === h.av) continue; const p = A.root.getWorldPosition(A.root.position.clone()), d = Math.hypot(p.x - h.pos.x, p.z - h.pos.z);
      if (d > 24 && A._calm >= 2) { v.far++; if (A._still && A.still && A.still.visible && !A.rig.visible) v.farStill++; } else if (d < 16) { v.near++; if (A._still) v.nearStill++; } }
    return v; });
  // nothing moves for 15 s: the valley is drawn a few times a second; a touch brings it back at once (up to 90 s: the test
  // browser draws a few frames a second, so the game's clock and the camera settling after the move run slow)
  const idleWait = await P.page.evaluate(async () => { const t0 = performance.now(); while (!__sv.battery.idle && performance.now() - t0 < 90000) await new Promise(r => setTimeout(r, 250)); return { idle: __sv.battery.idle, s: Math.round((performance.now() - t0) / 100) / 10 }; });
  const idle = await rate(P.page, 3000);
  await P.page.mouse.move(100, 100);
  const woke = await P.page.evaluate(() => ({ idle: __sv.battery.idle, cap: __sv.battery.capMs() }));
  // the statistics: one minute's sample goes into the outbox and is sent with Analytics on; with it off, nothing
  const sent = [];
  await P.page.route('**/api/hello', async r => { sent.push(r.request().postDataJSON()); await r.fulfill({ status: 204 }); });
  const stats = await P.page.evaluate(async () => { const M = await import('/js/players.js'), S = await import('/js/state.js'), out = () => JSON.parse(localStorage.getItem('sv2_hello_out') || '{"days":{}}');
    S.settings.countPlayers = true; M.sampleDrawing(__sv); const on = Object.values(out().days).map(d => d.b).filter(Boolean)[0] || null;
    const sentOn = await M.flush(false);
    // a minute with nothing moving: no playing frames (frames a second stay about playing), the minute counts as idle
    localStorage.removeItem('sv2_hello_out'); __sv.battery.take(); __sv.battery.input = __sv.battery.moved = -1e9; __sv.battery.idle = true;
    await new Promise(r => setTimeout(r, 2500)); M.sampleDrawing(__sv); const idleOnly = Object.values(out().days).map(d => d.b).filter(Boolean)[0] || null; __sv.battery.input = performance.now(); __sv.battery.idle = false;
    localStorage.removeItem('sv2_hello_out'); S.settings.countPlayers = false; await new Promise(r => setTimeout(r, 1500)); M.sampleDrawing(__sv);
    const off = Object.values(out().days).some(d => d.b); const sentOff = await M.flush(false); S.settings.countPlayers = true;
    return { on, idleOnly, sentOn, off, sentOff, pr100: Math.round(__sv.renderer.getPixelRatio() * 100) }; });
  const errs = P.errors; await P.ctx.close();
  const body = sent[0] && sent[0].days && sent[0].days[0] && sent[0].days[0].b;
  const got = { caps, gates, title, play, pr, people, idleWait, idle, woke, stats, sentB: body || null, sends: sent.length, errs };
  // (the test browser draws in software, a few frames a second: the measured rates can only show the caps are not passed)
  ok(capsOk && gatesOk && title.draws <= 21.5 && play.draws <= 62 && pr <= 1.5 && people.far > 0 && people.farStill === people.far && people.nearStill === 0 && !people.mine
    && idleWait.idle && idleWait.s >= 15 && idle.draws <= 9 && !woke.idle && Math.round(woke.cap * 10) / 10 === 16.7
    && stats.on && stats.on.length === 10 && stats.on[0] === 1 && stats.on[1] > 0 && stats.on[3] > 0 && stats.on[4] === stats.pr100 && stats.on[9] > 0 && stats.idleOnly && stats.idleOnly[1] === 0 && stats.idleOnly[5] === 1 && stats.sentOn && body && body[1] > 0 && sent.length === 1 && !stats.off && !stats.sentOff && !errs.length, JSON.stringify(got));
  return `caps (ms a frame) ${JSON.stringify(caps)}; frame gate a second at 60/120/144 Hz: ${gates.at60.join('/')} (cap 60), ${gates.at30.join('/')} (cap 30), title ${gates.title.join('/')}, idle ${gates.idle.join('/')}; measured in the test browser: title ${title.draws.toFixed(0)} a second, valley ${play.draws.toFixed(0)}, idle after ${idleWait.s} s ${idle.draws.toFixed(1)}; pixel ratio ${pr} on a 3x screen; ${people.farStill}/${people.far} far people still, ${people.near} near moving; statistics ${JSON.stringify(stats.on)} sent once, nothing with Analytics off`;
});

await check('startup', async () => {
  // (Analytics & Infra, 11 Oct, #36, owner: "start-up is slow every time") the packed copy the website serves, at tablet
  // speed (the processor 4 times slower, compressed like Netlify), with the service worker on: the first start (download,
  // title painted, valley ready) and the second start from the device's saved copy (valley ready, the longest time the
  // page froze). Each number is a ratchet in startup-baseline.json (may only go down; timings wander, so 25 % slack).
  const base = JSON.parse(fs.readFileSync('startup-baseline.json', 'utf8'));
  const S = await serveFolder(await packedSite(), { gzip: true });
  try {
    const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true });
    await ctx.addInitScript(seedPlayers);
    await ctx.addInitScript(() => { try { localStorage.setItem('sv2_settings', JSON.stringify({ voice: false, sound: false, music: false, autoPack: false, quality: 'low' })); } catch (e) { }
      window.__st = { frames: [] }; const f = () => { const t = Math.round(performance.now()); __st.frames.push(t); if (!__st.title && document.querySelector('.screen.title')) __st.title = t; requestAnimationFrame(f); }; requestAnimationFrame(f); }); // (the clock, not the frame's own time stamp: a busy page hands out frames stamped before it was busy)
    const page = await ctx.newPage(), errs = []; page.on('pageerror', e => errs.push(e.message));
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    // (owner, 11 Oct AEDT) how fast this machine is, measured in the same run at the same slowed speed: a fixed piece of
    // work like building the valley (numbers, arrays, small objects), the middle of 7 tries. The time limits are set on
    // the machine that measured `machineMs.ref`; a slower machine gets them stretched by as much as it is slower, a faster
    // one gets them shortened, so only the game getting slower fails the check (the limits themselves never go up).
    const machineMs = await page.evaluate(() => { const one = () => { const t = performance.now(); let a = 0; const f = new Float32Array(60000), o = [];
      for (let k = 0; k < 40; k++) { for (let i = 0; i < f.length; i++) { f[i] = Math.sin(i * .01 + k) * Math.sqrt(i + 1); a += f[i]; } for (let i = 0; i < 4000; i++) o.push({ x: i, y: a % 7, z: [i, k] }); o.sort((p, q) => p.y - q.y || q.x - p.x); o.length = 0; }
      return performance.now() - t + (a > 1e300 ? 1 : 0); }; const r = []; for (let i = 0; i < 7; i++) r.push(one()); return r.sort((x, y) => x - y)[3]; });
    const speed = Math.min(3, Math.max(.5, machineMs / base.machineMs.ref));
    const read = async () => { await page.waitForFunction(() => window.__sv && __sv.bootTimes, null, { timeout: 300000 }); await page.waitForTimeout(1000);
      return page.evaluate(() => { const end = __sv.bootTimes.start + __sv.bootTimes.ready, fr = __st.frames.filter(t => t <= end); let gap = 0; for (let i = 1; i < fr.length; i++) gap = Math.max(gap, fr[i] - fr[i - 1]);
        const all = performance.getEntriesByType('resource').concat(performance.getEntriesByType('navigation'));
        return { kb: Math.round(all.reduce((a, e) => a + (e.transferSize || 0), 0) / 1024), title: __st.title, ready: end, freeze: gap, steps: __sv.bootTimes }; }); };
    await page.goto(S.url); const first = await read();
    await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 300000 }); await page.waitForTimeout(2000);
    await page.reload(); const second = await read();
    await ctx.close();
    const got = { firstKB: first.kb, firstTitleMs: first.title, firstReadyMs: first.ready, secondReadyMs: second.ready, secondFreezeMs: second.freeze, secondKB: second.kb }, over = [];
    for (const [k, B] of Object.entries(base)) { if (k.startsWith('/') || B.max === undefined) continue; const lim = k.endsWith('KB') ? B.max * 1.03 : B.max * speed * 1.25; if (!(got[k] <= lim)) over.push(`${B.rule} ${k} ${got[k]} > ${k.endsWith('KB') ? B.max : `${B.max} x ${speed.toFixed(2)} (machine speed) = ${Math.round(B.max * speed)}`}`); }
    // the slowest building steps on the second start, for the report (G.bootTimes: ms since the game's code began)
    const st = Object.entries(second.steps).filter(([k]) => k !== 'start').sort((x, y) => x[1] - y[1]), slow = st.map(([k, v], i) => [k, v - (i ? st[i - 1][1] : 0)]).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => `${k} ${(v / 1000).toFixed(1)} s`);
    ok(!over.length && !errs.length, JSON.stringify({ over, got, machineMs: Math.round(machineMs), speed: +speed.toFixed(2), errs }));
    return `machine ${Math.round(machineMs)} ms (x${speed.toFixed(2)} of the reference); tablet speed: first start ${first.kb} KB, title ${(first.title / 1000).toFixed(1)} s, valley ready ${(first.ready / 1000).toFixed(1)} s; second start ${second.kb} KB from the network, ready ${(second.ready / 1000).toFixed(1)} s, longest freeze ${(second.freeze / 1000).toFixed(1)} s; slowest steps ${slow.join(', ')}`;
  } finally { S.close(); }
});

await check('saves', async () => {
  // progress survives: the main save is wiped (as a browser might do), and the game brings it back by itself
  const P = await open(b, { w: 800, h: 600 }); await clear(P.page);
  await P.page.evaluate(async () => { const S = await import('/js/state.js'); S.farm.coins = 4321; S.profiles[0].orbs = 7; S.profiles[0].postcards = { opera: true }; S.saveProfiles(true); });
  await P.page.waitForTimeout(4500);
  // close the game, then wipe the main save from another page of the same site, then open the game again
  const Q = await P.ctx.newPage(); await P.page.close();
  await Q.goto(URL + 'manifest.webmanifest'); await Q.evaluate(() => { localStorage.removeItem('sv2_profiles'); localStorage.removeItem('sv2_farm'); });
  await Q.goto(URL); await Q.waitForSelector('.screen.title', { timeout: 30000 });
  P.page = Q;
  const r = await P.page.evaluate(async () => { const S = await import('/js/state.js'); return { coins: S.farm.coins, orbs: S.profiles[0].orbs, pc: !!(S.profiles[0].postcards || {}).opera, restored: S.restoredFromCopy, kept: !!localStorage.getItem('sv2_profiles') }; });
  await P.ctx.close();
  ok(r.coins === 4321 && r.orbs === 7 && r.pc && r.restored && r.kept, JSON.stringify(r));
  return 'wiped main save restored from the safe copy (coins, orbs, postcards)';
});

await check('meet', async () => {
  // friends are told, never moved (round O, owner): two friends on each other's list start playing; each gets a card
  // "🟢 … is playing" and nobody is put in a room by themselves; one taps 📨 Invite (a room starts), the other gets the
  // invitation, taps Join, and they are in one room seeing each other's names. One of them never switched "friends
  // can see me" on: having a friend on the list switches it on from round 28.
  const up = await fetch('http://127.0.0.1:9000/myapp/').then(r => r.ok).catch(() => false);
  if (!up) return 'skipped (no local PeerJS server on 127.0.0.1:9000)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9000, path: '/myapp', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 700, h: 500, settings: { friendCode: 'MEETA2', friendsOn: false, friends: [{ code: 'MEETB3', name: 'Bin' }] } });
  const B = await open(b, { pre, w: 700, h: 500, lang: 'vi', settings: { friendCode: 'MEETB3', friendsOn: true, friends: [{ code: 'MEETA2', name: 'Na' }] } });
  await pairKeys(A, B);
  // (the friend's card is shown once and may already be up: tidy everything else, keep it)
  for (const P of [A, B]) await P.page.evaluate(async () => { document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); __sv.paused = false; window.__Net = (await import('/js/net.js')).Net; });
  await B.page.waitForSelector('.friendnote [data-inv]', { timeout: 90000 });
  const noteText = await B.page.textContent('.friendnote');
  await B.page.waitForTimeout(10000);
  const alone = await Promise.all([A, B].map(P => P.page.evaluate(() => ({ partners: Object.keys(__sv.partners).length, role: __Net.role }))));
  await B.page.click('.friendnote [data-inv]');
  await A.page.waitForSelector('.dialog .dchoices button', { timeout: 60000 }); await A.page.waitForTimeout(600); await A.page.evaluate(() => document.querySelector('.dialog .dchoices button').click()); // (the choices bounce in)
  const met = P => P.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 90000 });
  await Promise.all([met(A), met(B)]);
  const r = await Promise.all([A, B].map(P => P.page.evaluate(() => ({ role: __Net.role, code: __Net.code, names: Object.values(__sv.partners).map(p => p.name) }))));
  const errs = A.errors.concat(B.errors); await A.ctx.close(); await B.ctx.close();
  ok(alone.every(x => !x.partners && !x.role), 'friends were put in a room by themselves: ' + JSON.stringify(alone));
  ok(r[1].role === 'host' && r[0].role === 'guest' && r[0].code === r[1].code && !errs.length, JSON.stringify({ r, errs }));
  return `"${noteText.replace(/\s+/g, ' ').trim().slice(0, 60)}…"; nobody moved for 10 s; 📨 Invite → Join: room ${r[1].code}, names shown`;
});

await check('cloud', async () => {
  // two devices that can never link directly (the meeting service points nowhere), like far-away networks:
  // they must find each other through the cloud relay (a local MQTT broker on 127.0.0.1:9001 stands in for
  // the public ones), see each other's status, join from the friends list, move, meet and talk
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 640, lang: 'en', settings: { friendCode: 'AAAAA2', friendsOn: true, autoMeet: false, friends: [{ code: 'BBBBB3', name: 'Bin' }] } });
  const B = await open(b, { pre, w: 390, h: 760, lang: 'vi', touch: true, settings: { friendCode: 'BBBBB3', friendsOn: true, autoMeet: false, friends: [{ code: 'AAAAA2', name: 'Na' }] } });
  await pairKeys(A, B);
  // each player has a photo: it must reach the friend through the cloud too (locked with their pair key)
  const photo = c => { const k = document.createElement('canvas'); k.width = k.height = 64; const g = k.getContext('2d'); g.fillStyle = c; g.fillRect(0, 0, 64, 64); __sv.heroes[0].profile.photo = k.toDataURL('image/jpeg', .8); };
  for (const [P, c] of [[A, '#ff0000'], [B, '#0000ff']]) { await clear(P.page); await P.page.evaluate(async c => { window.__Net = (await import('/js/net.js')).Net; }, c); await P.page.evaluate(photo, c); }
  const code = await A.page.evaluate(async () => __Net.host(__sv.sendHello()));
  await A.page.evaluate(async () => { const S = (await import('/js/world.js')).CITIES.find(c => c.id === 'saigon'); __sv.heroes[0].place(S.x, S.z); __sv.shareStatus(); });
  await B.page.waitForFunction(() => { const s = __Net.friends.status.AAAAA2; return s && s.online && s.room; }, null, { timeout: 30000 });
  const status = await B.page.evaluate(() => { __sv.openPad(0, 'friend'); return new Promise(r => setTimeout(() => r(document.querySelector('.frow').innerText.replace(/\n+/g, ' ')), 600)); });
  await B.page.evaluate(() => document.querySelector('[data-joinf]').click());
  await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 45000 });
  await B.page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; });
  await A.page.waitForFunction(() => Object.values(__sv.partners).some(P => P.pos.y > -40), null, { timeout: 20000 });
  await B.page.waitForFunction(() => Object.values(__sv.partners).some(P => P.pos.y > -40), null, { timeout: 20000 });
  await A.page.waitForTimeout(3000);
  const q = await A.page.evaluate(() => __Net.quality(Object.keys(__Net.remotes)[0]));
  await A.page.evaluate(() => __sv.askFriendToCome(__sv.heroes[0], Object.keys(__sv.partners)[0]));
  await B.page.waitForSelector('.dialog .dch', { timeout: 15000 }); await B.page.evaluate(() => document.querySelector('.dialog .dch').click());
  for (let k = 0; k < 40; k++) { const done = await B.page.evaluate(() => { const h = __sv.heroes[0]; if (!h.walkTo) return true; const dx = h.walkTo.x - h.pos.x, dz = h.walkTo.z - h.pos.z, d = Math.hypot(dx, dz); h.place(h.pos.x + dx / d * Math.min(d - 1, 8), h.pos.z + dz / d * Math.min(d - 1, 8)); return false; }); if (done) break; await B.page.waitForTimeout(300); }
  await B.page.waitForTimeout(1500);
  const d = await B.page.evaluate(() => { const P = Object.values(__sv.partners)[0], h = __sv.heroes[0]; return Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z); });
  await B.page.evaluate(() => __sv.emote(0, 'hi')); await A.page.waitForTimeout(1500);
  const heard = await A.page.evaluate(() => __sv.bubbles.length);
  // photos arrived both ways (red at B, blue at A)
  const pix = P => P.page.evaluate(() => new Promise(r => { const p = Object.values(__Net.remotes)[0]?.photo; if (!p) return r(null); const im = new Image(); im.onload = () => { const k = document.createElement('canvas'); k.width = k.height = 8; const g = k.getContext('2d'); g.drawImage(im, 0, 0, 8, 8); r([...g.getImageData(4, 4, 1, 1).data].slice(0, 3)); }; im.src = p; }));
  const photoAtB = await pix(B), photoAtA = await pix(A);
  // a third friend comes in through the cloud: everyone must see everyone
  const C = await open(b, { pre, w: 600, h: 500, lang: 'en' }); await clear(C.page);
  await C.page.evaluate(async c => { window.__Net = (await import('/js/net.js')).Net; __Net.join(c, __sv.sendHello()); const S = (await import('/js/world.js')).CITIES.find(c => c.id === 'saigon'); __sv.heroes[0].place(S.x + 4, S.z - 6); }, code);
  // (B came straight in as a saved friend; C is not on the list, so C knocks through the cloud and A lets C in)
  await A.page.waitForSelector('.knockpop [data-in]', { timeout: 45000 }); await A.page.evaluate(() => document.querySelector('.knockpop [data-in]').click());
  await C.page.waitForFunction(() => Object.values(__sv.partners).filter(P => P.pos.y > -40).length >= 2, null, { timeout: 45000 }).catch(() => { });
  await B.page.waitForFunction(() => Object.values(__sv.partners).filter(P => P.pos.y > -40).length >= 2, null, { timeout: 20000 }).catch(() => { });
  const three = [await A.page.evaluate(() => Object.keys(__sv.partners).length), await B.page.evaluate(() => Object.values(__sv.partners).filter(P => P.pos.y > -40).length), await C.page.evaluate(() => Object.values(__sv.partners).filter(P => P.pos.y > -40).length)];
  await C.ctx.close();
  const bId = await B.page.evaluate(() => __Net.me);
  await B.page.evaluate(() => __Net.close()); await A.page.waitForTimeout(3000);
  const left = await A.page.evaluate(id => !__sv.partners[id], bId);
  const errs = A.errors.concat(B.errors, C.errors).filter(e => !/WebSocket|ERR_CONNECTION|peerjs/i.test(e)); await A.ctx.close(); await B.ctx.close();
  const red = photoAtB && photoAtB[0] > 180 && photoAtB[2] < 80, blue = photoAtA && photoAtA[2] > 180 && photoAtA[0] < 80;
  ok(/TP\. Hồ Chí Minh/.test(status) && /1\d{3}|[2-9]\d{3}/.test(status) && q && q.route === 'cloud' && q.rtt && d < 6 && heard > 0 && red && blue && three.every(n => n >= 2) && left && !errs.length, JSON.stringify({ status, q, d, heard, photoAtB, photoAtA, three, left, errs }));
  return `status "${status}", ping ${q.rtt} ms through the cloud, met at ${d.toFixed(1)} m, talk bubble received, photos both ways, 3 players all see each other, leaving noticed`;
});

await check('photo', async () => {
  // Camera → Take picture → "Save to my photos": on an iPhone the share sheet gets a full-size picture file (its
  // "Save Image" puts it in Photos); on a computer or Android the picture downloads. The Album's ⬇ does the same.
  const out = {};
  for (const kind of ['computer', 'iphone']) {
    const P = await open(b, kind === 'iphone' ? { w: 390, h: 760, touch: true, pre: () => { Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' }); navigator.canShare = d => !!(d && d.files); navigator.share = async d => { window.__shared = d.files.map(f => ({ name: f.name, type: f.type, size: f.size })); }; } } : { w: 1000, h: 700 });
    await clear(P.page);
    const before = await P.page.evaluate(() => __sv.heroes[0].profile.album.length);
    await P.page.evaluate(() => __sv.openPad(0, 'cam')); await P.page.waitForSelector('#snap'); await P.page.click('#snap');
    await P.page.waitForSelector('#toPhone:not([hidden])', { timeout: 5000 });
    const r = { added: (await P.page.evaluate(() => __sv.heroes[0].profile.album.length)) - before };
    if (kind === 'iphone') { await P.page.click('#toPhone'); await P.page.waitForFunction(() => window.__shared, null, { timeout: 5000 }); r.shared = await P.page.evaluate(() => window.__shared); await P.page.screenshot({ path: 'out/photo-iphone.png' }); }
    else {
      const [dl] = await Promise.all([P.page.waitForEvent('download', { timeout: 5000 }), P.page.click('#toPhone')]);
      const fp = await dl.path(); r.download = { name: dl.suggestedFilename(), size: fs.statSync(fp).size };
      await P.page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; __sv.openPad(0, 'album'); });
      await P.page.waitForSelector('[data-dl]', { state: 'attached' });
      const [dl2] = await Promise.all([P.page.waitForEvent('download', { timeout: 5000 }), P.page.evaluate(() => document.querySelector('[data-dl]').click())]);
      r.album = dl2.suggestedFilename();
    }
    r.errs = P.errors; await P.ctx.close(); out[kind] = r;
  }
  const c = out.computer, i = out.iphone;
  ok(c.added === 1 && /^sparkle-valley-\d{8}-\d{6}\.jpg$/.test(c.download.name) && c.download.size > 5000 && /\.jpg$/.test(c.album) && i.added === 1 && i.shared && i.shared.length === 1 && i.shared[0].type === 'image/jpeg' && i.shared[0].size > 5000 && !c.errs.length && !i.errs.length, JSON.stringify(out));
  return `computer: ${c.download.name} downloaded (${Math.round(c.download.size / 1024)} KB), Album ⬇ downloads too; iPhone: the share sheet got ${i.shared[0].name} (${Math.round(i.shared[0].size / 1024)} KB) for "Save Image"`;
});

await check('netmsg', async () => {
  // PRIV-003: every message from another device is checked in one place (js/netmsg.js) before the game sees it
  const P = await open(b, { w: 600, h: 400, play: false });
  const r = await P.page.evaluate(async () => {
    const M = await import('/js/netmsg.js'), c = (d, f = 'p1') => M.checkMsg(d, f), out = {};
    out.unknown = [c({ t: 'knock' }), c({ t: 'status', key: 'removed' }), c({ t: 'constructor' }), c({ t: '__proto__' })].every(x => x === null);
    out.badMove = c({ t: 's', x: NaN, y: 0, z: 0, yaw: 0 }) === null && c({ t: 's', x: 1e9, y: 0, z: 0, yaw: 0 }) === null && c({ t: 's', y: 0, z: 0, yaw: 0 }) === null;
    const okMove = c({ t: 's', x: 1, y: 2, z: 3, yaw: .5, st: 'run', sp: 3, evil: '<img>' }); out.extraRemoved = okMove && okMove.x === 1 && !('evil' in okMove);
    out.trade = c({ t: 'offer', id: 'o1', give: { coins: 1e9 }, want: {} }) === null && c({ t: 'offer', id: 'o2', give: { items: { apple: 2 } }, want: { coins: 5 } }) !== null && c({ t: 'offer', id: 'o3', give: { items: { 'a<b': 1 } }, want: {} }) === null;
    out.emote = c({ t: 'emote', id: 'x'.repeat(80) }) === null && c({ t: 'emote', id: 'hi' }, 'p2') !== null;
    M.resetRates(); let passed = 0; for (let i = 0; i < 100; i++) if (c({ t: 's', x: 0, y: 0, z: 0, yaw: 0 }, 'flood')) passed++; out.flood = passed;
    out.other = c({ t: 's', x: 0, y: 0, z: 0, yaw: 0 }, 'calm') !== null; // one player's flood doesn't block another
    out.bigHello = c({ t: 'hello', name: 'A', photo: 'x'.repeat(200000) }, 'p3') === null;
    out.relayFields = c({ t: 'ping', ts: Date.now(), mid: 'm1', _id: 'abcdefghijklmnop', _topic: 'sparklevalley/v2/room/' + 'f'.repeat(32) }, 'p4') !== null // (the relay's routing fields don't count)
      && c({ t: 'pong', from: 'sv-c-8rkqujds', to: 'sparkle-valley-v2-2505', ts: Date.now(), mid: 'm9505uqo14', _id: 'fm8qycc1mutbunog' }, 'p5') !== null; // (a real answer with long ids)
    return out;
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.unknown && r.badMove && r.extraRemoved && r.trade && r.emote && r.flood === 40 && r.other && r.bigHello && r.relayFields && !errs.length, JSON.stringify(r));
  return 'unknown kinds dropped (a stranger can no longer fake a knock or a status), bad moves and trades dropped, unknown fields removed, a flood of 100 moves cut to 40 a second';
});

await check('knock', async () => {
  // A room code can be guessed, so newcomers knock (6 digits from round R privacy, 9 Oct). Through the cloud relay only (the harder path):
  // the starter's panel shows the code as digits and animals (no QR code: owner, round 30); a child types the code with
  // the animal pad and knocks (microphone off, nothing of the room heard); "No thanks" sends them away for good; a
  // stranger who skips knocking and just sends moves is ignored; another child types the numbers and is let in.
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { autoMeet: false } });
  await clear(A.page); await A.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; });
  const code = await A.page.evaluate(async () => __Net.host(__sv.sendHello()));
  const panel = await A.page.evaluate(() => { __sv.openPad(0, 'friend'); return new Promise(r => setTimeout(() => { const c = document.querySelector('.rcode'); if (!c) return r(null); r({ digits: [...c.querySelectorAll('.rd b')].map(x => x.textContent).join(''), animals: c.querySelectorAll('.rd svg.art').length, qr: !!document.querySelector('.rqrb, .rqr') }); }, 700)); });
  await A.page.screenshot({ path: 'out/knock-code.png' });
  await A.page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false; });
  // D types the code on the animal pad
  const D = await open(b, { pre, w: 390, h: 760, lang: 'vi', touch: true, settings: { autoMeet: false } });
  await clear(D.page); await D.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; __sv.openPad(0, 'friend'); });
  await D.page.waitForSelector('.padmode [data-mode=ani]'); await D.page.click('.padmode [data-mode=ani]');
  const aniKeys = await D.page.evaluate(() => document.querySelectorAll('.numpad.ani button svg.art').length);
  for (const d of code.slice(0, 2)) await D.page.click(`.numpad button[data-v="${d}"]`);
  await D.page.screenshot({ path: 'out/knock-pad.png' });
  for (const d of code.slice(2)) await D.page.click(`.numpad button[data-v="${d}"]`);
  await A.page.waitForSelector('.knockpop [data-no]', { timeout: 45000 });
  await D.page.waitForFunction(() => __Net._heard > 0, null, { timeout: 20000 });
  await D.page.waitForTimeout(1500);
  const atDoor = await D.page.evaluate(() => ({ knocking: __Net.knocking, partners: Object.keys(__sv.partners).length, mic: __Net.mic ? __Net.mic.getAudioTracks().some(t => t.enabled) : 'none', panel: !!document.querySelector('.knockwait') }));
  await D.page.screenshot({ path: 'out/knock-wait.png' }); await A.page.screenshot({ path: 'out/knock-door.png' });
  await A.page.evaluate(() => document.querySelector('.knockpop [data-no]').click());
  await D.page.waitForFunction(() => !__Net.role, null, { timeout: 20000 });
  const sentAway = await A.page.evaluate(() => ({ remotes: Object.keys(__Net.remotes).length, knocks: __Net.knocks.size, pop: !!document.querySelector('.knockpop') }));
  // a stranger skips the knock and just sends moves and a talk bubble through the cloud: nothing appears
  await D.page.evaluate(async c => { const { Channel } = await import('/js/relay.js'); const ch = new Channel({ kind: 'room', code: c, onMsg: () => { } }); await ch.start(); for (let i = 0; i < 6; i++) { ch.send({ t: 's', from: 'sv-c-stranger1', x: 1, y: 1, z: 1, yaw: 0, mid: 'x' + i }); ch.send({ t: 'emote', id: 'hi', from: 'sv-c-stranger1', mid: 'e' + i }); await new Promise(r => setTimeout(r, 200)); } }, code);
  await A.page.waitForTimeout(2000);
  const stranger = await A.page.evaluate(() => ({ remotes: Object.keys(__Net.remotes).length, partners: Object.keys(__sv.partners).length, bubbles: __sv.bubbles.length }));
  await D.ctx.close();
  // E types the numbers and knocks; A lets E in
  const E = await open(b, { pre, w: 390, h: 760, lang: 'en', touch: true, settings: { autoMeet: false } });
  await clear(E.page); await E.page.evaluate(() => __sv.openPad(0, 'friend')); await E.page.waitForSelector('.padmode [data-mode=num]'); await E.page.click('.padmode [data-mode=num]');
  for (const d of code) await E.page.click(`.numpad button[data-v="${d}"]`);
  await A.page.waitForSelector('.knockpop [data-in]', { timeout: 45000 }); await A.page.evaluate(() => document.querySelector('.knockpop [data-in]').click());
  await E.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 30000 });

  const errs = A.errors.concat(D.errors, E.errors).filter(e => !/WebSocket|ERR_CONNECTION|peerjs/i.test(e)); await A.ctx.close(); await E.ctx.close();
  ok(panel && panel.digits === code && panel.animals === 6 && !panel.qr && aniKeys === 10 && atDoor.knocking && !atDoor.partners && atDoor.mic === false && atDoor.panel && !sentAway.remotes && !sentAway.knocks && !sentAway.pop && !stranger.remotes && !stranger.partners && !stranger.bubbles && !errs.length, JSON.stringify({ panel, aniKeys, atDoor, sentAway, stranger, errs }));
  return `code ${code} shown as digits and 6 animals (no QR code); typed on the animal pad, knocked with the microphone off and nothing heard; "No thanks" sent them away; a stranger's moves without knocking ignored; another child typed the numbers and was let in`;
});

await check('offline', async () => {
  // (Analytics & Infra, 10 Oct, owner: "cant even play offline when there is no internet connection") once the game is
  // saved on the device (service worker), it starts and plays with no connection, and with a connection that never
  // answers (Wi-Fi with no internet): nothing at start may wait on the network. The game is served here from its own
  // little server on 127.0.0.2 (the game skips its service worker on localhost) that can stop answering.
  const http = await import('http'), path = await import('path');
  const root = path.resolve(process.env.SV_ROOT || '..'), TY = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
  let hang = false;
  const srv = http.createServer((q, r) => {
    if (hang) return;
    let f = decodeURIComponent(q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; f = path.join(root, f);
    if (!f.startsWith(root) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); fs.createReadStream(f).pipe(r);
  });
  await new Promise(res => srv.listen(0, '127.0.0.2', res));
  try {
    const url = `http://127.0.0.2:${srv.address().port}/`;
    const P = await open(b, { w: 390, h: 760, touch: true, url, play: false });
    await P.page.waitForFunction(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && r.active); }, null, { timeout: 120000 });
    await P.page.waitForTimeout(1000);
    const again = async () => { const t0 = Date.now(); await P.page.reload({ timeout: 30000 }).catch(() => { }); const got = await P.page.waitForSelector('.screen.title', { timeout: Math.max(1000, 30000 - (Date.now() - t0)) }).then(() => true, () => false); return got ? Date.now() - t0 : -1; };
    const saved = await again();
    await P.ctx.setOffline(true); const off = await again();
    // offline the whole way in: Who's playing?, into the valley
    let played = false; if (off > 0) { await start(P.page); played = await P.page.evaluate(() => window.__sv.heroes.length === 1); }
    await P.ctx.setOffline(false);
    hang = true; const none = await again(); hang = false;
    const errs = P.errors.filter(e => !/Failed to fetch|NetworkError|ERR_INTERNET_DISCONNECTED|aborted/i.test(e)); await P.ctx.close();
    ok(saved > 0 && off > 0 && played && none > 0 && none < 15000 && !errs.length, JSON.stringify({ saved, off, played, none, errs }));
    return `first screen: saved ${(saved / 1000).toFixed(1)} s, offline ${(off / 1000).toFixed(1)} s (played into the valley), connection that never answers ${(none / 1000).toFixed(1)} s`;
  } finally { srv.closeAllConnections(); srv.close(); }
});

await check('nostudio', async () => {
  // (10 Oct, owner: "Parents or users wont know what Sparkle Studio is and this is for admin so it should not be mentioned
  // anywhere at all") Grown-ups with every group open, the parents' pages and every Pad tab never name Studio
  const P = await open(b, { w: 1024, h: 768 }); await clear(P.page);
  const bad = await P.page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), out = [], C = (await import('/js/custom.js')).CUSTOM;
    C.missions = [{ id: 'fam1', en: 'Water the plants', vi: 'Tưới cây' }];
    const look = (where, root) => { const t = [root.textContent, ...[...root.querySelectorAll('[title],[aria-label],[placeholder],[alt]')].flatMap(e => [e.title, e.getAttribute('aria-label'), e.placeholder, e.alt])].join(' '); const m = t.match(/.{0,40}studio.{0,40}/i); if (m) out.push(where + ': ' + m[0]); };
    for (const lang of ['en', 'vi']) {
      const S = await import('/js/state.js'); S.settings.lang = lang;
      const { openGrownups } = await import('/js/ui.js'); openGrownups(() => { }); await w(500);
      const g = document.querySelector('.modal.grownups'); g.querySelectorAll('details').forEach(d => { d.open = true; }); look(lang + ' Grown-ups', g);
      document.querySelectorAll('.modal').forEach(e => e.remove());
      const G = window.__sv; if (G.parents && G.parents.grownupsHTML) { const d = document.createElement('div'); d.innerHTML = G.parents.grownupsHTML(true); look(lang + ' parents', d); }
      G.openPad(0, 'map'); await w(400);
      for (const t of [...document.querySelectorAll('.pad-tabs [data-t]')].map(x => x.dataset.t)) { document.querySelector(`.pad-tabs [data-t="${t}"]`).click(); await w(250); const pad = document.querySelector('.pad, .sparkpad, .pad-body'); if (pad) look(lang + ' pad-' + t, pad.closest('.modal') || pad); }
      document.querySelectorAll('.modal, .pad').forEach(e => e.remove()); window.__sv.paused = false;
    }
    return out;
  });
  const errs = P.errors; await P.ctx.close();
  ok(!bad.length && !errs.length, JSON.stringify({ bad, errs }));
  return 'Grown-ups (every group open), the parents\' pages and every Pad tab, English and Vietnamese: Studio never named';
});

await check('mapver', async () => {
  // (Online, r57, ROUND-T §4) positions travel as raw x, z, so friends play together only on the same map layout. A knock
  // carries the knocker's layout; the starter's locked answers carry the starter's; a game older than r57 sends none and
  // plays as before (owner, 11 Oct: r56 already has the new map). Another layout: the one knocking sees "Ask a grown-up to update" (a card with a picture, a voice and a 64 px OK) and is not let in,
  // and the starter sees no knock card (owner, 11 Oct: only the one joining is told). The same layout knocks as before.
  // The friends list shows "Different valley" instead of Join for a friend on another layout.
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 700, settings: { autoMeet: false } });
  const B = await open(b, { pre, w: 390, h: 760, touch: true, lang: 'vi', settings: { autoMeet: false } });
  for (const P of [A, B]) { await clear(P.page); await P.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; }); }
  const knockFrom = async (P, code) => { await P.page.evaluate(c => { __Net.join(c, __sv.sendHello()); }, code); };
  const told = P => P.page.waitForFunction(() => !__Net.role && /Nhờ người lớn cập nhật|Ask a grown-up to update/.test((document.querySelector('.mapcard') || {}).textContent || ''), null, { timeout: 40000 }).then(() => true, () => false);
  const knockCards = () => A.page.evaluate(() => ({ knocks: __Net.knocks.size, pop: !!document.querySelector('.knockpop'), remotes: Object.keys(__Net.remotes).length }));
  const out = {};
  // 1. the starter has an older map ('C'): a round T guest is told, not let in
  let code = await A.page.evaluate(async () => { __Net.mapVersion = 'C'; return __Net.host(__sv.sendHello()); });
  await knockFrom(B, code); out.oldStarter = await told(B); out.oldStarterA = await knockCards();
  await B.page.screenshot({ path: 'out/mapver-card.png' });
  out.cardVi = await B.page.evaluate(() => { const c = document.querySelector('.mapcard'), ok = c.querySelector('[data-ok]').getBoundingClientRect(); return c.textContent + (c.querySelector('svg.art') ? ' [art]' : '') + (ok.height >= 64 ? ' [big]' : ''); });
  await B.page.evaluate(() => document.querySelectorAll('.modal.mapcard').forEach(d => d.remove()));
  await A.page.evaluate(() => { __Net.close(); });
  // 2. the guest has an older map: the starter turns the knock away without a knock card
  code = await A.page.evaluate(async () => { const M = await import('/js/content/map.js'); __Net.mapVersion = M.MAP_VERSION; return __Net.host(__sv.sendHello()); });
  await B.page.evaluate(() => { __Net.mapVersion = 'C'; });
  await knockFrom(B, code); out.oldGuest = await told(B); await A.page.waitForTimeout(1500); out.oldGuestA = await knockCards();
  await B.page.evaluate(() => document.querySelectorAll('.modal.mapcard').forEach(d => d.remove()));
  // 3. a knock with no map version (a game older than r57, like r56 with the same map): the knock card comes up as before,
  // and Let in works
  await B.page.evaluate(async () => { const M = await import('/js/content/map.js'); __Net.mapVersion = M.MAP_VERSION; const k = __Net._knockHello; __Net._knockHello = function () { const h = k.call(this); delete h.map; return h; }; });
  await knockFrom(B, code);
  out.sameKnock = await A.page.waitForSelector('.knockpop [data-in]', { timeout: 45000 }).then(() => true, () => false);
  if (out.sameKnock) { await A.page.evaluate(() => document.querySelector('.knockpop [data-in]').click()); out.sameIn = await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 30000 }).then(() => true, () => false); }
  // 4. the friends list: Join only for a friend on the same map
  out.list = await A.page.evaluate(async () => {
    const S = await import('/js/state.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    S.settings.friends = [{ code: 'MAPOLD', name: 'Old' }, { code: 'MAPNEW', name: 'New' }]; S.settings.friendsOn = true;
    const now = Date.now(); __Net.friends.status.MAPOLD = { online: true, seen: now, room: '111111', map: 'C' }; __Net.friends.status.MAPNEW = { online: true, seen: now, room: '222222', map: __Net.mapVersion };
    const box = document.createElement('div'); document.body.appendChild(box); __sv.drawOnlinePanel(box, () => { });
    const rows = [...box.querySelectorAll('.frow')], r = { oldJoin: !!rows[0].querySelector('[data-joinf]'), oldDiff: !!rows[0].querySelector('[data-mapdiff]'), newJoin: !!rows[1].querySelector('[data-joinf]'), newDiff: !!rows[1].querySelector('[data-mapdiff]') };
    rows[0].querySelector('[data-mapdiff]').click(); await wait(300); r.card = /Ask a grown-up to update/.test((document.querySelector('.mapcard') || {}).textContent || '');
    box.remove(); document.querySelectorAll('.modal.mapcard').forEach(d => d.remove()); S.settings.friends = []; delete __Net.friends.status.MAPOLD; delete __Net.friends.status.MAPNEW;
    return r;
  });
  const errs = A.errors.concat(B.errors).filter(e => !/WebSocket|ERR_CONNECTION|peerjs/i.test(e)); await A.ctx.close(); await B.ctx.close();
  const l = out.list;
  ok(out.oldStarter && !out.oldStarterA.knocks && !out.oldStarterA.pop && !out.oldStarterA.remotes && /Nhờ người lớn cập nhật/.test(out.cardVi) && /\[art\] \[big\]/.test(out.cardVi) && out.oldGuest && !out.oldGuestA.knocks && !out.oldGuestA.pop && !out.oldGuestA.remotes && out.sameKnock && out.sameIn && !l.oldJoin && l.oldDiff && l.newJoin && !l.newDiff && l.card && !errs.length, JSON.stringify(Object.assign(out, { errs })));
  return 'starter on an older map: the knocker sees "Ask a grown-up to update" (VI) and is not let in, no knock card for the starter; guest on an older map: turned away the same way; no map version (r56): knock card and Let in as before; friends list: "Different valley" instead of Join for a friend on another map';
});
await check('onlineoff', async () => {
  // PRIV-006 (round R privacy, 9 Oct, owner): a fresh device has online play off. The Friends tab says so with no Start or
  // Join, Net makes no connection (no PeerJS, no cloud relay, no friends' status), and Grown-ups turns it on.
  const P = await open(b, { w: 390, h: 760, touch: true, pre: () => { const s = JSON.parse(localStorage.getItem('sv2_settings') || '{}'); delete s.online; localStorage.setItem('sv2_settings', JSON.stringify(s)); window.__wsOpened = 0; const W = window.WebSocket; window.WebSocket = function (...a) { window.__wsOpened++; return new W(...a); }; window.WebSocket.prototype = W.prototype; } }); // (the harness turns it on; this device has never had the setting)
  await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const S = await import('/js/state.js'), N = (await import('/js/net.js')).Net, wait = ms => new Promise(r => setTimeout(r, ms));
    const setting = S.settings.online;
    __sv.openPad(0, 'friend'); await wait(500);
    const body = document.querySelector('.pad-body') || document.body, text = body.textContent;
    const off = /Playing with friends is off/.test(text), buttons = !!document.querySelector('#oHost, .padwrap, .numpad, [data-joinf]');
    // (bug #37) a grown-ups' note names the real section and switch in both languages, with a press-and-hold Grown-ups button
    const guide = {}, hold = document.querySelector('.gunote .gu-hold');
    guide.en = /Internet and playing online → tick Use the internet/.test(text) && !/Studio/.test(text);
    guide.hold = !!hold && hold.getBoundingClientRect().height >= 44 && !!hold.querySelector('.ring');
    hold.click(); await wait(200); guide.tapNoOpen = !document.querySelector('.modal.grownups'); // a plain tap opens nothing
    hold.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); await wait(300);
    const sec = document.querySelector('.modal.grownups details[data-sec="online"]'); guide.opens = !!sec && sec.open;
    S.settings.lang = 'vi'; const vbox = document.createElement('div'); __sv.drawOnlinePanel(vbox, () => { }); S.settings.lang = 'en';
    guide.vi = /Internet và chơi trực tuyến → chọn Dùng internet/.test(vbox.textContent) && !/Studio/.test(vbox.textContent);
    document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false;
    const code = await N.host({ name: 'X' }); await N.join('123456', { name: 'X' }); __sv.listenFriends(); await wait(1500);
    return { setting, off, buttons, guide, code, role: N.role, peer: !!N.peer, door: !!N.door, cloud: !!N.cloud, beacon: !!N.beacon, pres: !!N.friends.ch, peerLoaded: !!window.Peer, ws: window.__wsOpened };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.setting === false && r.off && !r.buttons && Object.values(r.guide).every(Boolean) && Object.keys(r.guide).length === 5 && r.code === null && !r.role && !r.peer && !r.door && !r.cloud && !r.beacon && !r.pres && !r.ws && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return 'a fresh device: "Playing with friends is off. Ask a grown-up to turn it on.", no Start or Join; a grown-ups\' note names Internet and playing online → Use the internet (EN and VI, no Studio) and its press-and-hold button opens that section (a tap does not); host, join and friends make no connection';
});
// (Play reading trial, owner 11 Oct 2026 AEDT; docs/cores/play-reading.md) the ten reading games behind Studio's readingTrial
await check('reading', async () => {
  const { solveReading } = await import('./readsolve.mjs'), RD = await import('../js/content/reading.js');
  const IDS = ['rd_trace', 'rd_sounds', 'rd_build', 'rd_rhyme', 'rd_sight', 'rd_tones', 'rd_syllable', 'rd_match', 'rd_sentence', 'rd_readalong'], BIG_ONLY = ['rd_sight', 'rd_match', 'rd_sentence'];
  // the word lists: both languages, every picture drawn, every line to record listed in both languages
  const lines = RD.readingLines(), en = lines.filter(l => l.lang === 'en').length, vi = lines.filter(l => l.lang === 'vi').length;
  ok(en > 150 && vi > 150, `lines to record: en ${en}, vi ${vi}`);
  for (const k of ['letters', 'build', 'rhyme', 'sight', 'syl', 'sent', 'books']) ok(RD.READ.en[k] && RD.READ.vi[k] && RD.READ.en[k].length && RD.READ.vi[k].length, 'a list missing in one language: ' + k);
  ok(['ă', 'â', 'đ', 'ê', 'ô', 'ơ', 'ư'].every(c => RD.READ.vi.letters.some(x => x[0] === c)), 'Vietnamese letters without ă â đ ê ô ơ ư');
  ok(RD.nameOf('en', 'z') === 'zed', 'Z is not said "zed"');
  ok(RD.READ.en.letters.slice(0, 6).map(x => x[0]).join('') === 'satpin', 'English sounds do not start s a t p i n');
  const allEn = JSON.stringify(RD.READ.en), us = ['color', ' mom', 'candy', 'Mom'].filter(w => allEn.includes(w)); ok(!us.length, 'American words in the English lists: ' + us.join(', '));
  // switch off (Studio's content pack sets it off; with no setting it is on, owner 12 Oct AEDT): nothing of the trial loads or shows
  const P = await open(b, { w: 1024, h: 768, play: false }); const asked = []; P.page.on('request', q => { if (/reading(menu)?\.js/.test(q.url())) asked.push(q.url().split('/').pop()); });
  await P.page.route('**/content/custom.json*', async r => { let j = {}; try { j = await (await r.fetch()).json(); } catch (e) { } j.features = { ...(j.features || {}), readingTrial: false }; await r.fulfill({ contentType: 'application/json', body: JSON.stringify(j) }); });
  await P.page.reload(); asked.length = 0; await start(P.page); await clear(P.page);
  const off = await P.page.evaluate(async () => { const F = await import('/js/games/frame.js'), A = await import('/js/content/activities.js'); __sv.openGamesHub(0); await new Promise(r => setTimeout(r, 300)); const hub = [...document.querySelectorAll('[data-play]')].map(b => b.dataset.play); document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false;
    return { games: Object.keys(F.GAMES).filter(k => /^rd_/.test(k)), inArea: A.gamesIn(F.GAMES, 'reading', false).length, hub: hub.filter(k => /^rd_/.test(k)) }; });
  await P.ctx.close();
  ok(!off.games.length && !off.inArea && !off.hub.length && !asked.length, 'with the switch off: ' + JSON.stringify({ off, asked }));
  // switch on (Studio's content pack): the ten games are in the Reading corner, in the Learning tab; their code loads only when one opens
  const Q = await open(b, { w: 1024, h: 768, play: false }); const asked2 = []; Q.page.on('request', q => { if (/reading(menu)?\.js/.test(q.url())) asked2.push(q.url().split('/').pop()); });
  await Q.page.route('**/content/custom.json*', async r => { let j = {}; try { j = await (await r.fetch()).json(); } catch (e) { } j.features = { ...(j.features || {}), readingTrial: true }; await r.fulfill({ contentType: 'application/json', body: JSON.stringify(j) }); });
  await Q.page.reload(); await start(Q.page); await clear(Q.page);
  await Q.page.waitForFunction(async () => Object.keys((await import('/js/games/frame.js')).GAMES).filter(k => /^rd_/.test(k)).length === 10, null, { timeout: 30000 }).catch(() => { });
  const on = await Q.page.evaluate(async () => { const F = await import('/js/games/frame.js'), A = await import('/js/content/activities.js'); __sv.openGamesHub(0); await new Promise(r => setTimeout(r, 300)); document.querySelector('.hubtabs [data-tab="learn"]')?.click(); await new Promise(r => setTimeout(r, 200));
    const hub = [...document.querySelectorAll('.hubbody [data-play]')].map(b => b.dataset.play), head = [...document.querySelectorAll('.hubbody .hubarea')].map(h => h.textContent); document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false;
    return { games: Object.keys(F.GAMES).filter(k => /^rd_/.test(k)), big: A.gamesIn(F.GAMES, 'reading', false).map(g => g.id), little: A.gamesIn(F.GAMES, 'reading', true).map(g => g.id), hub: hub.filter(k => /^rd_/.test(k)), head }; });
  ok(IDS.every(id => on.games.includes(id) && on.big.includes(id) && on.hub.includes(id)) && on.head.some(h => /Reading corner/.test(h)), 'with the switch on: ' + JSON.stringify(on));
  ok(BIG_ONLY.every(id => !on.little.includes(id)) && on.little.length === 7, 'under-5s see: ' + on.little.join(','));
  ok(!asked2.includes('reading.js'), 'the games\' code loaded before a game opened: ' + asked2.join(','));
  // every game finishes for an under-5 (no losing: three stars) and for a big kid at Easy, Medium and Hard, in both languages;
  // nothing is left behind when a game ends
  const bad = [], left = [];
  for (const lang of ['en', 'vi']) {
    await Q.page.evaluate(async lang => { const S = await import('/js/state.js'); S.settings.lang = lang; }, lang);
    for (const id of IDS) for (const [level, little] of [[1, true], [1, false], [2, false], [3, false]]) {
      if (little && BIG_ONLY.includes(id)) continue;
      const r = await solveReading(Q.page, id, { level, little, timeout: 90000 });
      if (!r.ok || !r.won || (little && r.stars !== 3)) bad.push(`${lang} ${id} ${little ? 'under-5' : 'level ' + level}: ${JSON.stringify(r).slice(0, 160)}`);
      await Q.page.waitForTimeout(400);
      const rest = await Q.page.evaluate(() => document.querySelectorAll('.gl, .rd-lantern, .rd-pond, .rd-sky, .rd-train, .rd-page').length); if (rest) left.push(`${lang} ${id}`);
      await Q.page.evaluate(() => document.querySelectorAll('.gl').forEach(e => e.remove()));
    }
  }
  ok(!bad.length, bad.slice(0, 6).join(' | '));
  ok(!left.length, 'still on screen after the game ended: ' + left.join(', '));
  ok(asked2.includes('reading.js'), 'the games\' code never loaded');
  const errs = Q.errors.slice(); await Q.ctx.close();
  ok(!errs.length, errs.slice(0, 5).join(' | '));
  return `switch off: nothing loads or shows; on: 10 games in the Reading corner (7 for under-5s), all finish at Easy, Medium, Hard and for under-5s in English and Vietnamese; ${en} English and ${vi} Vietnamese lines`;
});

await b.close();
const failed = results.filter(r => !r[1]);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
