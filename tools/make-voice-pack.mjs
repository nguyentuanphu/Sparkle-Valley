// Makes the offline voice pack with ElevenLabs: every line the game speaks, in English and Tiếng Việt,
// plus the Chinese and Hindi learning words, saved as small MP3 files in voices/. The game plays these
// instead of the device voice, with no internet needed.
//
//   node tools/make-voice-pack.mjs --key sk_...            make (or finish) the pack
//   node tools/make-voice-pack.mjs --key sk_... --dry      only show how many characters it will cost
//   options: --voice-f <id>  --voice-m <id>  --cast (also a man's voice for men and boys)  --model <id>  --limit <n>  --force
//
// It checks the account's remaining characters first and stops if there are not enough (use --force to go
// anyway). Files that already exist are skipped, so you can stop it and run it again later.
// Keep the key secret: it is only used for this run and is never written into the game.
import fs from 'fs';
import path from 'path';
import { collectLines } from './voice-lines.mjs';

globalThis.document = { documentElement: {} };            // i18n.js expects a browser
globalThis.localStorage = { getItem: () => null, setItem: () => { } };
const { swapNames } = await import('../js/i18n.js');
const { LEARN } = await import('../js/words2.js');
const { packHash } = await import('../js/packhash.js');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const flag = k => process.argv.includes('--' + k);
const KEY = arg('key', process.env.ELEVEN_KEY || process.env.ELEVENLABS_API_KEY);
const MODEL = arg('model', 'eleven_turbo_v2_5');
const API = arg('api', 'https://api.elevenlabs.io/v1'); // --api is only for testing with a pretend server
if (!KEY) { console.error('Add your key: --key sk_... (or set ELEVEN_KEY)'); process.exit(1); }
const H = { 'xi-api-key': KEY };
const get = async p => { const r = await fetch(API + p, { headers: H }); if (r.status === 401) { console.error('ElevenLabs did not accept the key (401). Check it on elevenlabs.io → API Keys, and that it may use Text to Speech, Voices and User.'); process.exit(3); } if (!r.ok) throw new Error(p + ' ' + r.status + ' ' + (await r.text()).slice(0, 200)); return r.json(); };

// ---------- what to say ----------
const jobs = [];
for (const l of collectLines()) {
  jobs.push({ lang: 'en', text: swapNames(l.en, 'en') });   // exactly what the game says (js/voice.js speak)
  jobs.push({ lang: 'vi', text: swapNames(l.vi, 'vi') });
}
for (const [lang, L] of Object.entries(LEARN)) for (const w of L.words) jobs.push({ lang, text: w[3] });
const uniq = new Map(); jobs.forEach(j => uniq.set(packHash(j.lang, j.text), j));
const list = [...uniq.entries()];

// ---------- which voices ----------
const PACK_DIR = path.join(ROOT, 'voices'), MAN = path.join(PACK_DIR, 'manifest.json');
const old = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : null;
async function pickVoice(gender) {
  const want = arg('voice-' + gender) || (old && old.voices && old.voices[gender] && old.voices[gender].id);
  const { voices } = await get('/voices');
  if (want) { const v = voices.find(v => v.voice_id === want); return { id: want, name: v ? v.name : want }; }
  const score = v => { const L = v.labels || {}; let s = 0; if ((L.gender || '').toLowerCase() === (gender === 'f' ? 'female' : 'male')) s += 10; else return -1;
    if (/austral/i.test(L.accent || '')) s += 4; if (/young|middle/i.test(L.age || '')) s += 2; if (/warm|friendly|child|narrat|soft|pleasant|upbeat/i.test((L.description || '') + (L.descriptive || '') + (L.use_case || '') + (v.description || ''))) s += 3; return s; };
  const best = voices.map(v => [score(v), v]).filter(x => x[0] >= 0).sort((a, b) => b[0] - a[0])[0];
  if (!best) throw new Error('No ' + (gender === 'f' ? 'female' : 'male') + ' voice found in the account; pass --voice-' + gender + ' <id>');
  return { id: best[1].voice_id, name: best[1].name };
}
const slots = flag('cast') ? ['f', 'm'] : ['f'];

const total = list.reduce((a, [, j]) => a + j.text.length, 0) * slots.length;
const missing = slots.flatMap(s => list.filter(([h, j]) => !fs.existsSync(path.join(PACK_DIR, j.lang, s, h + '.mp3'))).map(x => [s, ...x]));
const need = missing.reduce((a, [, , j]) => a + j.text.length, 0);
console.log(`${list.length} lines × ${slots.length} voice(s): ${total} characters in all; still to make: ${missing.length} files, ${need} characters.`);
const sub = await get('/user/subscription');
const left = sub.character_limit - sub.character_count;
console.log(`Your ElevenLabs plan "${sub.tier}": ${left} of ${sub.character_limit} characters left this month.`);
if (flag('dry')) process.exit(0);
if (need > left && !flag('force')) { console.error(`Not enough characters left (need about ${need}). Upgrade the plan, wait for the monthly reset, or run with --limit to make part of it now.`); process.exit(2); }

const voices = {}; for (const s of slots) voices[s] = await pickVoice(s);
console.log('Voices:', Object.entries(voices).map(([s, v]) => `${s === 'f' ? 'woman' : 'man'}: ${v.name} (${v.id})`).join(', '));

// ---------- make the files ----------
const man = { version: 1, model: MODEL, voices, lines: {}, langOf: {} };
if (old && old.lines) Object.assign(man.lines, old.lines);
for (const [h, j] of list) man.langOf[h] = j.lang;
const save = () => { fs.mkdirSync(PACK_DIR, { recursive: true }); fs.writeFileSync(MAN, JSON.stringify(man)); };
// what exists on disk is the truth
for (const s of ['f', 'm']) for (const [h, j] of list) if (fs.existsSync(path.join(PACK_DIR, j.lang, s, h + '.mp3'))) man.lines[h] = (man.lines[h] || '').replace(s, '') + s;
const limit = +arg('limit', 1e9);
let done = 0, used = 0;
async function make([slot, h, j]) {
  const v = voices[slot];
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await fetch(`${API}/text-to-speech/${v.id}?output_format=mp3_22050_32`, {
      method: 'POST', headers: { ...H, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: j.text, model_id: MODEL, language_code: j.lang, voice_settings: { stability: .5, similarity_boost: .8, style: .2, use_speaker_boost: true } })
    });
    if (r.status === 429 || r.status >= 500) { await new Promise(res => setTimeout(res, 1500 * (attempt + 1))); continue; }
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)} — "${j.text.slice(0, 40)}"`);
    const dir = path.join(PACK_DIR, j.lang, slot); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, h + '.mp3'), Buffer.from(await r.arrayBuffer()));
    man.lines[h] = (man.lines[h] || '').replace(slot, '') + slot; used += j.text.length; done++;
    if (done % 20 === 0) { save(); console.log(`${done}/${Math.min(missing.length, limit)} files, ${used} characters`); }
    return;
  }
  throw new Error('Too many retries: ' + j.text.slice(0, 40));
}
const queue = missing.slice(0, limit);
await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) await make(queue.shift()); }));
save();
console.log(`Finished: ${done} new files (${used} characters). The pack is in voices/ — include that folder when you publish the game.`);
