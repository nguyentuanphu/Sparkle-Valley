// Lists every script the game needs at start-up in index.html (<link rel="modulepreload">), so the browser fetches them all
// at once instead of one layer of imports after another (on a phone each layer costs a round trip: round R, "faster launch").
//   node tools/preload.mjs           update index.html
//   node tools/preload.mjs --check   say whether the list is up to date (the 'preload' check)
import fs from 'fs';
import path from 'path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const seen = new Set(), order = [];
const visit = rel => {
  if (seen.has(rel)) return; seen.add(rel);
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  // static imports only (import … from '…' and import '…'); import('…') loads later, when it is needed
  for (const m of src.matchAll(/^\s*(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm)) {
    const spec = m[1] || m[2]; if (!spec.startsWith('.')) continue;
    visit(path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec)));
  }
  order.push(rel);
};
visit('js/main.js');
const list = order.filter(f => f !== 'js/main.js');
const block = '<!-- preload:start (tools/preload.mjs) -->\n' + list.map(f => `<link rel="modulepreload" href="${f}">`).join('\n') + '\n<!-- preload:end -->';
const file = path.join(ROOT, 'index.html'), html = fs.readFileSync(file, 'utf8');
const re = /<!-- preload:start[\s\S]*?<!-- preload:end -->/;
const next = re.test(html) ? html.replace(re, block) : html.replace('</head>', block + '\n</head>');
if (process.argv.includes('--check')) { const ok = next === html; console.log(ok ? `up to date: ${list.length} scripts` : 'index.html preload list is out of date: run node tools/preload.mjs'); process.exit(ok ? 0 : 1); }
fs.writeFileSync(file, next); console.log(`index.html: ${list.length} scripts preloaded`);
