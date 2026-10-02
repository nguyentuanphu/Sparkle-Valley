import { launch, open, clear } from './harness.mjs';
const b = await launch();
const { page, errors } = await open(b, { w: 900, h: 640 });
await clear(page);
const r = await page.evaluate(async () => {
  const { farm } = await import('/js/state.js'); farm.coins = 500;
  const G = __sv, h = G.heroes[0], out = {};
  h.place(-20, 110);
  // adopt kitty (puppy already there)
  G.pets.openAdopt(h); document.querySelector('[data-ad="kitty"]').click();
  document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
  out.mine = h.profile.pets.map(p => p.kind);
  out.live = G.pets.forHero(h).map(L => [L.pt.kind, L.obj.visible, +L.obj.position.y.toFixed(1)]);
  // send the puppy to the yard, adopt a bunny
  window.confirm = () => true;
  G.pets.openAdopt(h); document.querySelector('[data-bye="0"]').click();
  out.afterBye = h.profile.pets.map(p => p.kind); out.yard = farm.petYard.map(p => p.kind); out.yardMeshes = G.pets.yardMeshes().length;
  document.querySelector('[data-ad="bunny"]').click(); document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
  out.withBunny = h.profile.pets.map(p => p.kind);
  // swap: send kitty home, bring the puppy back
  G.pets.openAdopt(h); document.querySelector('[data-bye="0"]').click(); document.querySelector('[data-take="0"]').click();
  out.final = h.profile.pets.map(p => p.kind); out.finalYard = farm.petYard.map(p => p.kind);
  document.querySelectorAll('.modal').forEach(m => m.remove()); G.paused = false;
  return out;
});
console.log(JSON.stringify(r));
await page.waitForTimeout(2500);
await page.evaluate(() => { const h = __sv.heroes[0]; h.camYaw = Math.PI * .2; });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'out/pets.png' });
await page.evaluate(() => { const y = __sv.interactables.find(i => i.id === 'petyard'); __sv.heroes[0].place(y.x, y.z + 7); });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'out/petyard.png' });
console.log(errors);
await b.close();
