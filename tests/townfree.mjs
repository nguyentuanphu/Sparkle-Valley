import { launch, open, clear } from './harness.mjs';
const b = await launch();
const { page } = await open(b, { w: 600, h: 400 });
await clear(page);
console.log(await page.evaluate(async () => {
  const W = await import('/js/world.js'); const G = __sv, w = G.world;
  const lms = (await import('/js/regions.js')).LANDMARKS.filter(l => ['bachdinh', 'nhatron', 'bnclock', 'dendo'].includes(l.id)).map(l => [l.id, l.mx.toFixed(1), l.mz.toFixed(1)]);
  const free = (x, z, r) => w.colliders.every(o => Math.hypot(o.x - x, o.z - z) > o.r + r) && w.boxes.every(b => x < b.x0 - r || x > b.x1 + r || z < b.z0 - r || z > b.z1 + r) && G.interactables.every(i => !Number.isFinite(i.x) || Math.hypot(i.x - x, i.z - z) > 3);
  const out = [];
  for (let x = 4; x <= 60; x += 2) for (let z = 26; z <= 80; z += 2) { const r = 4; if (!free(x, z, r)) continue; const h = W.heightAt(x, z), sl = Math.abs(W.heightAt(x + 3, z) - W.heightAt(x - 3, z)) + Math.abs(W.heightAt(x, z + 3) - W.heightAt(x, z - 3)); if (h > 1.5 && sl < 2.5) out.push([x, z, W.regionAt(x, z), +h.toFixed(1)]); }
  // objects near Bắc Ninh gate
  const near = []; G.scene.traverse(o => { if (o.isMesh && !o.userData.outline) { const p = new (o.position.constructor)(); o.getWorldPosition(p); if (Math.hypot(p.x - 48, p.z + 106) < 6) near.push([o.geometry.type, p.x.toFixed(1), p.y.toFixed(1), p.z.toFixed(1)]); } });
  return JSON.stringify({ lms, free: out.filter(o => o[2] === 'town'), near });
}));
await b.close();
