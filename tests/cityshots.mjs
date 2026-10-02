import { launch, open, clear } from './harness.mjs';
import fs from 'fs';
const b = await launch();
const { page, errors } = await open(b, { w: 1000, h: 700 });
await clear(page);
const shots = process.argv.slice(2).length ? process.argv.slice(2) : ['hanoi', 'bacninh', 'danang', 'saigon', 'sydney', 'melbourne', 'brisbane', 'bachdinh', 'nhatron', 'dragon', 'house8'];
const info = await page.evaluate(() => {
  const G = __sv; return { lm: G.interactables.filter(i => /^pc_/.test(i.id)).length, kiosks: G.interactables.filter(i => /^v_k_/.test(i.id)).map(i => [i.id, +i.x.toFixed(1), +i.z.toFixed(1)]), places: G.PLACES.length };
});
console.log(JSON.stringify(info));
for (const s of shots) {
  await page.evaluate(async s => {
    const G = __sv, h = G.heroes[0]; window.__lms = (await import('/js/regions.js')).LANDMARKS;
    const it = G.interactables.find(i => i.id === 'pc_' + s) || G.interactables.find(i => i.id === s);
    const W = { hanoi: [84, -24], bacninh: [44, -112], danang: [20, -62], saigon: [-8, 70], sydney: [-70, -16], melbourne: [-144, 50], brisbane: [-36, 36], dragon: [14, -58] }[s];
    const [x, z] = W || [it.x, it.z]; h.place(x, z); h.zoom = 1.15;
    const lm = (window.__lms || []).find(l => l.id === s);
    const C = { hanoi: [84, -40], bacninh: [48, -124], danang: [4, -62], saigon: [-8, 86], sydney: [-70, -32], melbourne: [-144, 66], brisbane: [-36, 52], dragon: [37, -62] }[s];
    const tx = C ? C[0] : lm ? lm.mx : it.x + 1, tz = C ? C[1] : lm ? lm.mz : it.z;
    h.camYaw = Math.atan2(x - tx, z - tz); h.yaw = h.camYaw + Math.PI;
  }, s);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `out/city-${s}.png` });
}
const mapUrl = await page.evaluate(async () => { const W = await import('/js/world.js'); const c = W.paintMap(400); return c.toDataURL(); });
fs.writeFileSync('out/map2.png', Buffer.from(mapUrl.split(',')[1], 'base64'));
console.log(errors);
await b.close();
