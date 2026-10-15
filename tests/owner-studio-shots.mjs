// Matching Studio pictures for points 35 and 37: a page with its explanation open, and Analytics' Performance section.
// Usage (from the tests folder of the source to show): SV_SHOT=<folder> node owner-studio-shots.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, seedPlayers } from './harness.mjs';
import { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs } from './studio-check.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), out = process.env.SV_SHOT; fs.mkdirSync(out, { recursive: true });
const repo = 'family/shots', password = 'shots-fixture-password-123', site = 'http://localhost:8797';
const gh = fakeGitHub(repo, { 'content/custom.json': '{}', 'js/build.js': fs.readFileSync(path.join(root, 'js/build.js')) }), unroute = routeGitHub(gh);
const players = memoryBlobs(); try { await seedPlayers?.(players); } catch (e) { }
const server = await fakeNetlify({ port: 8797, players, env: { STUDIO_PASSWORD: password, GITHUB_TOKEN: 'fixture-token', GITHUB_REPO: repo, URL: site } });
const browser = await launch(), notes = [];
try {
  for (const [label, viewport, touch] of [['phone', { width: 390, height: 844 }, true], ['desktop', { width: 1180, height: 800 }, false]]) {
    const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch }), pg = await ctx.newPage();
    await pg.addInitScript(() => localStorage.setItem('studioLang', 'en'));
    await pg.goto(site + '/studio'); await pg.fill('#pw', password); await pg.click('#si button'); await pg.waitForSelector('#tabs button');
    await pg.evaluate(() => { location.hash = 'album'; }); await pg.waitForTimeout(2500);
    notes.push({ label, album: await pg.evaluate(() => { const h = document.querySelector('#page .studio-help'); if (h) { h.open = true; h.scrollIntoView({ block: 'start' }); } return h ? h.textContent.trim().slice(0, 200) : null; }) });
    await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(out, `${label}-album-help.png`) });
    await pg.evaluate(() => { location.hash = 'players'; }); await pg.waitForTimeout(3500);
    notes.push({ label, performance: await pg.evaluate(() => { const d = [...document.querySelectorAll('#page details')].find(x => /Performance|Hiệu năng/.test(x.querySelector('summary')?.textContent || '')); if (d) { d.open = true; d.scrollIntoView({ block: 'start' }); } return d ? d.textContent.replace(/\s+/g, ' ').trim().slice(0, 300) : null; }) });
    await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(out, `${label}-analytics-performance.png`) });
    await ctx.close();
  }
} finally { await browser.close(); unroute(); server.close(); fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(notes, null, 2) + '\n'); }
console.log(JSON.stringify(notes).slice(0, 1200));
