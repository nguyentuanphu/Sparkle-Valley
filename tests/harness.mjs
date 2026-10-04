// Shared helpers for the browser checks: open the game, start a session, collect errors.
import { chromium } from 'playwright';
export const URL = process.env.SV_URL || 'http://localhost:8765/';
export async function launch() {
  return chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--js-flags=--expose-gc'] });
}
export async function open(browser, { w = 1180, h = 820, lang = 'en', mode = 'solo', touch = false, settings = {}, play = true, pre = null, dpr = 1, fast = true, url = URL, screen = 'valley' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  const errors = [];
  page.on('dialog', d => { errors.push('dialog: ' + d.message()); d.accept().catch(() => { }); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/peerjs|0\.peerjs|ERR_|Failed to load resource|net::|WebSocket connection to/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.addInitScript(([lang, s]) => { try { const o = JSON.parse(localStorage.getItem('sv2_settings') || '{}'); Object.assign(o, { lang, voice: false, sound: false, music: false, quality: 'low', autoPack: false }, s); localStorage.setItem('sv2_settings', JSON.stringify(o)); } catch (e) { } }, [lang, settings]);
  if (pre) await page.addInitScript(pre);
  await page.goto(url);
  await page.waitForSelector('.screen.title', { timeout: 90000 });
  // the test browser draws in software: draw fewer pixels so checks run quicker
  if (fast) await page.evaluate(() => { const r = window.__sv.renderer; if (r) { r.setPixelRatio(.35); dispatchEvent(new Event('resize')); } });
  if (!play) return { ctx, page, errors };
  await start(page, mode, screen);
  return { ctx, page, errors };
}
// from the title screen into the valley (also after a reload)
// screen: which start screen the children chose (js/simple.js); the checks walk the valley unless they say 'simple'
export async function start(page, mode = 'solo', screen = 'valley') {
  await page.waitForSelector('.screen.title', { timeout: 90000 });
  await page.click('.screen.title .press', { force: true });
  await page.waitForSelector('.screen.who');
  if (mode !== 'solo') await page.click(`.modes button[data-m=${mode}]`);
  await page.locator('.pick[data-id]').nth(0).click(); if (mode === 'split') await page.locator('.pick[data-id]').nth(1).click();
  if (screen) await page.evaluate(async scr => { const S = await import('/js/state.js'); S.profiles.forEach(p => { p.screen = scr; }); }, screen);
  await page.click('.who .go');
  await page.waitForFunction(() => window.__sv && window.__sv.heroes.length > 0);
  // skip the prologue
  for (let i = 0; i < 40; i++) { const sb = await page.$('.storybook'); if (!sb) break; await page.evaluate(() => { const b = document.querySelector('.storybook .sb-next, .storybook .next, .storybook button:last-of-type'); b && b.click(); }); await page.waitForTimeout(80); }
  await page.evaluate(() => { document.querySelectorAll('.storybook').forEach(e => e.remove()); window.__sv.paused = false; });
  await page.waitForTimeout(500);
}
// close story pages, dialogs and pop-ups that the world opens by itself
export async function clear(page) {
  await page.evaluate(() => { document.querySelectorAll('.storybook, .dialog, .modal, .vc-pop, .reward').forEach(e => e.remove()); window.__sv.paused = false; });
  await page.waitForTimeout(150);
}
