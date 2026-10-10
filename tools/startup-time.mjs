// Start-up timing (Analytics & Infra, 10 Oct): how much the game downloads before its first screen and how long it takes
// to show it, on a fresh device, on a slow phone connection, and with the game saved on the device (service worker) both
// offline and on a connection that never answers ("Wi-Fi with no internet"). For the round report; not a pass/fail check
// (the `offline` and `perf` checks are).
//   cd tests && node ../tools/startup-time.mjs [folder]      (folder: the copy to measure, default the repo; e.g. ../netlify-site)
// It serves the folder itself on 127.0.0.2 (the game skips its service worker on localhost and 127.0.0.1) and can make
// that server stop answering.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { launch } from '../tests/harness.mjs';
const root = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '..'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
let hang = false;
const srv = http.createServer((q, r) => {
  if (hang) return; // never answers
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); fs.createReadStream(f).pipe(r);
});
await new Promise(res => srv.listen(0, '127.0.0.2', res));
const url = `http://127.0.0.2:${srv.address().port}/`;
const b = await launch();
const prep = async ctx => ctx.addInitScript(() => { try { localStorage.setItem('sv2_settings', JSON.stringify({ voice: false, sound: false, music: false, quality: 'low', autoPack: false })); } catch (e) { } });
async function first(ctx, page, { slow = false } = {}) {
  if (slow) { const c = await ctx.newCDPSession(page); await c.send('Network.enable'); await c.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 }); }
  const t0 = Date.now(); await page.goto(url); await page.waitForSelector('.screen.title', { timeout: 180000 });
  const ms = Date.now() - t0;
  const mb = await page.evaluate(() => performance.getEntriesByType('resource').concat(performance.getEntriesByType('navigation')).reduce((a, e) => a + (e.encodedBodySize || e.transferSize || 0), 0) / 1e6);
  return { ms, mb: +mb.toFixed(2) };
}
const out = {};
{ const ctx = await b.newContext(); await prep(ctx); const p = await ctx.newPage(); out.fresh = await first(ctx, p); await ctx.close(); }
{ const ctx = await b.newContext(); await prep(ctx); const p = await ctx.newPage(); out.slow4g = await first(ctx, p, { slow: true }); await ctx.close(); }
{
  const ctx = await b.newContext(); await prep(ctx); const p = await ctx.newPage();
  await p.goto(url); await p.waitForSelector('.screen.title', { timeout: 90000 });
  // wait until the service worker has saved the game
  await p.waitForFunction(async () => { const r = await navigator.serviceWorker?.getRegistration(); return !!(r && r.active); }, null, { timeout: 120000 });
  await p.waitForTimeout(1500);
  const again = async (limit = 60000) => { const t0 = Date.now(); await p.reload({ timeout: limit }).catch(() => { }); await p.waitForSelector('.screen.title', { timeout: Math.max(1000, limit - (Date.now() - t0)) }).catch(() => { }); return (await p.$('.screen.title').catch(() => null)) ? Date.now() - t0 : `not in ${limit / 1000} s`; };
  out.saved = await again();
  await ctx.setOffline(true); out.offline = await again(); await ctx.setOffline(false);
  hang = true; out.noAnswer = await again(); hang = false;
  await ctx.close();
}
console.log(JSON.stringify(out));
await b.close(); srv.closeAllConnections(); srv.close();
