// Talking voice in English and Vietnamese using the device's own natural voices.
// Premium/enhanced/neural voices are picked first; grown-ups can choose a voice in settings.
import { settings } from './state.js';

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
  u.rate = lang === 'vi' ? .9 : .92; u.pitch = 1.08; u.volume = 1;
  return u;
}
// say('Hello', 'Xin chào') speaks the current language (and the other one too in bilingual mode).
export function say(en, vi) {
  if (!settings.voice || !window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const first = settings.lang === 'vi' ? ['vi', vi ?? en] : ['en', en];
    speechSynthesis.speak(utter(first[1], first[0]));
    if (settings.bilingual && vi != null && en !== vi) {
      const second = settings.lang === 'vi' ? ['en', en] : ['vi', vi];
      speechSynthesis.speak(utter(second[1], second[0]));
    }
  } catch (e) { }
}
// Speak one string in a fixed language (letter names, etc.).
export function sayIn(lang, text) {
  if (!settings.voice || !window.speechSynthesis) return;
  try { speechSynthesis.cancel(); speechSynthesis.speak(utter(text, lang)); } catch (e) { }
}
export function hush() { try { speechSynthesis.cancel(); } catch (e) { } }
