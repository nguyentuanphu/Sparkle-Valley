// Talking voice in English and Vietnamese using the device's own natural voices.
// Premium/enhanced/neural voices are picked first; grown-ups can choose a voice in settings.
import { settings } from './state.js';
import { ac } from './audio.js';

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
  const re = lang === 'vi' ? /^vi/i : /^en/i;
  return all.filter(v => re.test(v.lang)).sort((a, b) => score(b) - score(a) || (/en[-_](au|us)/i.test(b.lang) - /en[-_](au|us)/i.test(a.lang)));
}
export function voiceFor(lang) {
  const list = voicesFor(lang), want = lang === 'vi' ? settings.voiceVi : settings.voiceEn;
  return (want && list.find(v => v.name === want)) || list[0] || null;
}
export const hasVietnamese = () => voicesFor('vi').length > 0;

function utter(text, lang) {
  const u = new SpeechSynthesisUtterance(text);
  const v = voiceFor(lang);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = lang === 'vi' ? 'vi-VN' : 'en-AU';
  // A touch slower than normal and at natural pitch sounds the most human; grown-ups can fine-tune both.
  u.rate = (lang === 'vi' ? .95 : .97) * (settings.voiceRate || 1);
  u.pitch = settings.familyVoice && settings.familyPitch ? settings.familyPitch : (settings.voicePitch || 1); u.volume = 1;
  return u;
}
// Device speech, as a promise that resolves when the line has been spoken.
// Long lines are split at sentence ends: some phones cut long utterances off or rush them.
function deviceSpeak(text, lang, my) {
  if (!window.speechSynthesis) return Promise.resolve();
  const parts = String(text).match(/[^.!?。…]+[.!?。…]*\s*/g) || [text];
  const chunks = []; for (const p of parts) { const last = chunks.length - 1; if (last >= 0 && (chunks[last] + p).length < 160) chunks[last] += p; else chunks.push(p); }
  return new Promise(res => {
    let left = chunks.length, ended = false;
    const end = () => { if (!ended) { ended = true; res(); } };
    chunks.forEach(c => { const u = utter(c.trim(), lang); u.onend = u.onerror = () => { if (--left <= 0) end(); }; try { speechSynthesis.speak(u); } catch (e) { end(); } });
    // in case the device never reports the end
    setTimeout(end, 1500 + String(text).length * 95);
    const poll = setInterval(() => { if (my !== seq) { clearInterval(poll); end(); } if (ended) clearInterval(poll); }, 200);
  });
}
let seq = 0;
// say('Hello', 'Xin chào') speaks the current language (and the other one too in bilingual mode).
export function say(en, vi) { speak(en, vi); }
// The same, but resolves when it has finished speaking (used by the How-to-play films).
export function sayAsync(en, vi) { return speak(en, vi); }
async function speak(en, vi) {
  if (!settings.voice) return;
  const my = ++seq;
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
    if (cloudReady()) {
      try { const buf = await cloudVoice(text, lang); if (my !== seq) return; await playBuffer(buf); continue; }
      catch (e) { console.warn('Natural voice failed, using the device voice', e); }
    }
    await deviceSpeak(text, lang, my);
  }
}
// Speak one string in a fixed language (letter names, etc.).
export function sayIn(lang, text) {
  if (!settings.voice) return;
  const my = ++seq;
  try { speechSynthesis.cancel(); } catch (e) { }
  if (cloudReady() && cloudCached(text, lang)) { cloudVoice(text, lang).then(b => my === seq && playBuffer(b)).catch(() => deviceSpeak(text, lang, my)); return; }
  deviceSpeak(text, lang, my);
}
export function hush() { seq++; try { speechSynthesis.cancel(); } catch (e) { } try { if (playing) playing.stop(); } catch (e) { } }

// ---------- Family voice: real recordings of a grown-up ----------
// A grown-up records the game's most-used lines. Those lines are then played in their real voice,
// and everything else is spoken by the device voice with its pitch moved towards theirs.
// (A true copy of the voice needs an online service: see cloneFamilyVoice below, which a grown-up must choose to use.)
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
function playBuffer(buf) {
  const a = ac(); if (!a) return Promise.resolve();
  try { if (playing) playing.stop(); } catch (e) { }
  const s = a.createBufferSource(); s.buffer = buf; s.connect(a.destination); s.start(); playing = s;
  return new Promise(res => { s.onended = res; setTimeout(res, buf.duration * 1000 + 400); });
}

