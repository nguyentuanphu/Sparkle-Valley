// Shared helpers for the browser checks: open the game, start a session, collect errors.
import { chromium } from 'playwright';
export const URL = process.env.SV_URL || 'http://localhost:8765/';
export async function launch() {
  return chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--js-flags=--expose-gc'] });
}
// (round P: a new device starts with nobody; the checks play as two children made beforehand)
export const seedPlayers = () => { try { if (!localStorage.getItem('sv2_profiles')) localStorage.setItem('sv2_profiles', JSON.stringify([
    { id: 'kna', name: 'Bé Na', photo: null, age: 'little', difficulty: 'easy', look: { style: 'dress', color: '#ff5fa2', hat: 'bow', back: 'wings', hairStyle: 'buns' }, created: 1 },
    { id: 'kbin', name: 'Bé Bin', photo: null, age: 'little', difficulty: 'easy', look: { style: 'shirt', color: '#3b6fe0', hat: 'cap', back: 'cape', hairStyle: 'short' }, created: 2 }])); } catch (e) { } };
export async function open(browser, { w = 1180, h = 820, lang = 'en', mode = 'solo', touch = false, settings = {}, play = true, pre = null, dpr = 1, fast = true, url = URL, screen = 'valley' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  const errors = [];
  page.on('dialog', d => { errors.push('dialog: ' + d.message()); d.accept().catch(() => { }); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/peerjs|0\.peerjs|ERR_|Failed to load resource|net::|WebSocket connection to/.test(m.text())) errors.push('console: ' + m.text()); });
  // (round R privacy, 9 Oct) online play is off on a new device; the checks play with it on unless they pass online: false
  await page.addInitScript(([lang, s]) => { try { const o = JSON.parse(localStorage.getItem('sv2_settings') || '{}'); Object.assign(o, { lang, voice: false, sound: false, music: false, quality: 'low', autoPack: false, online: true }, s); localStorage.setItem('sv2_settings', JSON.stringify(o)); } catch (e) { } }, [lang, settings]);
  // (round P: a new device starts with nobody; the checks play as two children made beforehand)
  await page.addInitScript(seedPlayers);
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
  // (90 s like the title wait: with three software-drawn windows open, each frame takes half a second and a tap waits for one)
  await page.click('.screen.title .press', { force: true, timeout: 90000 });
  await page.waitForSelector('.screen.who', { timeout: 90000 });
  if (mode !== 'solo') await page.click(`.modes button[data-m=${mode}]`, { timeout: 90000 });
  await page.locator('.pick[data-id]').nth(0).click({ timeout: 90000 }); if (mode === 'split') await page.locator('.pick[data-id]').nth(1).click({ timeout: 90000 });
  if (screen) await page.evaluate(async scr => { const S = await import('/js/state.js'); S.profiles.forEach(p => { p.screen = scr; }); }, screen);
  // (round R) Ông Cú's prologue film starts by itself for a new child; the checks start without it unless they ask
  await page.evaluate(() => { if (window.__sv) window.__sv._owlAuto = true; });
  await page.click('.who .go', { timeout: 90000 });
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
