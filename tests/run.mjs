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
    o.hosts = ['puppets', 'dongho', 'dragonfire', 'traffic', 'ferries', 'tram', 'koala'].filter(g => G.gameSpot(g)).length;
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
  if (r.cities !== 7) fails.push('cities'); if (r.kiosks < 26) fails.push('kiosks'); if (r.hosts !== 7) fails.push('hosts'); if (r.landmarks < 47) fails.push('landmarks');
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
    const gates = W.ROADS.reduce((n, R) => n + (R.gates || []).filter(Boolean).length, 0);
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
    // roadDist skips far roads by their boxes: the same answers as looking at every road, and faster
    let diff = 0, seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, brute = (x, z) => { let bd = 1e9, br = null; for (const R of W.ROADS) for (let i = 0; i < R.pts.length - 1; i++) { const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))), d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < bd) { bd = d; br = R; } } return { d: bd, road: br }; };
    const pts = Array.from({ length: 20000 }, () => [(rnd() - .5) * W.SIZE, (rnd() - .5) * W.SIZE]);
    for (const [x, z] of pts) { const a = W.roadDist(x, z), c = brute(x, z); if (Math.abs(a.d - c.d) > 1e-9 || a.road !== c.road) diff++; }
    let t0 = performance.now(); for (const [x, z] of pts) W.roadDist(x, z); const fast = performance.now() - t0; t0 = performance.now(); for (const [x, z] of pts) brute(x, z); const slow = performance.now() - t0;
    if (diff) out.push(`roadDist differs from the full search at ${diff} of 20000 points`);
    return { out: out.slice(0, 12), n: out.length, missing, gates, angles, straights, tufts, speed: +(slow / fast).toFixed(1) };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.out.length && !r.missing.length && r.gates >= 15 && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.gates} gates on road ends, every city on a road, nothing standing on a road; ${r.angles.length} side-road junctions all 60–120° (smallest ${Math.min(...r.angles)}°) and straight ≥ 6 m before any bend (shortest ${Math.min(...r.straights)} m; short straight stubs into a gate aside); ${r.tufts} grass tufts and flowers, none on a road; roadDist ×${r.speed} faster, same answers at 20,000 points`;
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
  const errs = D.errors.concat(M.errors, Tb.errors); await D.ctx.close(); await M.ctx.close(); await Tb.ctx.close();
  ok(!bad.length && !errs.length, JSON.stringify({ bad, errs }));
  return `${SCREENS.length} screens checked on desktop, phone and tablet`;
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
  const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true }), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await ctx.addInitScript(seedPlayers);
  await ctx.addInitScript(() => { const o = JSON.parse(localStorage.getItem('sv2_settings') || '{}'); Object.assign(o, { lang: 'vi', voice: false, sound: false, music: false, quality: 'low', autoPack: true }); localStorage.setItem('sv2_settings', JSON.stringify(o)); });
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
  return 'ROAD-001/002/003/004/011 and VEH-001 hold';
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
      const o = { ...W.CITIES.reduce((m, c) => (m[c.id] = c, m), {}), village: W.VILLAGE, china: W.CHINA, india: W.INDIA, aussie: W.AUSSIE, town: W.TOWN, market: W.MARKET, home: W.HOME }[key];
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
      document.querySelector('.th-auto').click();
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
  // (Play core, chapter 2; owner 10 Oct: it is off until an admin switches it on or schedules it) switched on in Studio,
  // chapter 2 follows chapter 1; off, the old adventures follow as before
  const noCh2 = seen[8];
  seen[8] = await pg.evaluate(async () => { const C = (await import('/js/custom.js')).CUSTOM; C.features = { ...(C.features || {}), story_ch2: true }; await __sv.lanterns.loadCh('ch2'); const c = __sv.currentQuest(__sv.heroes[0].profile); delete C.features.story_ch2; return c && c.id; });
  const end = await pg.evaluate(() => { const G = __sv, p = G.heroes[0].profile, D = G.lanterns.dinh;
    const house = Math.min(...G.world.colliders.filter(c => c.r > 2 && c.top == null).map(c => Math.hypot(c.x - D.x, c.z - D.z) - c.r));
    return { companion: p.lanterns.companion, ch1: !!p.lanterns.chapters.ch1, keep: (p.keepsakes || []).includes('lantern_ch1'), carrying: p.lanterns.carrying, house }; });
  const want = ['L_p_owl', 'L_c1_village', 'L_c1_nam', 'L_c1_well', 'L_c1_teo', 'L_c1_tale', 'L_c1_find', 'L_c1_hang'], out = [];
  want.forEach((id, i) => { if (seen[i] !== id) out.push(`step ${i + 1} was ${seen[i]}, expected ${id}`); });
  if (seen[8] !== 'L_c2_fly') out.push('after chapter 1 the goal was ' + seen[8] + ', not chapter 2');
  if (!noCh2 || /^L_/.test(noCh2)) out.push('with chapter 2 not switched on (its default), the goal after chapter 1 was ' + noCh2 + ', not an old adventure');
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
      document.querySelector('.th-auto')?.click(); const f = F.filmNow(); if (!f) return ['no film'];
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
      document.querySelector('.th-auto')?.click(); const f = F.filmNow(); if (!f) return ['no film'];
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
  if (bad.length) throw new Error(bad.join('; '));
  return `under-5: ${little.steps} steps (${little.rounds} picture words, the companion flew high to lead); big kid: ${big.steps} steps (${big.rounds} Aussie words, ferries, cricket, clues); rope, film (2 pages, the child starts the fireworks), Opera House lit, fireworks, keepsake, new trick, koala for the big kid; then "${big.after}"`;
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
    const sb = document.querySelector('.modal.pad .bagshop'); out.bagOpens = !!document.querySelector('.modal.pad') && !document.querySelector('.modal.shopk') && !!sb;
    out.bagShopBtn = sb ? (() => { const q = sb.getBoundingClientRect(); return q.width >= 44 && q.height >= 44; })() : false;
    sb && sb.click(); await w(700);
    out.there = Math.hypot(h.pos.x - pos0.x, h.pos.z - pos0.z) < 1 && !document.querySelector('.modal.pad'); const card = document.querySelector('.modal.shopk .card');
    out.opened = !!card; out.tabs = card ? card.querySelectorAll('.ktab').length : 0; out.noBagTab = card ? !card.querySelector('[data-go="bag"]') : false;
    // (nothing to read: each thing is a drawing and a number; the words inside a drawing, like the coin's "$", are part
    // of the picture, so the text is read with the drawings taken out)
    const words = b => { const c = b.cloneNode(true); c.querySelectorAll('svg, .arti, .flagi').forEach(e => e.remove()); return c.textContent.replace(/\s/g, ''); };
    out.pics = card ? [...card.querySelectorAll('.kitem')].every(b => b.querySelector('svg') && /^\d*$/.test(words(b))) : false;
    out.small = card ? [...card.querySelectorAll('.ktab, .kitem, .x')].filter(b => { const q = b.getBoundingClientRect(); return q.width < 44 || q.height < 44; }).length : -1;
    // buy the tiara (hats tab), and it is worn
    card.querySelector('[data-tab="hat"]').click(); await w(150); card.querySelector('[data-id="tiara"]').click(); await w(150);
    const price = SH.priceOf(SH.ITEM.tiara), c0 = S.farm.coins; card.querySelector('.kyes').click(); await w(300);
    out.bought = SH.owns(p, 'tiara') && p.look.hat === 'tiara' && S.farm.coins === c0 - price;
    // not enough coins: nothing is bought
    G.addCoins(-S.farm.coins); card.querySelector('[data-tab="back"]').click(); await w(150); card.querySelector('[data-id="dragon"]').click(); await w(150); card.querySelector('.kyes').click(); await w(300);
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
    out.drawn = {}; for (const it of SH.CLOTHES) { const L = Object.assign({}, base, { [it.slot]: it.id }); out.drawn[it.id] = meshes(buildAvatar(L)) - n0; }
    out.allDrawn = Object.entries(out.drawn).filter(([id, d]) => Math.abs(d) > 12 || (SH.ITEM[id].slot === 'neck' || SH.ITEM[id].slot === 'back') && d < 1).map(([id, d]) => id + ':' + d); // (a top can drop the old sleeves and shorts)
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
  if (!r.bagOpens || !r.bagShopBtn) bad.push('the Bag button does not open the backpack with one small shop button ' + JSON.stringify({ o: r.bagOpens, b: r.bagShopBtn }));
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
  return `the shop at ${r.spot} by the market, off the road; the Bag opens the backpack and its small shop button opens the shop without travel; 7 picture tabs, coin prices, 64 px for under-5s; bought the tiara, could not buy without coins; the wardrobe; worn things kept; every piece drawn in 3D (at most ${Math.max(...Object.values(r.drawn))} extra parts); the switch puts the old Bag back`;
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
  await P.page.waitForSelector('.simple-screen:not([hidden]) .sp-stop', { timeout: 20000 });
  await P.page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d.remove()));
  const r = { start: true };
  // bug #30: each tab is one long road, category headings and their stops on the same page; no top destinations button, no way-back arrow
  r.groupsFirst = await P.page.evaluate(() => { const v = __sv.simple.view; return v.cats.length > 3 && v.stops.length > 10 && !document.querySelector('.sp-area, .sp-backarrow') && document.querySelectorAll('.sp-discover').length === 1; });
  // round M: the game opens straight over the Simple screen (it never hides first, so the valley does not flash up)
  await P.page.evaluate(() => { window.__flash = false; const t = setInterval(() => { if (!__sv.simple.open) window.__flash = true; if (document.querySelector('.gl')) clearInterval(t); }, 20); });
  await P.page.locator('.sp-stop:not(.grp)').first().click(); await P.page.waitForSelector('.gl', { timeout: 10000 }); r.game = true; r.flash = await P.page.evaluate(() => window.__flash);
  await P.page.evaluate(() => document.querySelector('.gl-x').click());
  r.back = await P.page.waitForFunction(() => __sv.simple.open && !__sv.simple.busy && !document.querySelector('.gl'), null, { timeout: 8000 }).then(() => true, () => false); // free again at once
  await P.page.click('.sp-tabs [data-tab="tales"]'); await P.page.waitForTimeout(300); await P.page.locator('.sp-stop:not(.grp)').first().click();
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
  await W.page.waitForSelector('.simple-screen:not([hidden]) .sp-stop', { timeout: 20000 });
  r.wide = await W.page.evaluate(() => { const s = document.querySelector('.simple-screen'), t = s.querySelector('.sp-tabs').getBoundingClientRect(), sc = s.querySelector('.sp-scroll'), pics = [...s.querySelectorAll('.sp-pic')].map(e => e.getBoundingClientRect()), tabs = [...s.querySelectorAll('.sp-tabs button')].map(e => e.getBoundingClientRect());
    return { wide: s.classList.contains('wide'), rail: t.left < 5 && t.height > 300, sideways: sc.scrollWidth > sc.clientWidth && sc.scrollHeight <= sc.clientHeight + 2, inView: pics.slice(0, 3).every(p => p.top >= 0 && p.bottom <= innerHeight), big: pics.every(p => p.width >= 64) && tabs.every(p => Math.min(p.width, p.height) >= 64) }; });
  await W.ctx.close();
  const S = await open(b, { w: 1280, h: 800, mode: 'split', screen: null }); await S.page.waitForTimeout(1500);
  r.split = await S.page.evaluate(() => ({ open: __sv.simple.open, dock: [...document.querySelectorAll('.simplesw')].some(d => !d.hidden) })); await S.ctx.close();
  ok(r.groupsFirst && !r.flash && r.game && r.back && r.tale && !r.valley.open && r.valley.screen === 'valley' && r.valley.dock && !r.valley.paused && r.reopen && r.wide.wide && r.wide.rail && r.wide.sideways && r.wide.inView && r.wide.big && !r.big && !r.split.open && !r.split.dock && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return 'under 5 starts on the path; a game and a story each one tap away, the path comes back after; Valley remembered; the “Big pictures” switch reopens it; on its side a rail and a sideways path; big kid and two players start in the valley';
});

await check('adventure', async () => {
  // round J (owner's brief: "an adventure world containing places children want to visit"): one activity list places
  // every game; an under-5 sees one group at a time on one page that scrolls (round P, owner; it was six a page) and every one is a drawn picture; a tap answers at once and a
  // second tap can't start a game twice; a big kid taps once to look and again to play, sees ✨ on new games and can
  // search; Discover jumps to any area; Ông Cú cheers a new star; the landscape stands still in Calm mode; opening and
  // closing the screen 25 times leaves no extra listeners or elements behind
  const P = await open(b, { w: 390, h: 844, touch: true, screen: 'simple' });
  await P.page.waitForSelector('.simple-screen:not([hidden]) .sp-stop', { timeout: 20000 });
  await P.page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d.remove()));
  const r = {};
  // the list: every game is placed exactly once, and nothing is listed that isn't a game
  r.list = await P.page.evaluate(async () => { const { GAMES } = await import('/js/games/registry.js'), A = await import('/js/content/activities.js'), ids = Object.keys(GAMES), keys = Object.keys(A.GAME_INFO);
    return { missing: ids.filter(i => !A.GAME_INFO[i]), extra: keys.filter(k => !GAMES[k] && k !== 'familyquiz') /* Family Quiz is there only once the family has written questions in Studio */, badArea: keys.filter(k => !A.AREAS.some(a => a.key === A.GAME_INFO[k][0])), games: ids.length }; });
  // walk the whole under-5 road (bug #30: one scrolling road, every category one after another)
  r.walk = await P.page.evaluate(async () => {
    const { GAMES } = await import('/js/games/registry.js'), A = await import('/js/content/activities.js'), out = { notDrawn: [], tooBig: [] };
    const v = __sv.simple.view;
    document.querySelectorAll('.sp-stop .sp-pic').forEach(p => { if (!p.querySelector('.art')) out.notDrawn.push(p.parentElement.getAttribute('aria-label')); });
    out.tooBig.push(...v.stops.filter(id => id !== 'songs' && A.gameInfo(id).ageMin >= 5));
    const want = Object.keys(GAMES).filter(id => A.gameInfo(id).ageMin < 5);
    const order = A.AREAS.map(a => a.key).filter(k => v.cats.includes(k));
    return { cats: v.cats.length, inOrder: JSON.stringify(order) === JSON.stringify(v.cats), heads: document.querySelectorAll('.sp-stop.grp').length, missed: want.filter(id => !v.stops.includes(id)), notDrawn: out.notDrawn, tooBig: out.tooBig, stops: v.stops.length };
  });
  // places: China and India (asia) always come last
  r.placesLast = await P.page.evaluate(() => { __sv.simple.show('places'); const c = __sv.simple.view.cats; return c[c.length - 1]; });
  await P.page.evaluate(() => __sv.simple.show('games'));
  // Discover: a big picture for every area; tapping Music goes there
  await P.page.click('.sp-discover'); await P.page.waitForSelector('.sp-find:not([hidden]) .sp-card');
  r.find = await P.page.evaluate(() => ({ cards: document.querySelectorAll('.sp-card').length, search: !!document.querySelector('.sp-q') }));
  await P.page.click('.sp-card[data-t="games"][data-a="music"]'); await P.page.waitForTimeout(200); r.music = await P.page.evaluate(() => { const sc = document.querySelector('.sp-scroll'), h = [...document.querySelectorAll('.sp-stop.grp')].find(b => /Music|Âm nhạc/.test(b.getAttribute('aria-label'))), r = h && h.getBoundingClientRect(); return sc.scrollTop > 0 && r && r.top >= 0 && r.top < innerHeight / 2 ? 'music' : 'lost'; });
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
  await B.page.evaluate(() => { const p = __sv.heroes[0].profile; p.age = 'big'; p.seenActs = undefined; __sv.simple.hide(); __sv.simple.show(); p.seenActs = p.seenActs.filter(x => x !== 'game:bunny'); __sv.simple.hide(); __sv.simple.show('games'); document.querySelectorAll('.dialog').forEach(d => d.remove()); });
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
  return `${r.list.games} games in 11 areas; under-5 road: ${r.walk.cats} categories one after another on one scrolling road (${r.walk.stops} stops), every one drawn, China and India last in places; Discover ${r.find.cards} areas; double tap starts once; big kid: two taps, ✨ new, search; Ông Cú cheers; still in Calm; 25 opens: +${r.leak.listeners} listeners, +${r.leak.nodes} elements`;
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
    h.profile.homeDeco = {}; h.profile.familyCards = { f1: 1 };
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
    md.getUserMedia = real; N.calls.delete('peer-y'); N.cloudOn = false; N.mic = null;
    // 2. Pad → Friends with a player in the room: no button taller than two lines, all inside the card
    Object.defineProperty(N, 'connected', { get: () => true, configurable: true }); N.code = '1234'; N.remotes['peer-z'] = { id: 'peer-z', name: 'Mít', look: {}, friend: 'ABCDE2' };
    G.openPad(0, 'friend'); await wait(500);
    const row = document.querySelector('.prow.roomp'), card = document.querySelector('.pad .card, .modal.pad .card') || document.querySelector('.pad');
    const btns = row ? [...row.querySelectorAll('.btn')] : [], lh = btns.length ? parseFloat(getComputedStyle(btns[0]).lineHeight) || 20 : 20;
    const tall = btns.filter(x => x.getBoundingClientRect().height > lh * 2 + 24).map(x => x.textContent.trim());
    const cr = row ? row.getBoundingClientRect() : null, outside = btns.filter(x => { const q = x.getBoundingClientRect(); return cr && (q.right > cr.right + 1 || q.left < cr.left - 1); }).length;
    document.querySelector('.modal .x')?.click(); await wait(300);
    delete N.remotes['peer-z']; delete N.connected; N.code = null;
    // 3. the friend bar and the round buttons under the map never overlap
    // (a pretend friend 13 m away: the game shows the bar by itself, as with a real friend)
    const hud = G.huds[0], chip = hud.q('.friendchip'), me = G.heroes[0].pos; G.partners['peer-q'] = { id: 'peer-q', name: 'Mít', pos: { x: me.x + 13, y: me.y, z: me.z } }; G.huds[0].setCall(true, false, false);
    await wait(600);
    const c = chip.getBoundingClientRect(), hit = [...document.querySelectorAll('.hud .tools .dk, .hud .zoomer button, .hud .mini-wrap, .hud .zoom')].filter(e => e.offsetParent).filter(e => { const q = e.getBoundingClientRect(); return q.left < c.right && c.left < q.right && q.top < c.bottom && c.top < q.bottom; }).map(e => e.className);
    const onScreen = c.width > 60 && c.height > 20 && c.right <= innerWidth + 1 && c.left >= 0, chipText = chip.textContent;
    delete G.partners['peer-q']; G.huds[0].setCall(false, false, false);
    return { first, noMicYet, micAfterTap, after, replaced, reallyNone, tapAsks, asksBefore: 1, buttons: btns.length, tall, outside, hit, onScreen, chipText, chip: [c.left, c.top, c.width, c.height].map(Math.round) };
  });
  const errs = P.errors; await P.ctx.close();
  ok((r.first.includes('mictap') || r.first.includes('micdenied')) && !r.first.includes('nomic') && r.noMicYet && r.tapAsks === 1 && r.micAfterTap && r.after.includes('micon') && r.replaced === 1 && r.reallyNone.includes('nomic')
    && r.buttons >= 4 && !r.tall.length && !r.outside && !r.hit.length && r.onScreen && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return 'microphone: "tap 🎙️ Microphone on" (not "no microphone"), not asked again on every tap, on from the button and put into the open call; real "no microphone" still said; Friends: ' + r.buttons + ' buttons fit, no word broken; the friend bar touches no button';
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
  const P = await open(b, { w: 1024, h: 700, play: false });
  const startMB = await P.page.evaluate(() => performance.getEntriesByType('resource').concat(performance.getEntriesByType('navigation')).reduce((a, e) => a + (e.encodedBodySize || e.transferSize || 0), 0) / 1e6);
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
    document.querySelectorAll('.modal').forEach(m => m.remove()); __sv.paused = false;
    const code = await N.host({ name: 'X' }); await N.join('123456', { name: 'X' }); __sv.listenFriends(); await wait(1500);
    return { setting, off, buttons, code, role: N.role, peer: !!N.peer, door: !!N.door, cloud: !!N.cloud, beacon: !!N.beacon, pres: !!N.friends.ch, peerLoaded: !!window.Peer, ws: window.__wsOpened };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.setting === false && r.off && !r.buttons && r.code === null && !r.role && !r.peer && !r.door && !r.cloud && !r.beacon && !r.pres && !r.ws && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return 'a fresh device: "Playing with friends is off. Ask a grown-up to turn it on.", no Start or Join; host, join and friends make no connection';
});
await b.close();
const failed = results.filter(r => !r[1]);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
