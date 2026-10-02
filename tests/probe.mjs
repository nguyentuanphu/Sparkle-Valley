import { launch, open } from './harness.mjs';
const b = await launch();
for (const [w, h, touch] of [[1180, 820, false], [390, 844, true], [844, 390, true]]) {
  const { page, errors, ctx } = await open(b, { w, h, touch });
  await page.screenshot({ path: `out/probe-${w}x${h}.png` });
  console.log(w, h, errors);
  await ctx.close();
}
await b.close();
