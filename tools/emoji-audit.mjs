// Which emoji in the game still have no drawing in js/art.js? (HANDOFF rule 13: no phone emoji in the look of the game.)
//   node tools/emoji-audit.mjs            the undrawn emoji, with how often and where they are used
//   node tools/emoji-audit.mjs --all      every emoji found, drawn or not
//   node tools/emoji-audit.mjs --keys     only the undrawn emoji, space-separated (handy for a test page)
// Scans js/**/*.js, index.html and content/*.json, leaving out comments. art.js is imported as it is (no DOM at module level).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { hasArt } = await import(pathToFileURL(join(ROOT, 'js/art.js')).href);
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = [...walk(join(ROOT, 'js')).filter(f => f.endsWith('.js')), join(ROOT, 'index.html'),
  ...readdirSync(join(ROOT, 'content')).filter(f => f.endsWith('.json')).map(f => join(ROOT, 'content', f))];

// one emoji: a pictograph with its selector, skin tone and zero-width-joined parts; a flag; or a keycap
const EMO = /\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])*(?:‍\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])*)*|[\u{1F1E6}-\u{1F1FF}]{2}|[0-9#*]️?⃣/gu;
// text symbols that are pictographs to Unicode but drawn by the font as plain marks (arrows on buttons, ©, ™…)
const TEXTISH = new Set(['▶', '◀', '©', '®', '™', '↩', '↪', '↔', '↕', '⏮', '⏭', '⏸', '⏯', '⏹', '⏺', '‼', '⁉', '〰', '✔', '✖', '➡', '⬅', '⬆', '⬇', '↗', '↘', '↙', '↖', '▪', '▫', '◻', '◼', '☐', '☑', '✓']);
// blank out comments (keeping line numbers), but not "//" inside strings such as URLs
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
  .split('\n').map(l => { let q = null; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '\\') i++; else if (c === q) q = null; } else if (c === '"' || c === "'" || c === '`') q = c; else if (c === '/' && l[i + 1] === '/' && !/[:\\]$/.test(l.slice(0, i))) return l.slice(0, i); } return l; }).join('\n');

const uses = new Map();
for (const f of files) {
  let src = readFileSync(f, 'utf8'); if (f.endsWith('.js')) src = stripComments(src); else if (f.endsWith('.html')) src = src.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
  src.split('\n').forEach((line, n) => { for (const m of line.matchAll(EMO)) { const e = m[0]; if (!uses.has(e)) uses.set(e, []); uses.get(e).push(`${relative(ROOT, f)}:${n + 1}`); } });
}
const flag = e => /^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(e), bare = e => e.replace(/️/g, '');
const rows = [...uses].map(([e, at]) => ({ e, at, drawn: hasArt(e), skip: TEXTISH.has(e) ? 'text symbol' : flag(e) && !hasArt(e) ? 'flag' : '' }));
const all = process.argv.includes('--all'), todo = rows.filter(r => !r.drawn && !r.skip).sort((a, b) => b.at.length - a.at.length);
if (process.argv.includes('--keys')) { console.log(todo.map(r => r.e).join(' ')); process.exit(0); }
for (const r of (all ? rows : todo)) { const files = [...new Set(r.at.map(a => a.split(':')[0]))]; console.log(`${r.e}\t${r.at.length}×\t${r.drawn ? 'drawn' : r.skip || 'NOT DRAWN'}\t${r.at.slice(0, 4).join(' ')}${r.at.length > 4 ? ` … (${files.length} files)` : ''}`); }
const skipped = rows.filter(r => !r.drawn && r.skip);
console.log(`\n${rows.length} different emoji in the game, ${rows.filter(r => r.drawn).length} drawn, ${todo.length} not drawn (${todo.reduce((s, r) => s + r.at.length, 0)} uses)` + (skipped.length ? `; left as they are: ${skipped.map(r => r.e).join(' ')} (flags drawn by icons.js, and text symbols)` : ''));
process.exitCode = todo.length ? 1 : 0;
