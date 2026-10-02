import { launch, open, clear } from './harness.mjs';
const b = await launch();
for (const lang of ['vi', 'en']) {
  const { page, errors, ctx } = await open(b, { w: 900, h: 640, lang });
  await clear(page);
  await page.evaluate(() => __sv.openGamesHub(0)); await page.waitForTimeout(700);
  const n = await page.evaluate(() => document.querySelectorAll('.hub [data-tale]').length);
  await page.evaluate(id => document.querySelector(`.hub [data-tale="${id}"]`).click(), lang === 'vi' ? 'caykhe' : 'crow');
  await page.waitForTimeout(4500);
  const st = await page.evaluate(() => ({ theatre: !!document.querySelector('.theatre'), d: Math.hypot(__sv.heroes[0].pos.x - __sv.storyteller.x, __sv.heroes[0].pos.z - __sv.storyteller.z).toFixed(1), text: (document.querySelector('.th-text') || {}).innerText }));
  await page.screenshot({ path: `out/tale-${lang}-1.png` });
  await page.evaluate(() => document.querySelector('.th-next').click()); await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('.th-next').click()); await page.waitForTimeout(1500);
  await page.screenshot({ path: `out/tale-${lang}-3.png` });
  console.log(lang, n, JSON.stringify(st), errors);
  await ctx.close();
}
await b.close();
