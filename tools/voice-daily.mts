// (owner, 12 Oct AEDT: every missing voice line recorded without anyone clicking) the first step of the daily voice
// workflow (.github/workflows/voices-daily.yml). It reads the missing lines inbox from the website (the lines the
// children's devices had to say with the machine voice; /studio/api/inbox with a Studio key) and adds to
// tools/voice-extra.json the ones the game itself has: the same words are in the game's code, the lines heard while
// playing, the family's Studio content (content/custom.json) or the Releases and Festivals saved on the website
// (/api/live). Every other line is held: it may carry a friend's or pet's name, which is never recorded (HANDOFF rule
// 11; owner's choice, 12 Oct). Held lines are counted, never written down here. tools/make-voice-pack.mts then records
// everything missing.
//   STUDIO_KEY=… node tools/voice-daily.mts [--site https://sparklevalley.netlify.app] [--inbox file.json]
// It also writes tools/voice-daily.json (the run's summary, read by Studio's Voices page).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { collectLines } from './voice-lines.mts';

globalThis.document = { documentElement: {} }; // i18n.js expects a browser
globalThis.localStorage = { getItem: () => null, setItem: () => { } };
const { swapNames } = await import('../js/i18n.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SITE = String(arg('site', process.env.SV_SITE || 'https://sparklevalley.netlify.app')).replace(/\/$/, '');
const EXTRA = path.join(ROOT, 'tools/voice-extra.json'), SUMMARY = path.join(ROOT, 'tools/voice-daily.json');
const LANGS = ['en', 'vi'];
const norm = t => String(t || '').replace(/\s+/g, ' ').trim();

// ---------- the inbox ----------
async function readInbox() {
  const file = arg('inbox');
  if (file) return JSON.parse(fs.readFileSync(file, 'utf8')); // (for the checks)
  const key = process.env.STUDIO_KEY;
  if (!key) { console.log('No STUDIO_KEY: the inbox is skipped (the code\'s lines are still recorded).'); return null; }
  const r = await fetch(SITE + '/studio/api/inbox', { headers: { 'x-studio-key': key } });
  if (!r.ok) throw new Error(`The website did not give the inbox (${r.status}): is STUDIO_KEY a key made in Studio → Setup → Security?`);
  const j = await r.json(); return Array.isArray(j) ? j : [];
}

// ---------- everything the game itself says ----------
const known = new Set(), put = (lang, text) => { const t = norm(text); if (t) known.add(lang + '|' + t); };
for (const l of collectLines()) { put('en', swapNames(l.en, 'en')); put('vi', swapNames(l.vi, 'vi')); put('en', l.en); put('vi', l.vi); }
const inCode = new Set(known); // already recorded by tools/make-voice-pack.mts, nothing to add
let extra = []; try { extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8')); } catch (e) { }
for (const l of extra) put(l.lang, l.text);
// the family's content and the website's Releases and Festivals: every [en, vi] pair, and every plain string in both
// languages (a line said there is said in one of them)
const walk = (o, fn) => { if (Array.isArray(o)) { if (o.length === 2 && typeof o[0] === 'string' && typeof o[1] === 'string') fn(o[0], o[1]); o.forEach(x => walk(x, fn)); } else if (o && typeof o === 'object') { if (typeof o.en === 'string' && typeof o.vi === 'string') fn(o.en, o.vi); Object.values(o).forEach(x => walk(x, fn)); } };
const addContent = o => walk(o, (en, vi) => { put('en', en); put('vi', vi); });
try { addContent(JSON.parse(fs.readFileSync(path.join(ROOT, 'content/custom.json'), 'utf8'))); } catch (e) { }
if (!arg('inbox')) { try { const r = await fetch(SITE + '/api/live'); if (r.ok && /json/.test(r.headers.get('content-type') || '')) addContent(await r.json()); } catch (e) { } }
// also each sentence of a known line (the game plays a long line sentence by sentence when only some are recorded)
for (const k of [...known]) { const [lang, t] = [k.slice(0, 2), k.slice(3)]; for (const s of t.match(/[^.!?。…]+[.!?。…]*/g) || []) put(lang, s); }

// ---------- sort the inbox ----------
const inbox = await readInbox();
const have = new Set([...inCode, ...extra.map(l => l.lang + '|' + norm(l.text))]);
let added = 0, held = 0, already = 0;
for (const l of inbox || []) {
  if (!l || !LANGS.includes(l.lang) || !l.text) continue;
  const k = l.lang + '|' + norm(l.text);
  if (!known.has(k)) { held++; continue; }
  if (have.has(k)) { already++; continue; }
  extra.push({ lang: l.lang, text: norm(l.text) }); have.add(k); added++;
}
if (added) fs.writeFileSync(EXTRA, JSON.stringify(extra.sort((a, b) => (a.lang + a.text).localeCompare(b.lang + b.text)), null, 0).replace(/\},\{/g, '},\n{') + '\n');
let prev = {}; try { prev = JSON.parse(fs.readFileSync(SUMMARY, 'utf8')); } catch (e) { }
const summary = { ...prev, at: new Date().toISOString(), inbox: inbox ? inbox.length : null, added, already, held };
fs.writeFileSync(SUMMARY, JSON.stringify(summary, null, 1) + '\n');
console.log(`Inbox: ${inbox ? inbox.length : 'not read'} lines; ${added} added to the voice list, ${already} already there, ${held} held (not in the game's own text: may have a name).`);
