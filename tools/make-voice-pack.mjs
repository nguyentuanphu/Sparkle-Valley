// Makes the offline voice pack with ElevenLabs: every line the game speaks, saved as small MP3 files in
// voices/. The game plays these instead of the device voice, with no internet needed, and keeps the whole
// pack on the device after the first visit (so nothing has to be downloaded again).
//
// The cast (one voice per language and slot):
//   English     – a woman (f) and a man (m)      every English line is made twice
//   Tiếng Việt  – a woman (f) and a man (m)      every Vietnamese line is made twice
//   中文 Chinese – a man (m)                      the Chinese learning words and sayings
//   हिन्दी Hindi  – a man (m)                      the Hindi learning words and sayings
// Men, boys and grandpas in the game use the man's voice, everyone else the woman's.
//
//   node tools/make-voice-pack.mjs --count                  how many characters the whole pack needs (no key)
//   node tools/make-voice-pack.mjs --key sk_... --dry       the same, plus what your plan has left
//   node tools/make-voice-pack.mjs --key sk_...             make (or finish) the pack
//   choose voices: --voice-en-f <id> --voice-en-m <id> --voice-vi-f <id> --voice-vi-m <id> --voice-zh-m <id> --voice-hi-m <id>
//   other options: --model <id> (default eleven_flash_v2_5)  --limit <n> (make only n files now)  --force
//
// It checks the account's remaining credits first and stops if there are not enough (use --force to go
// anyway). Files that already exist are skipped, so you can stop it and run it again later, or next month.
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
const MODEL = arg('model', 'eleven_flash_v2_5');
const API = arg('api', 'https://api.elevenlabs.io/v1'); // --api is only for testing with a pretend server
// credits per character: Flash and Turbo models cost half a credit, Multilingual v2 and v3 a whole one
const RATE = /flash|turbo/i.test(MODEL) ? .5 : 1;

// which voices each language gets
const CAST = { en: ['f', 'm'], vi: ['f', 'm'], zh: ['m'], hi: ['m'] };
const LANG_NAME = { en: 'English', vi: 'Vietnamese', zh: 'Chinese', hi: 'Hindi' };

// ---------- what to say ----------
const jobs = [];
for (const l of collectLines()) {
  jobs.push({ lang: 'en', text: swapNames(l.en, 'en') });   // exactly what the game says (js/voice.js speak)
  jobs.push({ lang: 'vi', text: swapNames(l.vi, 'vi') });
}
for (const [lang, L] of Object.entries(LEARN)) for (const w of L.words) jobs.push({ lang, text: w[3] });
// Chinese and Hindi sayings taught at the kiosks (js/cities.js: [words, meaning en, meaning vi, 'zh' | 'hi'])
{
  const src = fs.readFileSync(path.join(ROOT, 'js/cities.js'), 'utf8'), re = /\['([^'\\]+)', '(?:[^'\\]|\\.)*', '(?:[^'\\]|\\.)*', '(zh|hi)'\]/g; let m;
  while ((m = re.exec(src))) jobs.push({ lang: m[2], text: m[1] });
}
const uniq = new Map(); jobs.forEach(j => uniq.set(packHash(j.lang, j.text), j));
const list = [...uniq.entries()];

// ---------- the cost ----------
const PACK_DIR = path.join(ROOT, 'voices'), MAN = path.join(PACK_DIR, 'manifest.json');
const files = list.flatMap(([h, j]) => CAST[j.lang].map(s => [s, h, j]));
const chars = files.reduce((a, [, , j]) => a + j.text.length, 0);
const missing = files.filter(([s, h, j]) => !fs.existsSync(path.join(PACK_DIR, j.lang, s, h + '.mp3')));
const need = missing.reduce((a, [, , j]) => a + j.text.length, 0);
console.log('The voice pack, by language:');
for (const L of Object.keys(CAST)) {
  const ls = list.filter(([, j]) => j.lang === L), c = ls.reduce((a, [, j]) => a + j.text.length, 0);
  console.log(`  ${LANG_NAME[L].padEnd(10)} ${String(ls.length).padStart(5)} lines × ${CAST[L].length} voice${CAST[L].length > 1 ? 's' : ' '} (${CAST[L].map(s => s === 'f' ? 'woman' : 'man').join(' + ')}) = ${String(c * CAST[L].length).padStart(7)} characters`);
}
console.log(`  In all: ${files.length} files, ${chars} characters = about ${Math.ceil(chars * RATE)} ElevenLabs credits with ${MODEL}${RATE < 1 ? ` (${chars} with a Multilingual model)` : ''}.`);
console.log(`  Still to make: ${missing.length} files, ${need} characters (about ${Math.ceil(need * RATE)} credits).`);
console.log(`  Size: about ${Math.round(chars * 0.075 * 4 / 1024)} MB of MP3 (32 kbps).`);
if (flag('count')) process.exit(0);
if (!KEY) { console.error('Add your key: --key sk_... (or set ELEVEN_KEY). Use --count to see the cost without a key.'); process.exit(1); }
const H = { 'xi-api-key': KEY };
const get = async p => { const r = await fetch(API + p, { headers: H }); if (r.status === 401) { console.error('ElevenLabs did not accept the key (401). Check it on elevenlabs.io → API Keys, and that it may use Text to Speech, Voices and User.'); process.exit(3); } if (!r.ok) throw new Error(p + ' ' + r.status + ' ' + (await r.text()).slice(0, 200)); return r.json(); };
const sub = await get('/user/subscription');
const left = sub.character_limit - sub.character_count;
console.log(`Your ElevenLabs plan "${sub.tier}": ${left} of ${sub.character_limit} credits left this month.`);
if (flag('dry')) process.exit(0);
if (need * RATE > left && !flag('force')) { console.error(`Not enough credits left (need about ${Math.ceil(need * RATE)}). Upgrade the plan, wait for the monthly reset, or run with --limit to make part of it now.`); process.exit(2); }

