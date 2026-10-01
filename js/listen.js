// Talking to the game: the device's own speech recognition (Safari on iPhone/iPad, Chrome on Android).
// Most devices send the sound to Apple or Google to turn it into words, so this needs the internet.
// Nothing is stored. Children press the 🎤 button, say something, and the game understands simple commands.
import { settings } from './state.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = () => !!SR;

let active = null;
// Listen once. Resolves with what was heard ('' if nothing). onPartial shows words as they come in.
export function listen({ onPartial, lang } = {}) {
  if (!SR) return Promise.resolve('');
  stopListening();
  return new Promise(res => {
    const r = new SR(); active = r;
    r.lang = (lang || settings.lang) === 'vi' ? 'vi-VN' : 'en-AU';
    r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
    let best = '', done = false;
    const finish = () => { if (done) return; done = true; active = null; res(best.trim()); };
    r.onresult = e => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; best = t; onPartial && onPartial(t); };
    r.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') best = '\u0000denied'; finish(); };
    r.onend = finish;
    try { r.start(); } catch (e) { finish(); }
    setTimeout(() => { try { r.stop(); } catch (e) { } }, 9000);
  });
}
export function stopListening() { if (active) { try { active.abort(); } catch (e) { } active = null; } }

// Lower case, no Vietnamese accents, so "đi đến làng sen" and "di den lang sen" match the same way.
export const plain = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();
export const has = (text, ...words) => { const t = ' ' + plain(text) + ' '; return words.some(w => t.includes(' ' + plain(w) + ' ') || (plain(w).includes(' ') && t.includes(plain(w)))); };
