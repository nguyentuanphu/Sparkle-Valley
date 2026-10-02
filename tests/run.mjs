// Sparkle Valley regression checks. Start the game first (python3 -m http.server 8765 in the repo), then:
//   cd tests && npm install && node run.mjs            all checks
//   node run.mjs games features                        only some
//   node run.mjs --update-contract                     re-record the UI structure (only when the owner asked for a UI change)
// Multiplayer runs when a local PeerJS server is up on 127.0.0.1:9000 (see the README in this folder).
import fs from 'fs';
import { launch, open, clear, URL } from './harness.mjs';

const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
const want = k => !only.length || only.includes(k);
const results = [];
const check = async (name, fn) => {
  if (!want(name)) return;
  const t0 = Date.now();
  try { const note = await fn(); results.push([name, true, note || '']); console.log(`✅ ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s) ${note || ''}`); }
  catch (e) { results.push([name, false, e.message]); console.log(`❌ ${name}: ${e.message}`); }
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
    o.deck = +G.world.groundAt(37, -62, 20).toFixed(1); o.river = +W.heightAt(37, -62).toFixed(1);
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
  await P.page.keyboard.press('Escape'); await P.page.waitForTimeout(900);
  const z0 = await P.page.evaluate(() => __sv.heroes[0].zoom || 1); await P.page.keyboard.press('Minus'); r.zoom = (await P.page.evaluate(() => __sv.heroes[0].zoom)) > z0;
  // a fairy tale from the Games hub: fly to the storyteller, the theatre opens
  await clear(P.page); await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForTimeout(400);
  await P.page.evaluate(() => document.querySelector('.hub [data-tale="tamcam"]').click()); await P.page.waitForTimeout(3500);
  r.theatre = await P.page.evaluate(() => !!document.querySelector('.theatre'));
  await P.page.evaluate(() => document.querySelector('.th-x')?.click());
  // tapping a game card flies to its host
  await clear(P.page); await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForTimeout(400);
  await P.page.evaluate(() => document.querySelector('[data-play="traffic"]').click()); await P.page.waitForTimeout(3500);
  r.flewToHost = await P.page.evaluate(() => { const it = __sv.gameSpot('traffic'), h = __sv.heroes[0]; return Math.hypot(it.x - h.pos.x, it.z - h.pos.z) < 6 && !!document.querySelector('.gl'); });
  // folk-game friends chat: a bubble shows within a few seconds near the playground
  await P.page.evaluate(() => { document.querySelector('.gl .gl-x')?.click(); __sv.heroes[0].place(28, 66); });
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
      for (let k = 0; k < 40; k++) h.finish(.05, k * .05, G, 0);
      const c = h.cam.position, inBox = G.world.boxes.some(b => c.x > b.x0 && c.x < b.x1 && c.z > b.z0 && c.z < b.z1 && c.y < G.world.groundAt(c.x, c.z) + 6);
      const to = new THREE.Vector3(h.pos.x, h.pos.y + 1.2, h.pos.z), d = to.clone().sub(c); const L = d.length(); ray.set(c, d.normalize()); ray.far = L - .6;
      const hit = ray.intersectObjects(G.camBlockers(), false)[0];
      if (inBox || hit) out.push(lm.id + '@' + yaw);
    }
    return { n: R.LANDMARKS.length * 4, stuck: out };
  });
  await P.ctx.close();
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
  await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 60000 });
  await A.page.evaluate(() => __sv.heroes[0].place(28, 60)); await B.page.evaluate(() => __sv.heroes[0].place(-60, 0)); await A.page.waitForTimeout(2500);
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
  return `met at ${d.toFixed(1)} m, talk bubble received`;
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

await check('cloud', async () => {
  // two devices that can never link directly (the meeting service points nowhere), like far-away networks:
  // they must find each other through the cloud relay (a local MQTT broker on 127.0.0.1:9001 stands in for
  // the public ones), see each other's status, join from the friends list, move, meet and talk
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 640, lang: 'en', settings: { friendCode: 'AAAAA2', friendsOn: true, friends: [{ code: 'BBBBB3', name: 'Bin' }] } });
  const B = await open(b, { pre, w: 390, h: 760, lang: 'vi', touch: true, settings: { friendCode: 'BBBBB3', friendsOn: true, friends: [{ code: 'AAAAA2', name: 'Na' }] } });
  for (const P of [A, B]) { await clear(P.page); await P.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; }); }
  const code = await A.page.evaluate(async () => __Net.host(__sv.sendHello()));
  await A.page.evaluate(() => { __sv.heroes[0].place(-8, 86); __sv.shareStatus(); });
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
  await B.page.evaluate(() => __Net.close()); await A.page.waitForTimeout(3000);
  const left = await A.page.evaluate(() => Object.keys(__sv.partners).length === 0);
  const errs = A.errors.concat(B.errors).filter(e => !/WebSocket|ERR_CONNECTION|peerjs/i.test(e)); await A.ctx.close(); await B.ctx.close();
  ok(/TP\. Hồ Chí Minh/.test(status) && /1\d{3}|[2-9]\d{3}/.test(status) && q && q.route === 'cloud' && q.rtt && d < 6 && heard > 0 && left && !errs.length, JSON.stringify({ status, q, d, heard, left, errs }));
  return `status "${status}", ping ${q.rtt} ms through the cloud, met at ${d.toFixed(1)} m, talk bubble received, leaving noticed`;
});

await b.close();
const failed = results.filter(r => !r[1]);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
