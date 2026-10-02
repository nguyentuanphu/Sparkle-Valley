import { launch, open, clear } from './harness.mjs';
const b = await launch();
const { page } = await open(b, { w: 600, h: 500 });
await clear(page);
const res = await page.evaluate(async () => {
  const W = await import('/js/world.js'); const G = __sv;
  const pts = [];
  W.SHRINES.concat(W.TOWERS, W.LEAFIES).forEach(c => pts.push([c.x, c.z]));
  (G.world.boxes || []).forEach(b => { for (let x = b.x0; x <= b.x1; x += 3) for (let z = b.z0; z <= b.z1; z += 3) pts.push([x, z]); });
  G.interactables.forEach(i => { if (Number.isFinite(i.x)) pts.push([i.x, i.z]); });
  (G.npcs || []).forEach(n => pts.push([n.x, n.z]));
  (G.world.houses || []).forEach(h => pts.push([h.x, h.z]));
  const out = [];
  for (let x = -168; x <= 168; x += 4) for (let z = -160; z <= 168; z += 4) {
    let dmin = 1e9; for (const [px, pz] of pts) { const d = Math.hypot(px - x, pz - z); if (d < dmin) dmin = d; }
    let lo = 1e9, hi = -1e9, wet = false;
    for (let a = 0; a < 12; a++) for (const r of [0, 6, 12]) { const h = W.heightAt(x + Math.cos(a / 12 * 6.28) * r, z + Math.sin(a / 12 * 6.28) * r); lo = Math.min(lo, h); hi = Math.max(hi, h); if (h < 1) wet = true; }
    const reg = W.regionAt(x, z);
    if (!wet && dmin > 14) out.push({ x, z, dmin: Math.round(dmin), rough: +(hi - lo).toFixed(1), h: +W.heightAt(x, z).toFixed(1), reg });
  }
  return { n: pts.length, out };
});
const good = res.out.filter(o => o.rough < 14).sort((a, b) => a.rough - b.rough);
console.log(res.n, good.length);
// pick well-separated
const chosen = [];
for (const o of good.sort((a, b) => b.dmin - a.dmin)) if (chosen.every(c => Math.hypot(c.x - o.x, c.z - o.z) > 34)) chosen.push(o);
console.log(chosen.slice(0, 30).map(o => JSON.stringify(o)).join('\n'));
await b.close();