// ---------- Natural voice (optional, online) ----------
// A grown-up can add their own ElevenLabs or Google Cloud key. Each line is fetched once, then kept on this
// device, so lines the game has said before play instantly and offline. Only the text of the line is sent.
const mem = new Map(); // cache key -> decoded AudioBuffer (most recent ~120 lines)
let tdbp = null;
function tdb() {
  if (!tdbp) tdbp = new Promise((res, rej) => { try { const r = indexedDB.open('sparkle-valley-tts', 1); r.onupgradeneeded = () => r.result.createObjectStore('lines'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
  return tdbp;
}
const tget = async k => { const d = await tdb(); return new Promise(res => { const r = d.transaction('lines').objectStore('lines').get(k); r.onsuccess = () => res(r.result); r.onerror = () => res(null); }); };
const tput = async (k, v) => { const d = await tdb(); return new Promise(res => { const t = d.transaction('lines', 'readwrite'); t.objectStore('lines').put(v, k); t.oncomplete = res; t.onerror = res; }); };
const known = new Set();
export const cloudReady = () => settings.tts && settings.tts !== 'device' && !!settings.ttsKey && navigator.onLine !== false;
const cloudKey = (text, lang) => [settings.tts, settings.tts === 'eleven' ? settings.elevenVoice || ELEVEN_DEFAULT : (lang === 'vi' ? settings.googleVoiceVi : settings.googleVoiceEn) || '', lang, text].join('|');
const cloudCached = (text, lang) => mem.has(cloudKey(text, lang)) || known.has(cloudKey(text, lang));
export const ELEVEN_DEFAULT = '21m00Tcm4TlvDq8ikWAM'; // a warm, friendly premade voice; grown-ups can paste any voice ID
export const ELEVEN_MODEL = 'eleven_turbo_v2_5';     // speaks both English and Vietnamese
async function cloudVoice(text, lang) {
  const k = cloudKey(text, lang);
  if (mem.has(k)) { const b = mem.get(k); mem.delete(k); mem.set(k, b); return b; }
  let data = await tget(k).catch(() => null);
  if (!data) {
    data = settings.tts === 'eleven' ? await elevenTTS(text, lang) : await googleTTS(text, lang);
    tput(k, data).catch(() => { });
  }
  known.add(k);
  const buf = await decode(data);
  mem.set(k, buf); if (mem.size > 120) mem.delete(mem.keys().next().value);
  return buf;
}
async function elevenTTS(text, lang) {
  const voice = settings.elevenVoice || ELEVEN_DEFAULT;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_64`, {
    method: 'POST', headers: { 'xi-api-key': settings.ttsKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: ELEVEN_MODEL, language_code: lang, voice_settings: { stability: .45, similarity_boost: .8, style: .25, use_speaker_boost: true } })
  });
  if (!r.ok) throw new Error('ElevenLabs ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.arrayBuffer();
}
async function googleTTS(text, lang) {
  const name = (lang === 'vi' ? settings.googleVoiceVi : settings.googleVoiceEn) || (lang === 'vi' ? 'vi-VN-Neural2-A' : 'en-AU-Neural2-C');
  const r = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(settings.ttsKey), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: { text }, voice: { languageCode: name.slice(0, 5), name }, audioConfig: { audioEncoding: 'MP3', speakingRate: .95 } })
  });
  if (!r.ok) throw new Error('Google TTS ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json(), bin = atob(j.audioContent), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}
// Try the natural voice once, and report a clear error to the grown-up if it does not work.
export async function testCloudVoice(lang) {
  const text = lang === 'vi' ? 'Xin chào! Cùng chơi ở Thung Lũng Lấp Lánh nào!' : "Hello! Let's play in Sparkle Valley!";
  const buf = await cloudVoice(text, lang); await playBuffer(buf); return true;
}
// Make an ElevenLabs voice from the family recordings (this uploads the recordings to ElevenLabs).
export async function cloneFamilyVoice(name) {
  const fd = new FormData(); fd.append('name', name || 'Sparkle Valley family voice');
  fd.append('description', 'Made from family recordings in Sparkle Valley');
  let n = 0; for (const k in clips) { fd.append('files', new Blob([clips[k].data], { type: clips[k].type || 'audio/wav' }), k.replace(':', '-') + '.wav'); n++; }
  if (!n) throw new Error('No recordings yet');
  const r = await fetch('https://api.elevenlabs.io/v1/voices/add', { method: 'POST', headers: { 'xi-api-key': settings.ttsKey }, body: fd });
  if (!r.ok) throw new Error('ElevenLabs ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json(); return j.voice_id;
}
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
