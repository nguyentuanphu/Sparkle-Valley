// Behaviour smoke checks for the combined owner round. Run sequentially after the suite, with the game server.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { launch, open, clear } from './harness.mjs';
const browser = await launch(); fs.mkdirSync('out/owner-round', { recursive: true });
const results = [];
try {
  for (const [w, h, touch, lang] of [[390,844,true,'en'],[390,844,true,'vi'],[820,1180,true,'en'],[1280,800,false,'en']]) {
    const P = await open(browser, { w, h, touch, lang }); const { page } = P; await clear(page);
    await page.evaluate(() => window.__sv.openPad(0, 'shop')); await page.waitForSelector('.pad .shop-content');
    assert.equal(await page.locator('.modal.pad').count(), 1); assert.equal(await page.locator('.modal.shopk').count(), 0);
    assert.equal(await page.locator('.shop-collections button').count(), 3);
    await page.click('.pad [data-go="wardrobe"]'); await page.waitForSelector('.pad .wardrobe-content');
    assert.equal(await page.locator('.pad .shop-preview').count(), 1); await page.screenshot({ path: `out/owner-round/mirror-${w}-${lang}.png` });
    await page.click('.pad .whead .x'); await page.click('.pad [data-t="bag"]');
    await page.evaluate(async () => { const S = await import('/js/state.js'); S.profiles[0].dishes = { ...(S.profiles[0].dishes || {}), steamedrice: 1 }; });
    const sizes = await page.locator('.pad .slot > svg').evaluateAll(nodes => nodes.map(n => { const r = n.getBoundingClientRect(); return [r.width,r.height]; }));
    assert.ok(sizes.every(([x,y]) => x >= 48 && y >= 48), JSON.stringify(sizes));
    const bagAction = page.locator('.pad [data-wear], .pad [data-unwear], .pad [data-hat]').first();
    if (await bagAction.count()) { await bagAction.click(); await page.waitForSelector('.bag-help'); await page.screenshot({ path: `out/owner-round/bag-${w}-${lang}.png` }); await page.click('.bh-close'); }
    await page.click('.pad-head .x'); await page.waitForTimeout(250);
    await page.click('.hud .dk.snd'); await page.waitForSelector('.audio-tray'); await page.screenshot({ path: `out/owner-round/audio-${w}-${lang}.png` }); await page.click('.audio-tray .ss-done');
    const compass = await page.locator('.hud .z-where').isVisible(); assert.equal(compass, false);
    await page.evaluate(() => window.__sv.openGamesHub(0)); await page.waitForSelector('.hubbody');
    await page.locator('.hplay').first().click(); await page.waitForSelector('.gl', { timeout: 60000 }); await page.click('.gl-x');
    await page.waitForSelector('.hubbody'); assert.ok(await page.locator('.hubbody').isVisible());
    await page.locator('.modal.gameshub .x, .modal.playhub .x, .modal.hub .x').first().click().catch(async () => { await page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); window.__sv.paused = false; }); });
    await page.evaluate(async () => { const U = await import('/js/ui.js'); U.openGrownups(); }); await page.waitForSelector('.grownups #gDone');
    await page.screenshot({ path: `out/owner-round/settings-${w}-${lang}.png` });
    assert.ok(await page.locator('.family-device-panel').count());
    const controls = await page.locator('.grownups #gDone').boundingBox(); assert.ok(controls.x >= 0 && controls.x + controls.width <= w && controls.y + controls.height <= h);
    assert.equal(P.errors.length, 0, P.errors.join('\n'));
    results.push({ w,h,lang, passed:true }); await P.ctx.close();
  }
  const P = await open(browser, { w:390,h:844,touch:true }); await clear(P.page);
  const games = ['rulefinder','gardenorder','steppingpath','rd_listentouch','rd_storychoice'];
  await P.page.evaluate(async () => { await import('/js/games/readingmenu.js'); });
  for (const id of games) {
    await P.page.evaluate(id => { window.__sv.playGame(0,id,'place'); }, id); await P.page.waitForSelector('.gl');
    await P.page.evaluate(async () => {
      const { playWatch } = await import('/js/games/frame.js');
      const end = Date.now() + 30000;
      while (Date.now() < end && !document.querySelector('.gl-win')) { const ask = playWatch.ask; if (ask) { const right = ask.els.find(ask.check); right?.click(); } await new Promise(r => setTimeout(r,100)); }
    });
    assert.ok(await P.page.locator('.gl-win').count(), id + ' cannot complete'); await P.page.screenshot({ path:`out/owner-round/game-${id}.png` });
    await P.page.waitForTimeout(600); await P.page.locator('.gl-win p').first().click(); await P.page.waitForSelector('.gl', { state:'detached' }); await P.page.waitForTimeout(350); await clear(P.page); results.push({ game:id,passed:true });
  }
  assert.equal(P.errors.length,0,P.errors.join('\n')); await P.ctx.close();
} finally { await browser.close(); fs.writeFileSync('out/owner-round/results.json',JSON.stringify(results,null,2)); }
console.log(JSON.stringify(results));
