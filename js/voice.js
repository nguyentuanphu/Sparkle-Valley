// Talking voice in English and Vietnamese using the device's own natural voices.
// Premium/enhanced/neural voices are picked first; grown-ups can choose a voice in settings.
import { settings, saveSettings, profiles } from './state.js';
import { ac, unlockers } from './audio.js';
import { swapNames } from './i18n.js';
import { packHash, lineHash, partText } from './packhash.js';
import { events } from './core/events.js';
import { viRuns, mixed } from './viwords.js';
import { CUSTOM } from './custom.js';

let all = [];
const BAD = /compact|eloquence|novelty|whisper|bad news|bells|boing|bubbles|cellos|zarvox|trinoids|albert|jester|organ|superstar|wobble|grandpa|grandma|rocko|reed|eddy|flo\b|sandy|shelley|fred|junior|ralph|kathy|good news|hysterical|deranged|pipe/i;
function score(v) {
  const n = v.name.toLowerCase(); let s = 0;
  if (/premium/.test(n)) s += 60; if (/enhanced/.test(n)) s += 50; if (/neural|natural|online/.test(n)) s += 55; if (/siri/.test(n)) s += 40;
  if (/google/.test(n)) s += 30; if (/samantha|ava|allison|zoe|serena|karen|jenny|aria|libby|sonia|emma|nicky|linh|an\b|hoaimy|namminh/.test(n)) s += 12;
  if (BAD.test(n)) s -= 80; if (v.localService === false) s += 5; return s;
}
function load() {
  try { all = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (e) { all = []; }
  listeners.forEach(f => f());
}
const listeners = new Set();
export const onVoices = f => listeners.add(f);
if (window.speechSynthesis) { load(); try { speechSynthesis.addEventListener('voiceschanged', load); } catch (e) { } }

export function voicesFor(lang) {
  const re = new RegExp('^' + (lang || 'en'), 'i');   // en, vi, zh (Chinese), hi (Hindi)
  return all.filter(v => re.test(v.lang)).sort((a, b) => score(b) - score(a) || (/en[-_](au|us)/i.test(b.lang) - /en[-_](au|us)/i.test(a.lang)));
}
export function voiceFor(lang) {
  const list = voicesFor(lang), want = lang === 'vi' ? settings.voiceVi : lang === 'en' ? settings.voiceEn : null;
  return (want && list.find(v => v.name === want)) || list[0] || null;
}
export const hasVietnamese = () => voicesFor('vi').length > 0;

// Voice styles change how the device voice sounds: natural, a cute cartoon friend, or a calm grandparent.
export const VOICE_STYLES = [
  { id: 'natural', icon: '🙂', name: () => (settings.lang === 'vi' ? 'Tự nhiên' : 'Natural'), rate: 1, pitch: 1 },
  { id: 'cute', icon: '🐣', name: () => (settings.lang === 'vi' ? 'Dễ thương' : 'Cute'), rate: 1.06, pitch: 1.35 },
  { id: 'grandpa', icon: '👴', name: () => (settings.lang === 'vi' ? 'Ông bà' : 'Grandparent'), rate: .88, pitch: .82 }
];
const style = () => VOICE_STYLES.find(v => v.id === settings.voiceStyle) || VOICE_STYLES[0];

// ---------- a voice for each character ----------
// When a character talks (dialog), their title tells us who they are: grandparents speak a little lower
// and slower, kids higher, aunties and uncles get a woman's or a man's voice. If the device has several
// voices for the language they are shared out by character, so neighbours don't all sound the same.
let speaker = null;
export const setSpeaker = name => { speaker = name ? String(name) : null; };
const FEMALE = /^(Bà|Cô|O|Dì|Chị|Mợ|Thím|Mrs|Ms|Miss|Aunty|Auntie|Grandma|Nana|Nanna|Big Sister|Sister|Lady|Madam)(?=[\s.]|$)/iu, MALE = /^(Ông|Chú|Bác|Anh|Cậu|Dượng|Mr|Uncle|Grandpa|Pop|Big Brother|Brother|Sir)(?=[\s.]|$)/iu;
const OLD = /^(Bà|Ông|Grandma|Grandpa|Nana|Nanna|Pop)(?=[\s.]|$)/iu;
const KIDS_F = /^(?:(?:Bé|Em|Little|Út)\s+)?(Tí|Bống|Mít|Lan|Ruby|Chloe|Bông|Hà|Trà|Na|Mai|Linh|Thảo|Vy|Ngọc|Hoa|Lily|Mia|Ava|Priya|Mei|Ling)(?=[\s.!,]|$)/iu;
// a villager's voice can also be set by name (Sparkle Studio → Villagers): { 'Bé Hà': 'f', 'Tí': 'm' }
let GENDERS = {};
export const setVoiceGenders = g => { GENDERS = g && typeof g === 'object' ? g : {}; };
setVoiceGenders(CUSTOM.genders);
export function speakerKind(name = speaker) {
  if (!name) return null;
  const n = name.trim(), old = OLD.test(n), set = GENDERS[n] || GENDERS[n.replace(/^(Bé|Em|Little|Út)\s+/iu, '')];
  const gender = set === 'f' || set === 'm' ? set : FEMALE.test(n) ? 'f' : MALE.test(n) ? 'm' : KIDS_F.test(n) ? 'f' : 'm';
  const kid = !FEMALE.test(n) && !MALE.test(n) && !/owl|cú|bầu|gourd|cloud|mây|davo|gazza/i.test(n);
  let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { gender, old, kid, seed: h };
}
const FEMALE_VOICE = /female|woman|linh|hoaimy|an\b|mai|lan|samantha|karen|catherine|zoe|ava|allison|serena|jenny|aria|libby|sonia|emma|natasha|nicky|susan|victoria|google .*(vi|tiếng)/i;
const MALE_VOICE = /\bmale\b|namminh|\bnam\b|minh|daniel|lee|james|thomas|aaron|gordon|william|ryan|liam|duc|đức/i;
function speakerVoice(lang, kind) {
  const list = voicesFor(lang); if (!kind || list.length < 2) return null;
  const want = lang === 'vi' ? settings.voiceVi : settings.voiceEn;
  const g = list.filter(v => kind.gender === 'm' ? MALE_VOICE.test(v.name) && !/female/i.test(v.name) : FEMALE_VOICE.test(v.name) && !MALE_VOICE.test(v.name));
  const pool = g.length ? g : list.slice(0, 4);
  // keep the grown-up's chosen voice for the main narrator-like characters, share the rest out
  return pool.find(v => v.name === want && kind.seed % 2 === 0) || pool[kind.seed % pool.length];
}
function utter(text, lang) {
  const u = new SpeechSynthesisUtterance(text);
  const kind = speakerKind();
  const v = speakerVoice(lang, kind) || voiceFor(lang);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = { vi: 'vi-VN', zh: 'zh-CN', hi: 'hi-IN' }[lang] || 'en-AU';
  // A touch slower than normal and at natural pitch sounds the most human; grown-ups can fine-tune both.
  const st = style();
  u.rate = (lang === 'vi' ? .95 : .97) * (settings.voiceRate || 1) * st.rate;
  u.pitch = Math.min(2, (settings.familyVoice && settings.familyPitch && st.id === 'natural' ? settings.familyPitch : (settings.voicePitch || 1)) * st.pitch); u.volume = 1;
  if (kind) {
    if (kind.old) { u.rate *= .9; u.pitch *= .86; }
    else if (kind.kid) { u.rate *= 1.04; u.pitch = Math.min(2, u.pitch * 1.22); }
    else if (kind.gender === 'm') u.pitch *= .92; else u.pitch = Math.min(2, u.pitch * 1.05);
  }
  return u;
}
// Device speech, as a promise that resolves when the line has been spoken.
// Long lines are split at sentence ends: some phones cut long utterances off or rush them.
function deviceSpeak(text, lang, my) {
  if (!window.speechSynthesis) return Promise.resolve();
  const parts = String(text).match(/[^.!?。…]+[.!?。…]*\s*/g) || [text];
  let chunks = []; for (const p of parts) { const last = chunks.length - 1; if (last >= 0 && (chunks[last] + p).length < 160) chunks[last] += p; else chunks.push(p); }
  // (round R, owner: "bánh khọt" and "nước mía" said by the English voice can't be understood) the Vietnamese words of an
  // English line are said by the phone's Vietnamese voice when it has one
  chunks = chunks.map(c => [lang, c]);
  if (lang === 'en' && mixed(text) && voicesFor('vi').length) chunks = chunks.flatMap(([, c]) => viRuns(c)).filter(([, c]) => /[\p{L}\d]/u.test(c));
  return new Promise(res => {
    let left = chunks.length, ended = false;
    const end = () => { if (!ended) { ended = true; res(); } };
    chunks.forEach(([l, c]) => { const u = utter(c.trim(), l); u.onend = u.onerror = () => { if (--left <= 0) end(); }; try { speechSynthesis.speak(u); } catch (e) { end(); } });
    // in case the device never reports the end
    setTimeout(end, 1500 + String(text).length * 95);
    const poll = setInterval(() => { if (my !== seq) { clearInterval(poll); end(); } if (ended) clearInterval(poll); }, 200);
  });
}
let seq = 0;
// say('Hello', 'Xin chào') speaks the current language (and the other one too in bilingual mode).
// listeners that show captions for every spoken line (even when the voice is switched off)
export const spoken = [];
export function say(en, vi) { const t = swapNames(settings.lang === 'vi' ? (vi ?? en) : en, settings.lang); spoken.forEach(f => { try { f(t); } catch (e) { } }); speak(en, vi); }
// The same, but resolves when it has finished speaking (used by the How-to-play films).
export function sayAsync(en, vi) { return speak(en, vi); }
async function speak(en, vi) {
  if (!settings.voice) return;
  en = swapNames(en, 'en'); vi = swapNames(vi, 'vi');
  const my = ++seq;
  if (!PACK && !packTried) { await waitPack(); if (my !== seq) return; }
  try { speechSynthesis.cancel(); } catch (e) { }
  try { if (playing) playing.stop(); } catch (e) { }
  // a family recording of exactly this line wins over any other voice
  if (settings.familyVoice) {
    const ph = FAMILY_PHRASES.find(p => p.en === en || p.vi === vi);
    if (ph && hasClip(settings.lang, ph.id)) { await playClip(settings.lang, ph.id); return; }
  }
  const parts = [settings.lang === 'vi' ? ['vi', vi ?? en] : ['en', en]];
  if (settings.bilingual && vi != null && en !== vi) parts.push(settings.lang === 'vi' ? ['en', en] : ['vi', vi]);
  for (const [lang, text] of parts) {
    if (my !== seq) return;
    if (window.__svVoiceLog) window.__svVoiceLog(lang, text, !!packSlot(lang, text)); // for tools/voice-harvest.mjs
    try { if (await playPack(lang, text, my)) continue; } catch (e) { }
    // (round R item 12) a line with changing words (a number, an item, a name) is put together from its recorded parts
    try { if (await playParts(lang, text, my)) continue; } catch (e) { }
    // Not recorded as a whole: recorded sentences inside it still play from the pack; only the rest uses another voice.
    const bits = sentences(text);
    if (PACK && bits.length > 1 && bits.some(b => packSlot(lang, b) || tplMatch(lang, b))) {
      for (const b of bits) {
        if (my !== seq) return;
        let ok = false; try { ok = await playPack(lang, b, my) || await playParts(lang, b, my); } catch (e) { }
        if (!ok) { noteMiss(lang, b); await otherVoice(b, lang, my); }
      }
      continue;
    }
    noteMiss(lang, text);
    await otherVoice(text, lang, my);
  }
}
// ---------- (round R item 12) lines put together from recorded parts ----------
// The pack lists the templates of lines with changing words (manifest `tpl`, from tools/voice-lines.mjs): the fixed
// pieces are recorded on their own, and so are the numbers 0–100 and the words that fill a gap. A line that matches a
// template plays its pieces and gaps in order. A gap with no recording that is a name (a child's, a friend's, a pet's)
// is left out: names are never recorded and never spoken by another voice (HANDOFF rule 11); any other word with no
// recording is said by the phone's voice and noted as missing.
let TPLS = null;
const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function tplMatch(lang, text) {
  if (!PACK || !PACK.tpl || !PACK.tpl[lang]) return null;
  TPLS = TPLS && TPLS.pack === PACK ? TPLS : { pack: PACK };
  const list = TPLS[lang] || (TPLS[lang] = PACK.tpl[lang].map(ps => ({ ps, w: ps.join('').replace(/[^\p{L}]/gu, '').length, re: new RegExp('^\\s*' + ps.map(p => esc(p).replace(/\s+/g, '\\s*')).join('(.+?)') + '\\s*$', 'u') })).filter(t => t.w > 1).sort((a, b) => b.w - a.w));
  const t = String(text).replace(/\s+/g, ' ').trim();
  for (const x of list) {
    const m = x.re.exec(t); if (!m) continue;
    const parts = [];
    x.ps.forEach((p, i) => { const q = partText(p); if (q) parts.push([0, q]); if (i < m.length - 1) { const f = m[i + 1].replace(/^[\s.,!?:;…'"“”()]+|[\s,:;'"“”()]+$/g, ''); if (/[\p{L}\d]/u.test(f)) parts.push([1, f]); } });
    // only worth it when every fixed piece is recorded
    if (parts.some(([k]) => !k) && parts.every(([k, q]) => k || packSlot(lang, q))) return parts;
  }
  return null;
}
// a gap word that is someone's name: one of this device's children, or one or two capitalised words with no recording
const isName = w => (profiles || []).some(p => p && p.name && (p.name === w || p.name.replace(/^(Bé|Em|Little|Út)\s+/iu, '') === w)) || /^\p{Lu}[\p{L}'’-]*(\s\p{Lu}[\p{L}'’-]*)?$/u.test(w);
async function playParts(lang, text, my) {
  const parts = tplMatch(lang, text); if (!parts) return false;
  for (const [, q] of parts) {
    if (my !== seq) return true;
    let ok = false; try { ok = await playPack(lang, q, my); } catch (e) { }
    if (ok || isName(q)) continue;
    noteMiss(lang, q); await otherVoice(q, lang, my);
  }
  return true;
}
// (for the checks: what a line would be made of)
export const lineParts = (lang, text) => tplMatch(lang, swapNames(text, lang));
const sentences = text => (String(text).match(/[^.!?。…]+[.!?。…]*\s*/g) || [text]).map(t => t.trim()).filter(Boolean);
// (round R privacy, 9 Oct) no recording: the phone's own voice, never an online speech service
async function otherVoice(text, lang, my) { await deviceSpeak(text, lang, my); }
// Lines the game had to say without a recording are noted on this device (most-said first). Grown-ups can send
// the list to Sparkle Studio (it travels inside the backup file), which records them for the next pack.
const MISS_KEY = 'sv2_voicemiss';
let misses = null;
const loadMisses = () => { if (!misses) { try { misses = JSON.parse(localStorage.getItem(MISS_KEY) || '[]'); } catch (e) { misses = []; } } return misses; };
let missTimer = 0;
function noteMiss(lang, text) {
  if (!PACK || !text || /^[\d\s.,!?]+$/.test(text)) return;
  const L = loadMisses(), f = L.find(m => m[0] === lang && m[1] === text);
  if (f) f[2]++; else { L.push([lang, text, 1]); if (L.length > 600) { L.sort((a, b) => b[2] - a[2]); L.length = 500; } }
  clearTimeout(missTimer); missTimer = setTimeout(() => { try { localStorage.setItem(MISS_KEY, JSON.stringify(L)); } catch (e) { } }, 2000);
}
export const voiceMisses = () => loadMisses().slice().sort((a, b) => b[2] - a[2]);
export const clearVoiceMisses = () => { misses = []; try { localStorage.removeItem(MISS_KEY); } catch (e) { } };
// Speak one string in a fixed language (letter names, etc.).
export function sayIn(lang, text) {
  if (!settings.voice) return;
  if (window.__svVoiceLog) window.__svVoiceLog(lang, text, !!packSlot(lang, text));
  const my = ++seq;
  try { speechSynthesis.cancel(); } catch (e) { }
  if (!PACK && !packTried) { waitPack().then(() => { packTried = true; if (my === seq) sayIn(lang, text); }); return; }
  if (packSlot(lang, text)) { playPack(lang, text, my).then(ok => { if (!ok && my === seq) deviceSpeak(text, lang, my); }).catch(() => deviceSpeak(text, lang, my)); return; }
  deviceSpeak(text, lang, my);
}
// the phone's own voice only (Grown-ups → Advanced → Phone voice ▶), so the chosen voice is really heard
export function sayDevice(lang, text) { const my = ++seq; try { speechSynthesis.cancel(); } catch (e) { } try { if (playing) playing.stop(); } catch (e) { } return deviceSpeak(text, lang, my); }
export function hush() { seq++; try { speechSynthesis.cancel(); } catch (e) { } try { if (playing) playing.stop(); } catch (e) { } }

// ---------- Family voice: real recordings of a grown-up ----------
// A grown-up records the game's most-used lines. Those lines are then played in their real voice,
// and everything else is spoken by the device voice with its pitch moved towards theirs.
// (round R privacy, 9 Oct, owner: "never clone children's voices") the recordings stay on this device: no voice is copied.
export const FAMILY_PHRASES = [
  { id: 'hello', en: "Hello! Let's play!", vi: 'Xin chào! Cùng chơi nào!' },
  { id: 'great', en: 'Great job!', vi: 'Giỏi quá!' },
  { id: 'welldone', en: 'Well done!', vi: 'Làm tốt lắm!' },
  { id: 'clever', en: 'Yes! Clever!', vi: 'Đúng rồi! Thông minh quá!' },
  { id: 'super', en: 'Super!', vi: 'Tuyệt vời!' },
  { id: 'gotit', en: 'You got it!', vi: 'Con làm được rồi!' },
  { id: 'tryagain', en: 'Try again!', vi: 'Thử lại nhé!' },
  { id: 'didit', en: 'You did it!', vi: 'Con giỏi lắm, con làm xong rồi!' },
  { id: 'whatnext', en: 'What comes next?', vi: 'Tiếp theo là gì nhỉ?' },
  { id: 'lookdress', en: 'You look wonderful!', vi: 'Con trông tuyệt quá!' },
  { id: 'love', en: 'I love you! Have fun!', vi: 'Bố mẹ thương con! Chơi vui nhé!' }
];
const clips = {}; // `${lang}:${id}` -> { data: ArrayBuffer, type, decoded? }
let dbp = null;
function db() {
  if (!dbp) dbp = new Promise((res, rej) => { try { const r = indexedDB.open('sparkle-valley-voice', 1); r.onupgradeneeded = () => r.result.createObjectStore('clips'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
  return dbp;
}
const tx = async (mode, f) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('clips', mode), st = t.objectStore('clips'); const r = f(st); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); };
export async function loadClips() {
  try {
    const d = await db();
    await new Promise(res => {
      const req = d.transaction('clips').objectStore('clips').openCursor();
      req.onsuccess = async () => {
        const c = req.result; if (!c) return res();
        const v = c.value; // stored as {data, type}; older saves stored a Blob
        if (v && v.data) clips[c.key] = { data: v.data, type: v.type };
        else if (v && v.arrayBuffer) v.arrayBuffer().then(data => { clips[c.key] = { data, type: v.type }; });
        c.continue();
      };
      req.onerror = res;
    });
  } catch (e) { }
}
export const hasClip = (lang, id) => !!clips[lang + ':' + id];
export const clipCount = () => Object.keys(clips).length;
export const clipCountFor = lang => FAMILY_PHRASES.filter(p => clips[lang + ':' + p.id]).length;
// Saved as a plain ArrayBuffer: Safari on older iPhones cannot always store Blobs in IndexedDB.
export async function saveClip(lang, id, blob) {
  const data = await blob.arrayBuffer(), key = lang + ':' + id;
  await tx('readwrite', st => st.put({ data, type: blob.type || 'audio/wav' }, key));
  clips[key] = { data, type: blob.type || 'audio/wav' };
}
export async function deleteClip(lang, id) { await tx('readwrite', st => st.delete(lang + ':' + id)); delete clips[lang + ':' + id]; }
let playing = null;
// Played through Web Audio, which (once unlocked by the first tap) can play at any time, even on iPhone.
// Returns a promise that resolves when the clip has finished (or false if there is no clip).
export function playClip(lang, id) {
  const c = clips[lang + ':' + id]; if (!c) return false;
  if (c.decoded) return playBuffer(c.decoded);
  return decode(c.data).then(buf => { c.decoded = buf; return playBuffer(buf); }).catch(() => { });
}
function decode(data) { const a = ac(); return a ? a.decodeAudioData(data.slice(0)) : Promise.reject(new Error('no audio')); }
// A plain audio player, primed by the first tap (audio.js), for when Web Audio is asleep on iPhone.
const SILENT = (() => { const b = new Uint8Array(46), v = new DataView(b.buffer), w = (o, t) => [...t].forEach((c, i) => { b[o + i] = c.charCodeAt(0); }); // a tiny silent WAV
  w(0, 'RIFF'); v.setUint32(4, 38, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, 2, true);
  return 'data:audio/wav;base64,' + btoa(String.fromCharCode(...b)); })();
let player = null, primed = false;
unlockers.push(() => { if (primed) return; try { player = player || new Audio(); player.src = SILENT; const p = player.play(); if (p) p.then(() => { primed = true; player.pause(); }).catch(() => { }); } catch (e) { } });
function playUrl(url, rate = 1) {
  if (!player) return Promise.resolve(false);
  return new Promise(res => { try { player.pause(); player.src = url; player.preservesPitch = player.webkitPreservesPitch = rate === 1; player.playbackRate = rate; player.onended = () => res(true); player.onerror = () => res(false); player.play().catch(() => res(false)); } catch (e) { res(false); } });
}
// why the recorded voice did or did not play last time (Grown-ups shows it, to help find phone problems)
export const voiceDiag = { pack: 'loading', lastMiss: '', audio: '' };
function playBuffer(buf, rate = 1) {
  const a = ac(); if (!a) return Promise.resolve();
  try { if (playing) playing.stop(); } catch (e) { }
  const s = a.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate; s.connect(a.destination); s.start(); playing = s;
  return new Promise(res => { s.onended = res; setTimeout(res, buf.duration / rate * 1000 + 400); });
}

// ---------- Offline voice pack (voices/, made with tools/make-voice-pack.mjs) ----------
// Every line recorded once with a natural voice. Grandparents play a little slower and deeper, children a
// little higher; men use the man's voice when the pack has one.
let PACK = null;
export const voicePack = () => PACK;
// Lines asked for before the list has arrived (slow phone networks at start-up) wait for it, so they are spoken
// with the recorded voice too instead of the phone's own voice.
let packTried = false;
// (round R, PERF-001) fetched on the first tap or key press, or after 8 s, whichever is first: nothing is spoken before a
// child taps, so the title screen comes up without it
let packReady = null;
const loadPack = () => packReady || (packReady = fetch('voices/manifest.json').then(r => r.ok ? r.json() : null).then(j => { if (j && j.lines) { PACK = j; voiceDiag.pack = 'ok'; autoSavePack(); } else { voiceDiag.pack = 'missing'; packEmit({ state: 'nopack' }); } }).catch(() => { voiceDiag.pack = 'offline'; packEmit({ state: 'nopack' }); }).finally(() => { packTried = true; }));
for (const ev of ['pointerdown', 'keydown', 'touchstart']) addEventListener(ev, loadPack, { once: true, capture: true, passive: true });
setTimeout(loadPack, 8000);
const waitPack = () => PACK || packTried ? null : Promise.race([loadPack(), new Promise(r => setTimeout(r, 12000))]);
// Keep the pack on the device by itself: a few seconds after the game opens (every time it opens), the voice cache is
// checked against the list, and any file not there yet (first visit, a new pack, or a phone that cleared space) is
// downloaded quietly. A small bar shows it (js/packbar.js); every line then plays with the recorded voice, offline too.
// (round R item 12, owner 10 Oct: "wifi should automatically, ask user to allow download over mobile") only the
// languages this family's children hear are downloaded; a small core (the start, home, Làng Sen, the menus, the Simple
// screen, the commonest game lines) comes first on any connection, then on Wi-Fi the rest area by area (voices/areas.json,
// made by tools/make-voice-pack.mjs): the place the child is in, the places they have been, games, stories, festivals,
// the other places. On mobile data a grown-up is asked first (press and hold); the answer is kept, and Grown-ups can
// change it. A line not downloaded yet still plays its recording from the internet (and is kept).
const packListeners = []; let packLast = null;
export const onPackProgress = f => { packListeners.push(f); if (packLast) try { f(packLast); } catch (x) { } }; // (a late listener hears where it is now)
const packEmit = e => { packLast = e; packListeners.forEach(f => { try { f(e); } catch (x) { } }); };
function autoSavePack() {
  // (an address that can't keep files, like http://192.168.… on a phone: the voices still play, from the internet)
  if (!('caches' in window)) { setTimeout(() => packEmit({ state: 'nostore', total: packFiles().length }), 3000); return; }
  if (settings.autoPack === false) return;
  setTimeout(() => { checkPack().catch(() => { }); }, 6000);
  let againT = 0; const again = () => { clearTimeout(againT); againT = setTimeout(() => checkPack().catch(() => { }), 1500); };
  addEventListener('online', again);
  try { const c = navigator.connection; if (c && c.addEventListener) c.addEventListener('change', again); } catch (e) { } // (onto Wi-Fi: the rest goes on)
  events.on('LanguageChanged', again); // (a new language, or both spoken: its core, then its areas)
  events.on('SettingsChanged', again);
}
// the languages this device's children hear: the game's language, and the other one too when both are spoken
export const packLangs = () => { const L = [settings.lang === 'vi' ? 'vi' : 'en']; if (settings.bilingual) L.push(L[0] === 'vi' ? 'en' : 'vi'); return L; };
// 'wifi', 'mobile' or 'off'. iPhones, iPads and most computers can't tell: a computer counts as Wi-Fi (or a cable), a
// phone or tablet as mobile data, so a grown-up is asked once (owner, 10 Oct)
export function packNet() {
  if (navigator.onLine === false) return 'off';
  const c = navigator.connection, t = c && c.type;
  if (c && c.saveData) return 'mobile';
  if (t === 'wifi' || t === 'ethernet') return 'wifi';
  if (t === 'cellular' || t === 'wimax' || t === 'bluetooth') return 'mobile';
  let touch = false; try { touch = matchMedia('(pointer: coarse)').matches; } catch (e) { }
  return touch ? 'mobile' : 'wifi';
}
// may the rest (beyond the core) download now? On Wi-Fi yes; on mobile data only once a grown-up said yes
const mayFetchRest = () => packNet() === 'wifi' || settings.packCell === true;
// a grown-up's answer to "download the rest on mobile data?": yes (kept), or not now (asked again in a week)
export function allowMobilePack(yes) {
  if (yes) { settings.packCell = true; delete settings.packAskAt; } else { settings.packCell = false; settings.packAskAt = Date.now(); }
  saveSettings(); if (yes) checkPack().catch(() => { });
}
const askDue = () => settings.packCell !== true && (settings.packCell !== false || Date.now() - (settings.packAskAt || 0) > 7 * 864e5);
// the area the child is in (a place id, from the event bus: never a position) and the places the children have been
let hereArea = null;
events.on('PlayerEnteredVillage', e => { const a = String(e && e.villageId || '').split(':')[1]; if (a) hereArea = a; });
let AREAS = null, areasTried = null;
const loadAreas = () => areasTried || (areasTried = fetch('voices/areas.json').then(r => r.ok ? r.json() : null).then(j => { AREAS = j && j.groups ? j : null; }).catch(() => { }).finally(() => { if (!AREAS) areasTried = null; })); // (tried again next time if it failed)
let groupOfHash = null;
// which area each line downloads with; a line not listed (added later in Studio) goes with 'world'. With no areas list
// (an older pack) everything is the core, as before.
function groupOf(h) {
  if (!AREAS) return 'core';
  if (!groupOfHash) { groupOfHash = new Map(); for (const [g, hs] of Object.entries(AREAS.groups)) for (const x of String(hs).split(' ')) if (x) groupOfHash.set(x, g); }
  return groupOfHash.get(h) || 'world';
}
const NOT_PLACES = ['core', 'games', 'stories', 'festivals', 'world'];
// the order the areas download in: the core, where the child is, where the children have been, the games, stories and
// festivals, the other places, and last the lines that belong nowhere in particular
export function packOrder() {
  const all = AREAS ? Object.keys(AREAS.groups) : ['core'], out = [], add = g => { if (all.includes(g) && !out.includes(g)) out.push(g); };
  add('core'); if (hereArea) add(hereArea);
  const seen = {}; for (const p of profiles || []) for (const k of Object.keys((p && p.visited) || {})) seen[k] = (seen[k] || 0) + 1;
  Object.keys(seen).sort((a, b) => seen[b] - seen[a]).forEach(add);
  ['games', 'stories', 'festivals'].forEach(add);
  all.filter(g => !NOT_PLACES.includes(g)).forEach(add); add('world'); all.forEach(add);
  return out;
}
let checking = false;
async function checkPack() {
  if (checking || !PACK) return; checking = true;
  try {
    const cache = await caches.open('sv-voices');
    // (round O, owner: "does it load the voice pack every time? it should be once, unless there are new voices") once
    // the whole pack is on the device, a start only looks at 16 files picked at random, says nothing and downloads
    // nothing; the full check (listing every file) runs only for a new pack, or when a file has gone missing
    const quick = async list => { const pick = list.length <= 64 ? list : Array.from({ length: 16 }, () => list[Math.floor(Math.random() * list.length)]); return (await Promise.all(pick.map(u => cache.match(u).then(Boolean)))).every(Boolean); };
    if (packIsSaved() && await quick(packFiles())) { packEmit({ state: 'ready', quiet: true, known: true, total: packFiles().length }); return; }
    await loadAreas();
    // a pack made by area whose list could not be fetched (a bad connection): nothing is downloaded until it can be,
    // so a phone on mobile data never takes the whole pack by mistake
    if (PACK.areas && !AREAS) return;
    const order = packOrder(), core = packFiles(['core']);
    // only the core is wanted for now (mobile data, no yes yet) and it is all here: nothing to show, maybe a question
    if (!mayFetchRest() && settings.packCore === packSig() + '|' + packLangs().join('') && await quick(core)) { packEmit({ state: 'ready', quiet: true, known: true, core: true, total: core.length }); askRest().catch(() => { }); return; }
    const have = new Set((await cache.keys()).map(r => r.url)), abs = u => new URL(u, location.href).href;
    const missingOf = gs => packFiles(gs).filter(u => !have.has(abs(u)));
    const want = mayFetchRest() ? order : ['core'];
    let total = missingOf(want).length, done = 0;
    if (!total) { donePack(want); packEmit({ state: 'ready', quiet: true, total: packFiles(want).length, core: want.length === 1 }); if (want.length === 1) askRest().catch(() => { }); return; }
    if (navigator.onLine === false) { packEmit({ state: 'waiting', left: total }); return; }
    packEmit({ state: 'loading', done, total });
    // one area at a time, the next chosen again after each (the child may have walked somewhere new meanwhile)
    const left = new Set(want);
    while (left.size) {
      const g = packOrder().find(x => left.has(x)) || [...left][0]; left.delete(g);
      if (g !== 'core' && !mayFetchRest()) break; // (left the Wi-Fi: the rest waits)
      const miss = missingOf([g]);
      for (let i = 0; i < miss.length; i += 6) {
        await Promise.all(miss.slice(i, i + 6).map(async u => { try { const r = await fetch(u); if (r.ok) { await cache.put(u, r); have.add(abs(u)); done++; } } catch (e) { } }));
        packEmit({ state: 'loading', done, total, area: g });
        if (navigator.onLine === false) { packEmit({ state: 'waiting', left: total - done }); return; } // goes on when the internet is back
      }
      if (g === 'core' && !missingOf(['core']).length) settings.packCore = packSig() + '|' + packLangs().join('');
    }
    if (!missingOf(want).length) { donePack(want); packEmit({ state: 'ready', core: want.length === 1 }); if (want.length === 1) askRest().catch(() => { }); }
    else if (!mayFetchRest() && !missingOf(['core']).length) { saveSettings(); packEmit({ state: 'ready', core: true }); askRest().catch(() => { }); }
    else packEmit({ state: 'waiting', left: missingOf(want).length });
  } finally { checking = false; }
}
function donePack(want) {
  if (want.length === 1) settings.packCore = packSig() + '|' + packLangs().join('');
  else { settings.packSaved = packSig(); settings.packLangs = packLangs().join(''); settings.packCore = packSig() + '|' + packLangs().join(''); }
  saveSettings();
}
// the whole pack is here for these languages (a device that saved it before round R item 12 kept every language)
const packIsSaved = () => settings.packSaved === packSig() && (!settings.packLangs || packLangs().every(L => settings.packLangs.includes(L)));
// on mobile data with the core done: ask a grown-up about the rest (js/packbar.js shows the question)
async function askRest() {
  if (mayFetchRest() || !askDue() || packNet() === 'off') return;
  const rest = packOrder().filter(g => g !== 'core'); if (!rest.length) return;
  // how much is still to come (a device that kept an older pack has most of it already)
  const all = packFiles(rest); if (!all.length) return;
  const have = new Set((await (await caches.open('sv-voices')).keys()).map(r => r.url)), miss = all.filter(u => !have.has(new URL(u, location.href).href)).length;
  if (!miss) return;
  let bytes = 0; for (const g of rest) for (const L of packLangs().concat(['zh', 'hi'])) bytes += (AREAS && AREAS.size && AREAS.size[g] && AREAS.size[g][L]) || 0;
  packEmit({ state: 'ask', mb: Math.max(1, Math.round(bytes * miss / all.length / 1048576)) });
}
const packSig = () => Object.keys(PACK.lines).length + ':' + (PACK.version || 1) + ':' + (PACK.made || '');
// the files of the pack in these areas (all areas when none are named), in the children's own languages (Chinese and
// Hindi only come with the places and games that speak them)
function packFiles(groups) {
  const urls = [], langs = ['en', 'vi', 'zh', 'hi'], mine = packLangs(), want = groups && new Set(groups);
  // (round R) which language each line is in: `other` lists the lines that are not English, space-separated per
  // language (half the size of the old `langOf`, which named every line's language; older packs still have that)
  const other = new Map(); for (const [L, hs] of Object.entries(PACK.other || {})) for (const h of String(hs).split(' ')) if (h) other.set(h, L);
  const langOf = h => (PACK.langOf && PACK.langOf[h]) || other.get(h) || (PACK.other ? 'en' : null);
  for (const [h, slots] of Object.entries(PACK.lines)) {
    if (want && !want.has(groupOf(h))) continue;
    const L1 = langOf(h);
    for (const s of slots) for (const L of L1 ? [L1] : langs) if (!(L === 'en' || L === 'vi') || mine.includes(L)) urls.push(`voices/${L}/${s}/${h}.mp3`);
  }
  const first = 'voices/' + mine[0] + '/'; urls.sort((a, b) => b.startsWith(first) - a.startsWith(first));
  return urls;
}
// an English line with Vietnamese words has its own recording with both voices (js/packhash.js lineHash); an older pack
// without it still plays its all-English recording
const packKey = (lang, text) => { if (!PACK) return null; const h = lineHash(lang, text); if (PACK.lines[h]) return h; const o = packHash(lang, text); return PACK.lines[o] ? o : null; };
const packSlot = (lang, text) => { const has = PACK && PACK.lines[packKey(lang, text)]; if (!has) return null; const k = speakerKind(); return k && k.gender === 'm' && has.includes('m') ? 'm' : has.includes('f') ? 'f' : has[0]; };
// (round P, owner: "the 3 voice styles sound the same") the recordings play for almost every line, so the style changes
// them too: Cute a little higher and quicker, Grandparent lower and slower (playing faster or slower moves the pitch)
const STYLE_RATE = { natural: 1, cute: 1.13, grandpa: .88 };
const packRate = slot => { const k = speakerKind(), st = STYLE_RATE[settings.voiceStyle] || 1; if (!k) return st; let r = k.old ? .9 : k.kid ? 1.1 : 1; if (k.gender === 'm' && slot === 'f') r *= .86; return r * st; };
// Download every file of the pack so it plays with no internet (Grown-ups → "Save voices for offline")
export async function savePackOffline(progress) {
  if (!PACK) return 0; const urls = packFiles();
  let n = 0; const cache = await caches.open('sv-voices');
  for (let i = 0; i < urls.length; i += 6) {
    await Promise.all(urls.slice(i, i + 6).map(async u => { if (await cache.match(u)) { n++; return; } try { const r = await fetch(u); if (r.ok) { await cache.put(u, r); n++; } } catch (e) { } }));
    progress && progress(Math.min(urls.length, i + 6), urls.length);
  }
  return n;
}
export const packUrl = (lang, text, slot) => `voices/${lang}/${slot}/${packKey(lang, text) || lineHash(lang, text)}.mp3`;
async function playPack(lang, text, my) {
  const slot = packSlot(lang, text); if (!slot) return false;
  const k = 'pack|' + slot + '|' + lang + '|' + text;
  const url = packUrl(lang, text, slot), a = ac();
  // Web Audio asleep (iPhone before a tap took, or after a call): the plain player plays the same recording
  if (!a || a.state !== 'running') { voiceDiag.audio = a ? a.state : 'none'; if (await playUrl(url, packRate(slot))) return true; voiceDiag.lastMiss = 'audio ' + voiceDiag.audio; return false; }
  let buf = mem.get(k);
  if (!buf) {
    const r = await fetch(url); if (!r.ok) { voiceDiag.lastMiss = 'file ' + r.status; return false; }
    const data = await r.arrayBuffer();
    try { buf = await decode(data); } catch (e) { voiceDiag.lastMiss = 'decode'; return playUrl(url, packRate(slot)); }
    mem.set(k, buf); if (mem.size > 120) mem.delete(mem.keys().next().value);
  }
  if (my !== seq) return true;
  voiceDiag.audio = 'running'; await playBuffer(buf, packRate(slot)); return true;
}

// ---------- Recorded lines kept in memory ----------
// (round R privacy, 9 Oct, owner: "no voice keys on children's devices") voices are made in Studio only. The device
// never calls a speech service: a line with no recording uses the phone's own voice and is noted as missing for Studio.
const mem = new Map(); // pack file -> decoded AudioBuffer (most recent ~120 lines)
// (round R privacy, 9 Oct) the old natural-voice cache from a grown-up's own key is not needed any more (a no-op once gone)
try { if (window.indexedDB) indexedDB.deleteDatabase('sparkle-valley-tts'); } catch (e) { }

// Estimate how high or low a recorded voice is (average pitch in Hz) using autocorrelation.
export async function estimatePitch(blob) {
  try {
    const AC = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await AC.decodeAudioData(await blob.arrayBuffer()); const d = buf.getChannelData(0), sr = buf.sampleRate, N = 2048, found = [];
    for (let s = 0; s + N < d.length; s += N) {
      let rms = 0; for (let i = 0; i < N; i++) rms += d[s + i] * d[s + i]; if (Math.sqrt(rms / N) < .02) continue;
      // find the strongest repeat after the correlation first dips below zero (skips the trivial short lags)
      let best = 0, bestLag = 0, dipped = false;
      for (let lag = Math.floor(sr / 500); lag < Math.floor(sr / 70); lag++) {
        let c = 0; for (let i = 0; i < N - lag; i++) c += d[s + i] * d[s + i + lag];
        if (!dipped) { if (c < 0) dipped = true; continue; }
        if (c > best) { best = c; bestLag = lag; }
      }
      if (bestLag) found.push(sr / bestLag);
    }
    AC.close && AC.close();
    if (!found.length) return null;
    found.sort((a, b) => a - b); return found[Math.floor(found.length / 2)];
  } catch (e) { return null; }
}
// Device voices sit around 200 Hz; move the speaking pitch towards the recorded voice.
export function pitchFromHz(hz) { return hz ? Math.max(.55, Math.min(1.5, Math.pow(hz / 200, .8))) : 1.08; }