// ---------- which voices ----------
const old = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : null;
let library = null;
async function pickVoice(lang, gender) {
  const want = arg(`voice-${lang}-${gender}`) || (old && old.voices && old.voices[lang] && old.voices[lang][gender] && old.voices[lang][gender].id);
  library = library || (await get('/voices')).voices;
  if (want) { const v = library.find(v => v.voice_id === want); return { id: want, name: v ? v.name : want }; }
  const score = v => {
    const L = v.labels || {}; let s = 0;
    if ((L.gender || '').toLowerCase() !== (gender === 'f' ? 'female' : 'male')) return -1;
    const langs = (v.verified_languages || []).map(x => x.language);
    if (langs.includes(lang) || (L.language || '').toLowerCase().startsWith(lang)) s += 20;
    if (lang === 'en' && /austral/i.test(L.accent || '')) s += 4;
    if (/vietnam/i.test(L.accent || '') && lang === 'vi') s += 8; if (/chinese|mandarin/i.test(L.accent || '') && lang === 'zh') s += 8; if (/hindi|indian/i.test(L.accent || '') && lang === 'hi') s += 8;
    if (/young|middle/i.test(L.age || '')) s += 2;
    if (/warm|friendly|child|narrat|soft|pleasant|upbeat|story/i.test((L.description || '') + (L.descriptive || '') + (L.use_case || '') + (v.description || ''))) s += 3;
    return s;
  };
  const best = library.map(v => [score(v), v]).filter(x => x[0] >= 0).sort((a, b) => b[0] - a[0])[0];
  if (!best) throw new Error(`No ${gender === 'f' ? 'female' : 'male'} voice found for ${LANG_NAME[lang]}; pass --voice-${lang}-${gender} <id>`);
  if (best[0] < 20 && lang !== 'en') console.warn(`  (no voice in your library is marked as ${LANG_NAME[lang]}; using ${best[1].name}. For a native speaker, add one from the ElevenLabs Voice Library and pass --voice-${lang}-${gender} <id>.)`);
  return { id: best[1].voice_id, name: best[1].name };
}
const voices = {};
for (const [L, slots] of Object.entries(CAST)) { voices[L] = {}; for (const s of slots) voices[L][s] = await pickVoice(L, s); }
console.log('Voices:'); for (const [L, v] of Object.entries(voices)) console.log(`  ${LANG_NAME[L]}: ` + Object.entries(v).map(([s, x]) => `${s === 'f' ? 'woman' : 'man'} ${x.name} (${x.id})`).join(', '));

// ---------- make the files ----------
const man = { version: 2, model: MODEL, made: new Date().toISOString().slice(0, 10), cast: CAST, voices, lines: {}, langOf: {} };
const save = () => { fs.mkdirSync(PACK_DIR, { recursive: true }); fs.writeFileSync(MAN, JSON.stringify(man)); };
for (const [h, j] of list) man.langOf[h] = j.lang;
// what exists on disk is the truth
for (const [h, j] of list) for (const s of CAST[j.lang]) if (fs.existsSync(path.join(PACK_DIR, j.lang, s, h + '.mp3'))) man.lines[h] = (man.lines[h] || '') + s;
const limit = +arg('limit', 1e9);
let done = 0, used = 0;
async function make([slot, h, j]) {
  const v = voices[j.lang][slot];
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
console.log(`Finished: ${done} new files (${used} characters). The pack is in voices/ — include that folder when you publish the game (./build-netlify.sh does).`);
