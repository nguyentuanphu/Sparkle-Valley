import { launch, open } from './harness.mjs';
const b = await launch(); const P = await open(b, { w: 800, h: 600 }); await P.page.waitForTimeout(1000);
console.log(JSON.stringify(await P.page.evaluate(async () => { const W = await import('/js/world.js'); const g = (x, z) => +__sv.world.groundAt(x, z).toFixed(2);
  return { ringAt96: [g(96, -28), g(96, -20), g(96, -36)], islandE: [80, 84, 86, 88, 90, 92, 94].map(x => [x, g(x, -28)]), danangGate: [12, 14, 16, 18, 20, 22, 24, 26].map(z => [z, g(153, z)]), danangH: W.CITIES.find(c => c.id === 'danang').h }; })));
await b.close();
