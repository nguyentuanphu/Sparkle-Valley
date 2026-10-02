import { launch, open, clear } from './harness.mjs';
const b = await launch();
const { page, errors } = await open(b, { w: 1000, h: 700 });
await clear(page);
for (const [n, x, z, yaw] of [['playground', 28, 70, 0], ['culture', 100, 46, 0]]) {
  await page.evaluate(([x, z, yaw]) => { const h = __sv.heroes[0]; h.place(x, z); h.camYaw = yaw; h.zoom = 1; }, [x, z, yaw]);
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `out/chat-${n}.png` });
}
// games hub tap flies to the host
await clear(page);
await page.evaluate(() => __sv.openGamesHub(0)); await page.waitForTimeout(600);
await page.evaluate(() => document.querySelector('[data-play="koala"]').click());
await page.waitForTimeout(5000);
console.log(await page.evaluate(() => ({ pos: [__sv.heroes[0].pos.x.toFixed(1), __sv.heroes[0].pos.z.toFixed(1)], game: !!document.querySelector('.gl') })));
console.log(errors);
await b.close();
