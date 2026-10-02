import { launch, open, clear } from './harness.mjs';
const b = await launch();
const out = {}; const log = (...a) => console.log(new Date().toISOString().slice(11,19), ...a);
{
  const { page, errors, ctx } = await open(b, { w: 1180, h: 820 });
  await page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d._autoClose && d._autoClose()));
  await page.waitForTimeout(400);
  // put the hero near the pet so the action shows
  await page.evaluate(() => { const G = __sv, h = G.heroes[0]; h.place(-26, 110); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'out/desk-act.png' });
  // games hub flags
  await clear(page); await page.keyboard.press('KeyG'); await page.waitForTimeout(600);
  out.hubUndefined = await page.evaluate(() => document.querySelector('.hub').innerText.includes('undefined'));
  out.flags = await page.evaluate(() => document.querySelectorAll('.hflag svg').length);
  await page.evaluate(() => document.querySelector('.hub .x').click()); await page.waitForTimeout(300);
  // pad heights through all tabs
  await clear(page); await page.keyboard.press('KeyM'); await page.waitForTimeout(600);
  const hs = [];
  for (let k = 1; k <= 8; k++) { await page.keyboard.press('Digit' + k); await page.waitForTimeout(250); hs.push(await page.evaluate(() => { const r = document.querySelector('.pad .card').getBoundingClientRect(); return Math.round(r.top) + ':' + Math.round(r.height); })); }
  out.padRects = hs; log('pad', hs);
  await page.screenshot({ path: 'out/desk-pad.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  log('esc'); out.padClosed = await page.evaluate(() => !document.querySelector('.pad'));
  // zoom
  await clear(page); const z0 = await page.evaluate(() => __sv.heroes[0].zoom || 1);
  await page.evaluate(() => { const b = document.querySelector('.z-out'); ['pointerdown'].forEach(t => b.dispatchEvent(new PointerEvent(t, { bubbles: true }))); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  out.zoom = [z0, await page.evaluate(() => __sv.heroes[0].zoom)];
  // dialog auto-close
  await page.evaluate(() => { __sv.dialog('Test', [['Hello there', 'Chào']]); });
  await page.waitForTimeout(200);
  await page.evaluate(() => { const h = __sv.heroes[0]; h.place(h.pos.x + 15, h.pos.z); });
  await page.waitForTimeout(800);
  log('dlg'); out.dialogGone = await page.evaluate(() => !document.querySelector('.dialog:not(.out)'));
  out.errors = errors;
  await ctx.close();
}
{
  const { page, errors, ctx } = await open(b, { w: 375, h: 812, touch: true });
  await page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d._autoClose && d._autoClose()));
  await page.evaluate(() => { const G = __sv, h = G.heroes[0]; h.place(-26, 110); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'out/phone-act.png' }); log('phone');
  out.phone = await page.evaluate(() => {
    const r = s => { const e = document.querySelector(s); if (!e || e.hidden) return null; const q = e.getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom].map(Math.round); };
    return { ask: r('.dk.voicecmd'), run: r('.mv.run'), jump: r('.mv.jump'), bag: r('.dk.bag'), act: r('.act') };
  });
  await clear(page); await page.click('.dk.voicecmd'); await page.waitForTimeout(500);
  await page.screenshot({ path: 'out/phone-ask.png' });
  out.phoneErrors = errors;
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1));
await b.close();
