// Packs the game's scripts into a few small files for the website (Analytics & Infra, 10 Oct, task infra-speed): the
// start-up download shrinks (minified, ~150 files become a handful) and the phone makes far fewer requests.
//   node tools/bundle.mjs <folder>        pack the game inside <folder> (a copy: build-netlify.sh's netlify-site, or
//                                         Netlify's own checkout); the repository itself is never changed
// What it does in <folder>:
//   - bundle/: js/main.js and everything it imports, minified, split into chunks (stories and games that load later
//     stay in their own chunks); file names carry a content hash
//   - index.html: starts bundle/main.js and preloads its start-up chunks (instead of the ~150 js/ files)
//   - sw.js: the offline list keeps everything else and lists bundle/ instead of the game's js/ files
// js/ stays in <folder> untouched: Sparkle Studio's pages read the game's own modules. Development and the checks run on
// the plain modules with no build step. If esbuild cannot be found or installed, nothing is changed and the site works
// as before (the plain modules), so a deploy never fails because of this step.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
const ESBUILD = '0.25.10';
const HERE = path.dirname(new URL(import.meta.url).pathname);
// esbuild is installed outside the site (never published): the system's temp folder
const TOOL = path.join(os.tmpdir(), 'sv-esbuild-' + ESBUILD);
const dir = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(dir, 'index.html')) || !fs.existsSync(path.join(dir, 'sw.js'))) { console.error('usage: node tools/bundle.mjs <folder with index.html, sw.js and js/>'); process.exit(2); }
if (path.resolve(dir) === path.resolve(HERE, '..') && !process.env.NETLIFY) { console.error('bundle: refusing to change the repository itself; give it a copy (build-netlify.sh does)'); process.exit(2); }

async function loadEsbuild() {
  const tryReq = base => { try { return createRequire(path.join(base, 'x.js'))('esbuild'); } catch (e) { return null; } };
  let e = tryReq(TOOL) || tryReq(path.join(HERE, '..', 'tests'));
  if (e) return e;
  try {
    fs.mkdirSync(TOOL, { recursive: true });
    execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--no-audit', '--no-fund', '--no-save', '--prefix', TOOL, `esbuild@${ESBUILD}`], { stdio: 'inherit' });
  } catch (err) { return null; }
  return tryReq(TOOL);
}

const esbuild = await loadEsbuild();
if (!esbuild) { console.warn('bundle: esbuild not available: the site keeps the plain modules'); process.exit(0); }
// the game's modules that pages and the checks import by their own address (/js/state.js…): each gets its own small
// entry in bundle/, and an import map in index.html points the address at it, so they share the game's running copy
// (the plain js/ file would be a second copy that the game never sees)
const SHARED = ['js/state.js', 'js/custom.js', 'js/world.js', 'js/games/frame.js'];
const out = path.join(dir, 'bundle');
fs.rmSync(out, { recursive: true, force: true });
const res = await esbuild.build({
  entryPoints: { main: path.join(dir, 'js/main.js'), ...Object.fromEntries(SHARED.map(f => [f.replace(/^js\//, '').replace(/\.js$/, '').replace(/\//g, '-'), path.join(dir, f)])) }, bundle: true, splitting: true, format: 'esm', target: 'es2022',
  minify: true, keepNames: true, legalComments: 'none', charset: 'utf8', outdir: out, chunkNames: 'c-[hash]', entryNames: '[name]-[hash]',
  metafile: true, logLevel: 'error', preserveSymlinks: true // (a copy with linked folders, as the checks build it, keeps its own paths)
});
const rel = f => path.relative(dir, path.resolve(f)).split(path.sep).join('/');
const outputs = res.metafile.outputs, files = Object.keys(outputs).map(rel).filter(f => f.endsWith('.js')).sort();
const entry = Object.keys(outputs).find(k => outputs[k].entryPoint && rel(outputs[k].entryPoint) === 'js/main.js' && k.endsWith('.js'));
if (!entry) throw new Error('bundle: no output for js/main.js');
// the chunks the start needs (static imports from the entry, all the way down)
const start = new Set(), walk = k => { for (const i of outputs[k].imports || []) if (i.kind === 'import-statement' && !start.has(i.path)) { start.add(i.path); walk(i.path); } };
walk(entry);
// index.html: start the bundle, preload its start-up chunks
const idx = path.join(dir, 'index.html'); let html = fs.readFileSync(idx, 'utf8');
const pre = '<!-- preload:start (tools/bundle.mjs) -->\n' + [...start].map(f => `<link rel="modulepreload" href="${rel(f)}">`).join('\n') + '\n<!-- preload:end -->';
if (!/<!-- preload:start[\s\S]*?<!-- preload:end -->/.test(html) || !html.includes('src="js/main.js"')) throw new Error('index.html: no preload block or js/main.js script');
const imap = {}; for (const [k, o] of Object.entries(outputs)) if (o.entryPoint && SHARED.includes(rel(o.entryPoint))) imap['/' + rel(o.entryPoint)] = './' + rel(k);
const mapTag = `<script type="importmap">${JSON.stringify({ imports: imap })}</script>`;
html = html.replace(/<!-- preload:start[\s\S]*?<!-- preload:end -->/, mapTag + '\n' + pre).replace('src="js/main.js"', `src="${rel(entry)}"`);
fs.writeFileSync(idx, html);
// sw.js: the offline list without the bundled files, with bundle/ (every chunk, so stories and games that load later
// also play offline)
const swf = path.join(dir, 'sw.js'); let sw = fs.readFileSync(swf, 'utf8');
const m = sw.match(/const FILES = \[([\s\S]*?)\];/); if (!m) throw new Error('sw.js: no FILES list');
const inputs = new Set(Object.keys(res.metafile.inputs).map(rel));
const keep = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]).filter(f => !inputs.has(f));
sw = sw.replace(m[0], `const FILES = ${JSON.stringify([...keep, ...files]).replace(/"/g, "'").replace(/','/g, "', '")};`);
fs.writeFileSync(swf, sw);
const kb = f => fs.statSync(path.join(dir, f)).size / 1024, startKB = [rel(entry), ...[...start].map(rel)].reduce((a, f) => a + kb(f), 0);
console.log(`bundle: ${inputs.size} scripts → ${files.length} files in bundle/ (start ${1 + start.size} files, ${(startKB / 1024).toFixed(2)} MB before gzip); index.html and sw.js updated`);
