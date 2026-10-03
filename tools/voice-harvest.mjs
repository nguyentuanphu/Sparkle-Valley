// Plays through the game in a test browser (both languages) and writes every spoken line that is built while
// playing (names, numbers, colours, items…) to tools/voice-extra.json, so the voice pack can record them too.
// Needs the game served on SV_URL (default http://localhost:8765/) and the test browser (cd tests && npm install).
//   node tools/voice-harvest.mjs [--passes 3] [--no-world]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { launch, open, clear } = await import(path.join(ROOT, 'tests/harness.mjs'));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PASSES = +arg('--passes', 3), WORLD = !process.argv.includes('--no-world');
const OUT = path.join(ROOT, 'tools/voice-extra.json');
const found = new Map(); // lang|text -> {lang, text}
try { for (const l of JSON.parse(fs.readFileSync(OUT, 'utf8'))) found.set(l.lang + '|' + l.text, l); } catch (e) { }
const save = () => fs.writeFileSync(OUT, JSON.stringify([...found.values()].sort((a, b) => (a.lang + a.text).localeCompare(b.lang + b.text)), null, 0).replace(/\},\{/g, '},\n{') + '\n');
const pre = () => { window.__svHeard = []; window.__svVoiceLog = (lang, text) => window.__svHeard.push([lang, text]); speechSynthesis.speak = u => setTimeout(() => { try { u.onend && u.onend(); } catch (e) { } }, 20); };
const collect = async page => { const h = await page.evaluate(() => window.__svHeard.splice(0)); let n = 0; for (const [lang, text] of h) { const k = lang + '|' + text; if (text && !found.has(k)) { found.set(k, { lang, text }); n++; } } return n; };
let b = await launch();
const start = async lang => {
  try { await b.contexts()[0]?.close(); } catch (e) { }
  if (!b.isConnected()) b = await launch();
  const P = await open(b, { w: 800, h: 600, lang, settings: { voice: true, bilingual: false }, pre }); await clear(P.page);
  await P.page.evaluate(() => { const r = __sv.renderer; r.setPixelRatio(.15); dispatchEvent(new Event('resize')); });
  return P;
};
for (const lang of ['en', 'vi']) {
  let P = await start(lang);
  // run one step; if the test page crashes, open a fresh one and go on
  const step = async f => { try { await f(P.page); } catch (e) { console.log(lang, 'page restarted:', String(e.message).slice(0, 80)); try { await P.ctx.close(); } catch (x) { } try { P = await start(lang); } catch (x) { try { await b.close(); } catch (y) { } b = await launch(); P = await start(lang); } } };
  const ids = await P.page.evaluate(async () => Object.keys((await import('/js/games/frame.js')).GAMES));
  for (let pass = 0; pass < PASSES; pass++) {
    if (pass) { try { await P.ctx.close(); } catch (e) { } try { await b.close(); } catch (e) { } b = await launch(); P = await start(lang); } // a fresh browser each pass
    let added = 0;
    for (const id of ids) {
      await step(async page => {
        await page.evaluate(id => { __sv.playGame(0, id, 'replay'); }, id); await page.waitForTimeout(500);
        for (let k = 0; k < 25; k++) { await page.evaluate(() => { const bs = [...document.querySelectorAll('.gl button, .gl [data-i], .gl .card, .gl .opt, .gl .tile, .gl .cell')].filter(b => !b.closest('.gl-top') && !/gl-x|gl-next/.test(b.className) && !b.disabled); bs.length && bs[Math.floor(Math.random() * bs.length)].click(); }); await page.waitForTimeout(90); }
        await page.evaluate(() => { document.querySelectorAll('.gl .gl-x').forEach(x => x.click()); }); await page.waitForTimeout(150);
        await page.evaluate(() => { document.querySelectorAll('.gl, .storybook, .dialog, .modal, .reward').forEach(e => e.remove()); __sv.paused = false; });
        added += await collect(page);
      });
    }
    save(); console.log(lang, 'games pass', pass + 1, '+' + added, 'total', found.size);
  }
  if (WORLD) {
    try { await P.ctx.close(); } catch (e) { } try { await b.close(); } catch (e) { } b = await launch(); P = await start(lang);
    const n = await P.page.evaluate(() => __sv.interactables.length); let added = 0;
    for (let i = 0; i < n; i++) {
      await step(async page => {
        await page.evaluate(i => { const G = __sv, it = G.interactables[i], h = G.heroes[0]; if (!it || /^g\d|^lf|tower|^pot/.test(it.id || '')) return; try { const r = it.act(h, G); r && r.catch && r.catch(() => { }); } catch (e) { } }, i);
        await page.waitForTimeout(120);
        for (let k = 0; k < 2; k++) { await page.evaluate(() => { const bs = [...document.querySelectorAll('.dialog button, .modal button')].filter(b => !/close|✕|×|photo|360|street/i.test(b.className + b.textContent)); bs.length && bs[Math.floor(Math.random() * bs.length)].click(); }); await page.waitForTimeout(80); }
        await page.evaluate(() => { document.querySelectorAll('.storybook, .dialog, .modal, .vc-pop, .reward, .realview, .gl').forEach(e => e.remove()); __sv.paused = false; });
        if (i % 25 === 24) { added += await collect(page); save(); console.log(lang, 'world', i + 1, '/', n, 'total', found.size); }
      });
    }
    await step(async page => { added += await collect(page); }); save(); console.log(lang, 'world done +' + added, 'total', found.size);
  }
  await P.ctx.close();
}
await b.close();
console.log('Saved', found.size, 'lines to tools/voice-extra.json');
