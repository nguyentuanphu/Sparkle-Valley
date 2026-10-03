// Ground audit: every building and landmark stands on dry, level ground (not over the river, the lake or the sea,
// not floating or sunk), and roads lie on the ground (not buried, not floating, never across water without a bridge).
//   node world-audit.mjs   (also run as the "ground" check in run.mjs)
import { launch, open, clear } from './harness.mjs';
export async function groundAudit(page) {
  return page.evaluate(async () => {
    const W = await import('/js/world.js'), G = __sv, w = G.world, bad = [];
    const named = (x, z) => { let best = null, bd = 9; for (const it of G.interactables) { const d = Math.hypot(it.x - x, it.z - z); if (d < bd) { bd = d; best = it; } } try { return best ? (typeof best.label === 'function' ? best.label({ i: 0, profile: {}, pos: { y: 0 } }) : best.id) : ''; } catch (e) { return best.id || ''; } };
    const onBridge = (x, z) => [W.BRIDGE, W.DRAGON].some(B => B && x > B.x0 - 4 && x < B.x1 + 4 && Math.abs(z - B.z) < B.w);
    const lakeD = (x, z) => Math.hypot(x - W.LAKE.x, z - W.LAKE.z);
    const things = [];
    for (const b of w.boxes) if (!b.room && b.x1 - b.x0 < 40 && b.z1 - b.z0 < 40 && b.x1 - b.x0 > 1.2 && b.z1 - b.z0 > 1.2) things.push(['box', b.x0, b.x1, b.z0, b.z1]);
    // (natural boulders scattered over the hills have odd sizes like 2.0377 and may sit on slopes or in streams)
    for (const c of w.colliders) if (c.r >= 2 && c.r <= 12 && Math.abs(c.r * 20 - Math.round(c.r * 20)) < 1e-6) things.push(['col', c.x - c.r * .7, c.x + c.r * .7, c.z - c.r * .7, c.z + c.r * .7]);
    for (const [k, x0, x1, z0, z1] of things) {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      if (onBridge(cx, cz)) continue;
      let lo = 1e9, hi = -1e9, wet = 0, n = 0;
      for (let x = x0; x <= x1 + .01; x += Math.max(.5, (x1 - x0) / 6)) for (let z = z0; z <= z1 + .01; z += Math.max(.5, (z1 - z0) / 6)) {
        const h = W.heightAt(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h); n++;
        if (h < W.WATER + .3 || W.riverDist(x, z) < 6 || lakeD(x, z) < W.LAKE.r * .62) wet++;
      }
      if (wet) bad.push({ what: 'over water', k, at: [+cx.toFixed(1), +cz.toFixed(1)], size: [+(x1 - x0).toFixed(1), +(z1 - z0).toFixed(1)], wet: `${wet}/${n}`, near: named(cx, cz) });
      else if (hi - lo > 1.6) bad.push({ what: 'uneven ground', k, at: [+cx.toFixed(1), +cz.toFixed(1)], size: [+(x1 - x0).toFixed(1), +(z1 - z0).toFixed(1)], drop: +(hi - lo).toFixed(2), near: named(cx, cz) });
    }
    // roads: compare the ribbon's surface with the ground under it
    const roads = [];
    G.scene.traverse(o => { if (o.userData && o.userData.road && o.geometry) roads.push(o); });
    const rbad = new Map();
    for (const o of roads) {
      const pa = o.geometry.attributes.position; o.updateMatrixWorld(); const e = o.matrixWorld.elements;
      for (let i = 0; i < pa.count; i += 1) {
        const x = pa.getX(i) + e[12], y = pa.getY(i) + e[13], z = pa.getZ(i) + e[14];
        if (onBridge(x, z)) continue;
        const g = W.heightAt(x, z), key = Math.round(x / 6) + ',' + Math.round(z / 6);
        let why = null;
        if (y < g - .25) why = 'road buried';
        else if (y > g + 1.4) why = 'road floating';
        else if (g < W.WATER + .2 || W.riverDist(x, z) < 4.5) why = 'road in water';
        if (why && !rbad.has(key)) rbad.set(key, { what: why, at: [+x.toFixed(1), +z.toFixed(1)], road: o.name || '', dy: +(y - g).toFixed(2) });
      }
    }
    return { buildings: things.length, bad, roads: roads.length, roadBad: [...rbad.values()] };
  });
}
if (process.argv[1] && process.argv[1].endsWith('world-audit.mjs')) {
  const b = await launch(); const P = await open(b, { w: 900, h: 700 }); await clear(P.page);
  const r = await groundAudit(P.page);
  console.log(JSON.stringify({ buildings: r.buildings, roads: r.roads, problems: r.bad.length, roadProblems: r.roadBad.length }));
  for (const x of r.bad) console.log(JSON.stringify(x));
  for (const x of r.roadBad.slice(0, 80)) console.log(JSON.stringify(x));
  await b.close();
}
