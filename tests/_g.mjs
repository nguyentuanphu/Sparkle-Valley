import { launch, open } from './harness.mjs';
const b = await launch(); const P = await open(b, { w: 800, h: 600 }); await P.page.waitForTimeout(800);
console.log(JSON.stringify(await P.page.evaluate(async () => { const W = await import('/js/world.js'); const out = [];
  for (let z = 6; z <= 22; z += .5) out.push([z, +__sv.world.groundAt(153, z).toFixed(2), +W.heightAt(153, z).toFixed(2), W.levelAt(153, z)]);
  const c = W.CITIES.find(c => c.id === 'danang'); return { out, c: [c.z0, c.z1, c.h] }; })));
await b.close();
