// Pictures of every story and guide film, a few moments into each page, for looking at by eye:
//   SV_URL=… CHROMIUM=… node filmshots.mjs <out folder> [film id …]
import fs from 'fs';
import { launch, open, clear } from './harness.mjs';
const out = process.argv[2] || 'film-shots', only = process.argv.slice(3);
fs.mkdirSync(out, { recursive: true });
const b = await launch();
const P = await open(b, { w: 1000, h: 700, fast: false }); await clear(P.page);
await P.page.evaluate(() => { __sv.renderer.setPixelRatio(.3); });
const list = await P.page.evaluate(async () => { const F = await import('/js/content/films.js'); return [...Object.keys(F.FILMS).map(id => ['tale', id, F.FILMS[id].pages.length]), ...Object.keys(F.GUIDES).map(id => ['guide', id, F.GUIDES[id].pages.length])]; });
for (const [kind, id, n] of list) {
  if (only.length && !only.includes(id)) continue;
  await P.page.evaluate(async ([kind, id]) => {
    if (kind === 'tale') { const { MORE_TALES } = await import('/js/talesdata.js'); const { TALES } = await import('/js/talesdata.js').catch(() => ({})); const all = [...(MORE_TALES || []), ...(TALES || [])]; const t = all.find(x => x.id === id); const { openTheatre } = await import('/js/tales.js'); openTheatre(t, { name: 'Na' }); await new Promise(r => setTimeout(r, 300)); document.querySelector('.th-auto').click(); }
    else { const { openHowTo } = await import('/js/howto.js'); openHowTo(id, {}); await new Promise(r => setTimeout(r, 300)); document.querySelector('.ht-pp').click(); }
  }, [kind, id]);
  for (let k = 0; k < n; k++) {
    const len = await P.page.evaluate(async k => { const F = await import('/js/film.js'); const f = F.filmNow(); f.page(k); f.narrated(); return f.now.len; }, k);
    const times = [.2, ...[...Array(Math.ceil(len / 2.6)).keys()].map(i => Math.min(len, (i + 1) * 2.6))];
    for (const t of times) {
      await P.page.evaluate(async t => { const F = await import('/js/film.js'); const p = F.filmNow().now; while (p.t < t) { if (p.hold) p.release(true); p.t = Math.min(t, p.t + .25); await new Promise(r => requestAnimationFrame(r)); } }, t);
      await P.page.waitForTimeout(250);
      const el = await P.page.$(kind === 'tale' ? '.th-stage' : '.ht-screen');
      await el.screenshot({ path: `${out}/${id}-p${k + 1}-t${String(t.toFixed(1)).padStart(4, '0')}.png` });
    }
  }
  await P.page.evaluate(() => { document.querySelector('.th-x, .ht-x')?.click(); });
  await P.page.waitForTimeout(400);
}
console.log(JSON.stringify({ errors: P.errors }));
await b.close();
