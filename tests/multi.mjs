import { launch, open, clear } from './harness.mjs';
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const b = await launch();
const peerInit = () => { window.SV_PEER = { host: '127.0.0.1', port: 9000, path: '/myapp', secure: false }; };
const A = await open(b, { w: 900, h: 640, lang: 'en' }); await A.page.evaluate(peerInit); await clear(A.page);
const B = await open(b, { w: 390, h: 760, lang: 'vi', touch: true }); await B.page.evaluate(peerInit); await clear(B.page);
log('both open');
// patch ICE to nothing external so it connects quickly on this machine
for (const P of [A, B]) await P.page.evaluate(async () => { const m = await import('/js/net.js'); window.__Net = m.Net; });
const code = await A.page.evaluate(async () => __Net.host(__sv.sendHello()));
log('room', code);
await B.page.evaluate(async c => { __Net.join(c, __sv.sendHello()); }, code);
await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 60000 });
await A.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 60000 });
log('connected');
// put them far apart
await A.page.evaluate(() => __sv.heroes[0].place(28, 60));
await B.page.evaluate(() => __sv.heroes[0].place(-60, 0));
await A.page.waitForTimeout(2500);
const seeA = await A.page.evaluate(() => { const P = Object.values(__sv.partners)[0]; return { name: P.name, x: +P.pos.x.toFixed(1), z: +P.pos.z.toFixed(1), chip: document.querySelector('.friendchip').hidden ? null : document.querySelector('.fc-txt').textContent }; });
const seeB = await B.page.evaluate(() => { const P = Object.values(__sv.partners)[0]; return { name: P.name, x: +P.pos.x.toFixed(1), z: +P.pos.z.toFixed(1), chip: document.querySelector('.friendchip').hidden ? null : document.querySelector('.fc-txt').textContent }; });
log('A sees', JSON.stringify(seeA)); log('B sees', JSON.stringify(seeB));
await A.page.screenshot({ path: 'out/multi-A-far.png' }); await B.page.screenshot({ path: 'out/multi-B-far.png' });
// A asks B to come; B gets a card and chooses "Walk"
await A.page.evaluate(() => { const P = Object.values(__sv.partners)[0]; __sv.askFriendToCome(__sv.heroes[0], P.id); });
await B.page.waitForSelector('.dialog .dch', { timeout: 15000 });
const card = await B.page.evaluate(() => document.querySelector('.dialog').innerText);
log('B got:', card.replace(/\n+/g, ' | '));
await B.page.evaluate(() => document.querySelector('.dialog .dch').click());
await B.page.waitForTimeout(800);
const walk = await B.page.evaluate(() => JSON.stringify(__sv.heroes[0].walkTo));
log('B walkTo', walk);
// B walks along the footprints (we move them along quickly, as the stick would)
for (let k = 0; k < 40; k++) { const done = await B.page.evaluate(() => { const h = __sv.heroes[0]; if (!h.walkTo) return true; const dx = h.walkTo.x - h.pos.x, dz = h.walkTo.z - h.pos.z, d = Math.hypot(dx, dz); h.place(h.pos.x + dx / d * Math.min(d - 1, 6), h.pos.z + dz / d * Math.min(d - 1, 6)); return false; }); if (done) break; await B.page.waitForTimeout(250); }
await B.page.waitForTimeout(1500);
const met = await B.page.evaluate(() => { const P = Object.values(__sv.partners)[0], h = __sv.heroes[0]; return { d: +Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z).toFixed(1), walkTo: h.walkTo, chip: document.querySelector('.fc-txt').textContent, emotes: !document.querySelector('.emotes').hidden }; });
log('B met A:', JSON.stringify(met));
// they talk: B says hi, A says "you are my best friend"
await B.page.evaluate(() => __sv.emote(0, 'hi'));
await A.page.evaluate(() => __sv.emote(0, 'love'));
await A.page.waitForTimeout(1200);
const bubblesA = await A.page.evaluate(() => __sv.bubbles.length), bubblesB = await B.page.evaluate(() => __sv.bubbles.length);
log('bubbles A/B', bubblesA, bubblesB);
await A.page.screenshot({ path: 'out/multi-A-met.png' }); await B.page.screenshot({ path: 'out/multi-B-met.png' });
// the big map lists the friend
await A.page.evaluate(() => { document.querySelectorAll('.dialog').forEach(d => d.remove()); __sv.paused = false; __sv.openPad(0, 'map'); });
await A.page.waitForTimeout(800); await A.page.screenshot({ path: 'out/multi-A-map.png' });
log('errors A', A.errors, 'B', B.errors);
await b.close();
