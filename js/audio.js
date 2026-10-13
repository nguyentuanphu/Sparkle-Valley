// Sound effects and calm generative music, all synthesised with Web Audio (no files to download).
import { settings } from './state.js';
import { pick, rand } from './util.js';

let AC = null, sfxBus = null, musicBus = null, noiseBuf = null;
// (Round V, owner 13 Oct: on iPhone the microphone did nothing in Friends and in voice control, with every setting on
// "Ask") "playback" is a play-only mode: while it is set, iPhone never asks for the microphone and voice control cannot
// listen. While anything needs the microphone (a call, voice control, the recorder, the microphone test) the mode is
// "play-and-record", which also ignores the silent switch; back to "playback" when the last one lets go.
const micUsers = new Set();
function setSession() { try { if (navigator.audioSession) navigator.audioSession.type = micUsers.size ? 'play-and-record' : 'playback'; } catch (e) { } }
export function micMode(who, on) { if (on) micUsers.add(who); else micUsers.delete(who); setSession(); }
export function ac() {
  try {
    if (!AC) {
      // iPhone: game sound (and the recorded voices) would follow the silent switch while the device voice ignores it,
      // so with the switch on children heard only the machine voice. "playback" makes the game sound like a video's.
      setSession();
      AC = new (window.AudioContext || window.webkitAudioContext)();
      const comp = AC.createDynamicsCompressor(); comp.connect(AC.destination);
      sfxBus = AC.createGain(); sfxBus.gain.value = .7; sfxBus.connect(comp);
      musicBus = AC.createGain(); musicBus.gain.value = settings.calm ? .17 : .35; musicBus.connect(comp);
      noiseBuf = AC.createBuffer(1, AC.sampleRate * .8, AC.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (AC.state !== 'running' && !document.hidden) AC.resume().catch(() => { }); // 'suspended' before the first tap, 'interrupted' on iPhone after a call or the lock screen (never while the game is in the background)
    return AC;
  } catch (e) { return null; }
}
// iPhone and iPad only let a page make sound after a tap: on every tap (until it works) the audio is woken up and a
// silent sound is played, and the voice's own player is primed too (voice.js uses it if Web Audio is still asleep).
// Without this, the recorded voices could stay silent and the phone's own voice was heard instead.
export const unlockers = [];
const unlock = () => {
  const a = ac(); if (!a) return;
  try { const b = a.createBuffer(1, 1, 22050), s = a.createBufferSource(); s.buffer = b; s.connect(a.destination); s.start(0); } catch (e) { }
  unlockers.forEach(f => { try { f(); } catch (e) { } });
};
['pointerdown', 'touchend', 'keydown'].forEach(t => addEventListener(t, unlock, { capture: true, passive: true }));
// Silence in the background (owner, round M: "the game and sounds keep playing when no longer in the game; I have to
// kill the game to stop the sound"): when the game is switched away from, the phone is locked or the page is left, all
// sound stops (the audio engine is put to sleep, music stops scheduling notes, videos and voices stop); it wakes again
// when the game is back on the screen.
export function quiet() {
  try { if (AC && AC.state === 'running') AC.suspend(); } catch (e) { }
  document.querySelectorAll('audio, video').forEach(m => { try { m.pause(); } catch (e) { } });
  try { speechSynthesis.cancel(); } catch (e) { }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { quiet(); return; }
  if (filePlayer && Music.key && Music.key.startsWith('file:')) filePlayer.play().catch(() => { }); // a family recording carries on
  if (AC && AC.state !== 'running') AC.resume().then(() => { if (Music.key) Music.next = AC.currentTime + .1; }).catch(() => { });
});
addEventListener('pagehide', quiet); document.addEventListener('freeze', quiet); addEventListener('blur', () => { if (document.hidden) quiet(); });
const midi = m => 440 * Math.pow(2, (m - 69) / 12);

export function tone(f, dur, o = {}) {
  const a = ac(); if (!a) return;
  if (o.bus === 'music' ? !settings.music : !settings.sound) return;
  const t = o.when != null ? o.when : a.currentTime + (o.at || 0), vol = o.vol || .16;
  const osc = a.createOscillator(), g = a.createGain(); let out = g;
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
  if (o.bend) { osc.frequency.setValueAtTime(f, t + o.bend[0]); osc.frequency.exponentialRampToValueAtTime(f * o.bend[1], t + o.bend[0] + o.bend[2]); }
  else if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  if (o.vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = o.vibRate || 5.5; lg.gain.value = o.vib; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + .05); }
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || .008)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  osc.connect(g);
  if (o.filter) { const f2 = a.createBiquadFilter(); f2.type = o.filter; f2.frequency.value = o.ff || 1000; f2.Q.value = o.q || 1; g.connect(f2); out = f2; }
  out.connect(o.bus === 'music' ? musicBus : sfxBus); osc.start(t); osc.stop(t + dur + .05);
}
export function noise(dur, o = {}) {
  const a = ac(); if (!a) return; if (o.bus === 'music' ? !settings.music : !settings.sound) return;
  const t = o.when != null ? o.when : a.currentTime + (o.at || 0);
  const s = a.createBufferSource(); s.buffer = noiseBuf;
  const f = a.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.value = o.freq || 2000; f.Q.value = o.q || 1;
  const g = a.createGain(); const at = Math.min(.025, dur / 3); // a soft start, so short bursts never click
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(o.vol || .15, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(o.bus === 'music' ? musicBus : sfxBus); s.start(t); s.stop(t + dur + .02);
}
// Rain: a gentle steady hush (soft noise with a few drops in it, low-passed, slow fade in and out); on only while it
// rains and Sound effects is on. The weather says "still raining" every frame; when it stops saying so (rain over, or a
// game, story, Simple screen or Songs page covers the valley and it rests), the hush fades out by itself.
let rainNode = null;
function rainBuffer(a) {
  // 4 s of pink-ish noise with soft drops, so the loop is too long to hear repeating (the 0.8 s effects noise could be)
  const n = Math.floor(a.sampleRate * 4), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * .1848) * .2; }
  for (let k = 0; k < 60; k++) { const at = Math.floor(Math.random() * (n - 2000)), v = .15 + Math.random() * .25; for (let j = 0; j < 600; j++) d[at + j] += (Math.random() * 2 - 1) * v * Math.exp(-j / 90); }
  return b;
}
export const Rain = {
  set(on) {
    on = !!on && !!settings.sound;
    if (!rainNode && !on) return;
    const a = rainNode ? rainNode.a : ac(); if (!a) return;
    if (!rainNode) {
      const s = a.createBufferSource(), lo = a.createBiquadFilter(), hi = a.createBiquadFilter(), g = a.createGain();
      s.buffer = rainBuffer(a); s.loop = true; lo.type = 'lowpass'; lo.frequency.value = 1500; hi.type = 'highpass'; hi.frequency.value = 300; g.gain.value = 0;
      s.connect(lo); lo.connect(hi); hi.connect(g); g.connect(sfxBus); s.start(); rainNode = { a, s, g, on: false, k: 0 };
    }
    clearTimeout(rainNode.k); if (on) rainNode.k = setTimeout(() => Rain.set(false), 400);
    if (rainNode.on === on) return; rainNode.on = on;
    rainNode.g.gain.cancelScheduledValues(a.currentTime);
    rainNode.g.gain.setTargetAtTime(on ? .05 : 0, a.currentTime, on ? 1.5 : .3);
  },
  get on() { return !!(rainNode && rainNode.on); }
};

const PENTA = [72, 74, 76, 79, 81, 84, 86, 88];
export const SFX = {
  tap() { tone(880, .08, { type: 'triangle', vol: .08 }); },
  ok() { tone(midi(79), .12, { type: 'triangle', vol: .12 }); tone(midi(84), .22, { type: 'triangle', at: .09, vol: .12 }); },
  no() { tone(300, .18, { to: 220, type: 'triangle', vol: .12 }); },
  pop(n = 0) { const f = midi(PENTA[n % PENTA.length]); tone(f * .5, .12, { to: f * 1.5, vol: .2 }); noise(.06, { vol: .12, freq: 3200 }); },
  chime() { [0, 4, 7, 12].forEach((s, i) => tone(midi(84 + s), .6, { type: 'triangle', at: i * .07, vol: .1 })); },
  ding() { [0, .16].forEach(t => tone(2350, .5, { at: t, vol: .07, type: 'triangle', vib: 18, vibRate: 30 })); }, // a bicycle bell: kring kring
  // The "discovered a secret" jingle: rising arpeggio with a sparkly tail.
  secret() { [67, 71, 74, 79, 83, 86].forEach((m, i) => tone(midi(m), .5, { type: 'triangle', at: i * .09, vol: .1 })); noise(.6, { at: .5, freq: 7000, vol: .05 }); },
  fanfare() { [[72, 0], [76, .15], [79, .3], [84, .45], [79, .7], [84, .85]].forEach(([m, t], i) => { tone(midi(m), i === 5 ? .9 : .22, { type: 'square', at: t, vol: .05 }); tone(midi(m - 12), i === 5 ? .9 : .22, { type: 'triangle', at: t, vol: .1 }); }); },
  coin() { tone(midi(83), .08, { type: 'square', vol: .05 }); tone(midi(88), .3, { type: 'square', at: .08, vol: .05 }); },
  // (round T4a) a footstep that sounds like what is underfoot: soft grass, hard road, crunchy dirt, hushing sand, a hollow
  // wooden deck, a little splash (js/world.js surfaceAt); anything else the step of before
  step(on) {
    if (on === 'grass') noise(.06, { freq: rand(350, 550), vol: .04, q: .6 });
    else if (on === 'road') noise(.035, { freq: rand(1400, 2000), vol: .045, q: 1.6 });
    else if (on === 'dirt') noise(.05, { freq: rand(700, 1000), vol: .05, q: .9 });
    else if (on === 'sand') noise(.09, { freq: rand(2600, 3600), vol: .03, q: .5 });
    else if (on === 'wood') { tone(rand(170, 210), .06, { type: 'triangle', vol: .05 }); noise(.03, { freq: 900, vol: .03, q: 2 }); }
    else if (on === 'water') noise(.12, { freq: rand(1800, 2400), vol: .05, q: 1.5 });
    else noise(.05, { freq: rand(500, 900), vol: .05, q: .8 });
  },
  jump() { tone(300, .2, { to: 600, type: 'triangle', vol: .08 }); },
  glide() { noise(.5, { freq: 600, vol: .08, q: .5 }); },
  splash() { noise(.5, { type: 'lowpass', freq: 1000, vol: .09 }); },
  whoosh() { noise(.4, { freq: 900, vol: .1, q: .6 }); },
  hee() { for (let i = 0; i < 4; i++) { const f = rand(900, 1200) + i * 40; tone(f, .08, { at: i * .09, to: f * 1.25, vol: .1 }); } },
  cook() { for (let i = 0; i < 8; i++) noise(.08, { at: i * .09, freq: rand(2500, 5000), vol: .06 }); },
  moo() { tone(150, 1.1, { type: 'sawtooth', to: 120, vol: .1, filter: 'lowpass', ff: 520 }); },
  quack() { [0, .2].forEach(t => tone(330, .15, { at: t, to: 260, type: 'square', vol: .08, filter: 'bandpass', ff: 1300, q: 3 })); },
  woof() { [0, .22].forEach(t => { noise(.13, { at: t, freq: 700, q: 1.5, vol: .3 }); tone(320, .13, { at: t, to: 170, type: 'square', vol: .06, filter: 'lowpass', ff: 900 }); }); },
  meow() { tone(480, .7, { type: 'sawtooth', bend: [.05, 1.7, .25], vol: .07, filter: 'lowpass', ff: 1800, vib: 12, vibRate: 5 }); },
  baa() { tone(330, .75, { type: 'sawtooth', vol: .08, vib: 18, vibRate: 8, filter: 'lowpass', ff: 1500, to: 300 }); },
  oink() { [0, .25].forEach(t => { tone(140, .18, { at: t, to: 100, type: 'sawtooth', vol: .11, filter: 'lowpass', ff: 500 }); noise(.18, { at: t, type: 'lowpass', freq: 400, vol: .18 }); }); },
  cluck() { [0, .12, .24, .5].forEach((t, i) => tone(i === 3 ? 700 : 520, i === 3 ? .25 : .07, { at: t, to: i === 3 ? 480 : 600, type: 'square', vol: .06, filter: 'bandpass', ff: 1400, q: 2 })); },
  neigh() { tone(900, .8, { type: 'sawtooth', to: 500, vol: .06, vib: 60, vibRate: 14, filter: 'lowpass', ff: 2200 }); },
  // more animal voices: a bunny sniffing, a panda cub's bleat, a joey's chuff-chuff, a buffalo calf's high moo, a purr
  sniff() { [0, .09, .18, .27].forEach(t => noise(.05, { at: t, freq: 3200, q: 3, vol: .06 })); tone(1500, .1, { at: .36, to: 1900, vol: .05 }); },
  bleat() { [0, .3].forEach(t => tone(620, .25, { at: t, to: 520, type: 'sawtooth', vol: .07, vib: 22, vibRate: 11, filter: 'lowpass', ff: 1700 })); },
  chuff() { [0, .14, .28].forEach(t => { noise(.07, { at: t, freq: 900, q: 1.2, vol: .14 }); tone(200, .06, { at: t, to: 150, vol: .05 }); }); },
  calfmoo() { tone(260, .8, { type: 'sawtooth', to: 210, vol: .09, filter: 'lowpass', ff: 700, vib: 6, vibRate: 5 }); },
  purr() { tone(48, .9, { type: 'sawtooth', vol: .07, filter: 'lowpass', ff: 260, vib: 14, vibRate: 22 }); },
  squeak() { [0, .15, .3].forEach(t => tone(1300, .08, { at: t, to: 1700, vol: .06 })); },
  ribbit() { [0, .18].forEach(t => tone(180, .14, { at: t, to: 120, type: 'square', vol: .08, filter: 'lowpass', ff: 700, vib: 40, vibRate: 30 })); },
  bump() { tone(260, .2, { to: 150, vol: .12, type: 'triangle' }); },
  water() { for (let i = 0; i < 6; i++) noise(.12, { at: i * .07, freq: 2500 + i * 200, vol: .06, q: 2 }); },
  plant() { tone(200, .12, { to: 120, vol: .12, type: 'triangle' }); noise(.1, { freq: 600, vol: .08 }); },
  harvest() { tone(400, .15, { to: 900, vol: .12, type: 'triangle' }); [79, 84].forEach((m, i) => tone(midi(m), .25, { at: .1 + i * .08, type: 'triangle', vol: .08 })); },
  note(n = 0) { tone(midi([72, 74, 76, 79, 81, 84, 86, 88][n % 8]), .45, { type: 'triangle', vol: .14 }); },
  xylo(n = 0) { const f = midi([60, 62, 64, 65, 67, 69, 71, 72][n % 8]); tone(f, .6, { vol: .2 }); tone(f * 4, .12, { vol: .05 }); },
  trumpet() { tone(380, .7, { type: 'sawtooth', to: 560, vol: .09, filter: 'bandpass', ff: 900, q: 2 }); tone(560, .5, { at: .45, to: 300, type: 'sawtooth', vol: .07, filter: 'bandpass', ff: 900, q: 2 }); },
  honk() { [0, .3].forEach(t => tone(520, .22, { at: t, to: 440, type: 'square', vol: .07, filter: 'bandpass', ff: 1100, q: 2 })); },
  squawk() { tone(900, .35, { type: 'sawtooth', to: 1300, vol: .07, filter: 'bandpass', ff: 1600, q: 3 }); tone(1300, .25, { at: .3, to: 800, type: 'sawtooth', vol: .06, filter: 'bandpass', ff: 1600, q: 3 }); },
  chirp() { [0, .12, .24].forEach(t => tone(1800, .08, { at: t, to: 2400, vol: .06 })); },
  hoot() { [0, .35].forEach(t => tone(420, .3, { at: t, to: 360, vol: .14, filter: 'lowpass', ff: 900 })); },
  // Tower activation: deep rising swell.
  tower() { tone(110, 2.2, { to: 330, type: 'sawtooth', vol: .07, filter: 'lowpass', ff: 900 }); [76, 79, 83, 88].forEach((m, i) => tone(midi(m), 1.2, { at: .8 + i * .15, vol: .08, type: 'triangle' })); },
  travel() { [88, 84, 79, 76, 72].forEach((m, i) => tone(midi(m), .3, { at: i * .05, vol: .07 })); noise(.8, { freq: 3000, vol: .06 }); }
};

// ---------- music ----------
// Each place has its own mood. The field theme is sparse piano like a quiet morning;
// the village theme imitates the đàn bầu (one-string zither) with sliding notes.
const VN_PENTA = [62, 65, 67, 69, 72, 74, 77, 79]; // D F G A C — Vietnamese "điệu Bắc" flavour
const THEMES = {
  field: { tempo: .55, play(t, i) { if (Math.random() < .55) tone(midi(pick([60, 64, 67, 69, 72, 74, 76, 79]) + (Math.random() < .3 ? 12 : 0)), 1.6, { when: t, vol: .09, type: 'triangle', bus: 'music' }); if (i % 8 === 0) tone(midi(pick([48, 53, 55, 57])), 3, { when: t, vol: .08, bus: 'music' }); } },
  village: { tempo: .42, play(t, i) {
    if (Math.random() < .7) { const m = pick(VN_PENTA), up = Math.random() < .4; tone(midi(m), .9, { when: t, vol: .1, bus: 'music', vib: 4, vibRate: 5, bend: up ? [.25, 1.06, .2] : null }); }
    if (i % 4 === 0) tone(midi(pick([50, 55, 57])), .5, { when: t, vol: .07, type: 'triangle', bus: 'music' });
    if (i % 2 === 1) noise(.04, { when: t, freq: 4000, vol: .02, bus: 'music' });
  } },
  shrine: { tempo: .8, play(t, i) { tone(midi(pick([69, 72, 76, 81, 84])), 2.4, { when: t, vol: .06, bus: 'music', vib: 3 }); if (i % 4 === 0) tone(midi(45), 3.2, { when: t, vol: .07, type: 'triangle', bus: 'music' }); } },
  night: { tempo: .9, play(t, i) { if (Math.random() < .5) tone(midi(pick([64, 67, 71, 74, 76])), 2.2, { when: t, vol: .06, bus: 'music' }); if (i % 6 === 0) tone(midi(40), 4, { when: t, vol: .05, bus: 'music' }); } },
  glide: { tempo: .3, play(t, i) { const s = [72, 76, 79, 84, 79, 76]; tone(midi(s[i % 6]), .5, { when: t, vol: .08, type: 'triangle', bus: 'music' }); } },
  // (owner, 13 Oct: "soft background music during films") a quiet bed under the story films: slow warm chords and a
  // few soft notes, well below the narrator (and lowered further while anyone speaks: Music.under)
  story: { tempo: .7, play(t, i) {
    const ch = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]][(i >> 3) % 4];
    if (i % 8 === 0) ch.forEach(n => tone(midi(n), 5.4, { when: t, vol: .028, bus: 'music' }));
    if (i % 2 === 0 && Math.random() < .55) tone(midi(pick(ch) + 12), 1.9, { when: t, vol: .03, type: 'triangle', bus: 'music' });
  } },
  game: { tempo: .28, play(t, i) { const s = [72, 74, 76, 79, 76, 74, 72, 67]; if (i % 2 === 0) tone(midi(s[(i / 2) % 8 | 0]), .4, { when: t, vol: .07, type: 'triangle', bus: 'music' }); if (i % 4 === 0) tone(midi(48 + [0, 5, 7, 5][(i / 4) % 4 | 0]), .5, { when: t, vol: .08, bus: 'music' }); noise(.03, { when: t, freq: 6000, vol: .015, bus: 'music' }); } }
};
// Sequenced songs: one letter-note per eighth beat ('.' = rest). Children's songs here are traditional
// and in the public domain; the rest are written for this game.
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function N(str) { return str.replace(/\|/g, ' ').trim().split(/\s+/).map(t => { if (t === '.') return 0; const m = /^([A-G])(#?)(\d)$/.exec(t); return m ? 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] ? 1 : 0) : 0; }); }
const SONGS = {
  farm: { name: 'Old MacDonald', bpm: 104, inst: 'marimba', drums: 'soft', bar: 8,
    mel: N('C5 . C5 . C5 . G4 . | A4 . A4 . G4 . . . | E5 . E5 . D5 . D5 . | C5 . . . . . G4 . | C5 . C5 . C5 . G4 . | A4 . A4 . G4 . . . | E5 . E5 . D5 . D5 . | C5 . . . . . . .'), bass: N('C3 F2 G2 C3 C3 F2 G2 C3') },
  pond: { name: 'Row Your Boat', bpm: 150, inst: 'bell', drums: 'shaker', bar: 6,
    mel: N('C5 . . C5 . . | C5 . D5 E5 . . | E5 . D5 E5 . F5 | G5 . . . . . | C6 C6 C6 G5 G5 G5 | E5 E5 E5 C5 C5 C5 | G5 . F5 E5 . D5 | C5 . . . . .'), bass: N('C3 C3 C3 C3 C3 C3 G2 C3') },
  twinkle: { name: 'Twinkle Twinkle', bpm: 96, inst: 'bell', drums: 'none', bar: 8,
    mel: N('C5 . C5 . G5 . G5 . | A5 . A5 . G5 . . . | F5 . F5 . E5 . E5 . | D5 . D5 . C5 . . . | G5 . G5 . F5 . F5 . | E5 . E5 . D5 . . . | G5 . G5 . F5 . F5 . | E5 . E5 . D5 . . .'), bass: N('C3 F2 F2 C3 C3 G2 C3 G2') },
  // "Kìa con bướm vàng" (sung to the old French round "Frère Jacques")
  folk: { name: 'Kìa con bướm vàng', bpm: 112, inst: 'danbau', drums: 'wood', bar: 8,
    mel: N('C5 . D5 . E5 . C5 . | C5 . D5 . E5 . C5 . | E5 . F5 . G5 . . . | E5 . F5 . G5 . . . | G5 A5 G5 F5 E5 . C5 . | G5 A5 G5 F5 E5 . C5 . | C5 . G4 . C5 . . . | C5 . G4 . C5 . . .'), bass: N('C3 C3 C3 C3 C3 C3 G2 C3') },
  // An original tune in Vietnamese pentatonic style for the village square
  village2: { name: 'Village Dance', bpm: 100, inst: 'flute', drums: 'wood', bar: 8,
    mel: N('D5 . F5 G5 A5 . G5 . | F5 . D5 . C5 . D5 . | F5 . G5 . A5 . C6 . | A5 . G5 . A5 . . . | C6 . A5 G5 F5 . G5 . | A5 . G5 F5 D5 . C5 . | D5 . F5 . G5 . F5 . | D5 . . . . . . .'), bass: N('D3 C3 F2 D3 F2 D3 C3 D3') },
  think: { name: 'Thinking Time', bpm: 84, inst: 'marimba', drums: 'none', bar: 8,
    mel: N('E5 . G5 . C6 . . . | B5 . G5 . D5 . . . | C5 . E5 . A5 . . . | G5 . . . . . . . | F5 . A5 . D6 . . . | C6 . A5 . F5 . . . | E5 . G5 . B5 . D6 . | C6 . . . . . . .'), bass: N('C3 G2 A2 E2 F2 F2 G2 C3') },
  strategy: { name: 'Clever Plan', bpm: 92, inst: 'pluck', drums: 'soft', bar: 8,
    mel: N('A4 . C5 . E5 . D5 . | C5 . . . A4 . . . | G4 . B4 . D5 . C5 . | B4 . . . G4 . . . | F4 . A4 . C5 . E5 . | D5 . C5 . B4 . A4 . | G#4 . B4 . E5 . D5 . | C5 . B4 . A4 . . .'), bass: N('A2 A2 G2 G2 F2 F2 E2 A2') },
  money: { name: 'Market Bounce', bpm: 124, inst: 'marimba', drums: 'party', bar: 8,
    mel: N('G5 . E5 . G5 . C6 . | A5 . G5 . E5 . . . | F5 . D5 . F5 . A5 . | G5 . F5 . D5 . . . | E5 . C5 . E5 . G5 . | A5 . C6 . A5 . G5 . | F5 . A5 . G5 . D5 . | C5 . . . . . . .'), bass: N('C3 C3 F2 G2 C3 F2 G2 C3') },
  fly: { name: 'Up Up Away', bpm: 132, inst: 'pluck', drums: 'party', bar: 8,
    mel: N('E5 G5 C6 . G5 . E5 . | F5 A5 D6 . A5 . F5 . | E5 G5 C6 . E6 . D6 . | C6 . G5 . E5 . . . | D5 F5 A5 . F5 . D5 . | E5 G5 C6 . G5 . E5 . | F5 . A5 . G5 . B5 . | C6 . . . . . . .'), bass: N('C3 F2 C3 C3 D3 C3 F2 C3') },
  party1: { name: 'Party Pop', bpm: 116, inst: 'pluck', drums: 'party', bar: 8, mel: N('C5 . E5 . G5 . E5 . | F5 . E5 D5 C5 . . . | D5 . F5 . A5 . G5 F5 | E5 . D5 . C5 . . .'), bass: N('C3 F2 G2 C3') },
  party2: { name: 'Twinkle Remix', bpm: 122, inst: 'bell', drums: 'party', bar: 8, mel: N('C5 . C5 . G5 . G5 . | A5 . A5 . G5 . . . | F5 . F5 . E5 . E5 . | D5 . D5 . C5 . . .'), bass: N('C3 F2 G2 C3') },
  party3: { name: 'Bouncy Castle', bpm: 126, inst: 'lead', drums: 'party', bar: 8, mel: N('G5 . G5 E5 . . G5 . | A5 . G5 . E5 . . . | D5 . D5 E5 . . F5 . | E5 . D5 . C5 . . . | G5 . G5 E5 . . G5 . | C6 . B5 . A5 . G5 . | F5 . A5 . G5 . E5 . | D5 . . . C5 . . .'), bass: N('C3 C3 G2 C3 C3 A2 F2 G2') }
};
// ---------- round N (owner): Vietnamese, festival and lullaby music ----------
// Original melodies in the Vietnamese pentatonic style for the Vietnam areas and the festivals (famous children's songs
// such as "Chiếc đèn ông sao" are under copyright: families can add recordings they own in Studio → 🎵 Music), Jingle
// Bells (public domain) for Christmas, and gentle hát ru instrumentals under the traditional lullaby words (a hát ru has
// no fixed tune: each mother sings it her own way, so these are original slow melodies in that style).
Object.assign(SONGS, {
  vn_sang: { name: 'Sáng trên làng', bpm: 96, inst: 'flute', drums: 'wood', bar: 8,
    mel: N('D5 . . F5 G5 . A5 . | G5 . F5 . D5 . . . | C5 . D5 . F5 . G5 . | A5 . . . . . . . | C6 . A5 . G5 . A5 . | G5 F5 D5 . F5 . . . | G5 . F5 . D5 . C5 . | D5 . . . . . . .'), bass: N('D3 D3 C3 F2 F2 D3 C3 D3') },
  vn_dong: { name: 'Đồng lúa', bpm: 88, inst: 'danbau', drums: 'none', bar: 8,
    mel: N('A5 . G5 . A5 . C6 . | D6 . . . C6 . A5 . | G5 . F5 . G5 . A5 . | G5 . . . . . . . | F5 . G5 . A5 . G5 . | F5 . D5 . C5 . D5 . | F5 . G5 . F5 . D5 . | D5 . . . . . . .'), bass: N('D3 D3 C3 C3 F2 D3 C3 D3') },
  tet1: { name: 'Xuân về', bpm: 116, inst: 'flute', drums: 'wood', bar: 8,
    mel: N('D5 . F5 G5 A5 . C6 . | A5 G5 F5 . G5 . . . | A5 . C6 . D6 . C6 A5 | G5 . A5 . . . . . | F5 . G5 A5 G5 F5 D5 . | C5 . D5 F5 G5 . . . | A5 G5 F5 G5 F5 . D5 C5 | D5 . . . . . . .'), bass: N('D3 F2 A2 D3 F2 C3 G2 D3') },
  tet2: { name: 'Pháo hoa ngày Tết', bpm: 128, inst: 'lead', drums: 'party', bar: 8,
    mel: N('D5 D5 F5 . G5 . A5 . | C6 . A5 . G5 . . . | F5 F5 G5 . A5 . C6 . | D6 . C6 . A5 . . . | G5 . A5 . G5 F5 D5 . | F5 . G5 . A5 . . . | C6 . A5 . G5 . F5 . | D5 . . . . . . .'), bass: N('D3 D3 F2 F2 G2 G2 C3 D3') },
  trungthu1: { name: 'Rước đèn', bpm: 108, inst: 'bell', drums: 'wood', bar: 8,
    mel: N('G5 . A5 . C6 . A5 . | G5 . E5 . G5 . . . | D5 . E5 . G5 . A5 . | G5 . . . . . . . | C6 . A5 . G5 . E5 . | D5 . E5 . G5 . . . | A5 . G5 . E5 . D5 . | C5 . . . . . . .'), bass: N('C3 C3 G2 C3 F2 C3 G2 C3') },
  trungthu2: { name: 'Đêm trăng rằm', bpm: 84, inst: 'danbau', drums: 'none', bar: 8,
    mel: N('A4 . C5 . D5 . . . | E5 . D5 . C5 . A4 . | G4 . A4 . C5 . . . | A4 . . . . . . . | C5 . D5 . E5 . G5 . | A5 . G5 . E5 . D5 . | C5 . D5 . A4 . G4 . | A4 . . . . . . .'), bass: N('A2 A2 G2 A2 C3 C3 G2 A2') },
  jingle: { name: 'Jingle Bells', bpm: 132, inst: 'bell', drums: 'shaker', bar: 8,
    mel: N('E5 . E5 . E5 . . . | E5 . E5 . E5 . . . | E5 . G5 . C5 . . D5 | E5 . . . . . . . | F5 . F5 . F5 . . F5 | F5 . E5 . E5 . E5 E5 | E5 . D5 . D5 . E5 . | D5 . . . G5 . . . | E5 . E5 . E5 . . . | E5 . E5 . E5 . . . | E5 . G5 . C5 . . D5 | E5 . . . . . . . | F5 . F5 . F5 . . F5 | F5 . E5 . E5 . E5 E5 | G5 . G5 . F5 . D5 . | C5 . . . . . . .'), bass: N('C3 C3 C3 C3 F2 C3 G2 G2 C3 C3 C3 C3 F2 C3 G2 C3') },
  diwali: { name: 'Diya lights', bpm: 100, inst: 'pluck', drums: 'soft', bar: 8,
    mel: N('C5 . C#5 . E5 . F5 . | G5 . F5 . E5 . . . | F5 . G5 . G#5 . G5 . | F5 . E5 . C#5 . . . | C5 . E5 . G5 . C6 . | B5 . G#5 . G5 . . . | F5 . E5 . C#5 . E5 . | C5 . . . . . . .'), bass: N('C3 C3 F2 C3 C3 C3 F2 C3') },
  ausday: { name: 'Sunny picnic', bpm: 120, inst: 'marimba', drums: 'party', bar: 8,
    mel: N('C5 . E5 . G5 . A5 . | G5 . E5 . C5 . . . | D5 . F5 . A5 . G5 . | E5 . . . . . . . | C5 . E5 . G5 . C6 . | A5 . G5 . E5 . D5 . | F5 . E5 . D5 . G4 . | C5 . . . . . . .'), bass: N('C3 C3 G2 C3 C3 F2 G2 C3') },
  ru1: { name: 'À ơi', bpm: 60, inst: 'soft', drums: 'none', bar: 8, soft: true,
    mel: N('A4 . . . C5 . D5 . | C5 . . . A4 . . . | G4 . . . A4 . C5 . | A4 . . . . . . . | D5 . . . C5 . A4 . | G4 . . . E4 . G4 . | A4 . . . . . . . | . . . . . . . .'), bass: N('A2 A2 G2 A2 D3 G2 A2 A2') },
  ru2: { name: 'Ầu ơ', bpm: 58, inst: 'soft', drums: 'none', bar: 8, soft: true,
    mel: N('E5 . . . D5 . C5 . | A4 . . . . . C5 . | D5 . E5 . D5 . C5 . | A4 . . . . . . . | G4 . . . A4 . C5 . | D5 . . . C5 . A4 . | G4 . A4 . . . . . | . . . . . . . .'), bass: N('A2 F2 G2 A2 C3 D3 A2 A2') },
  ru3: { name: 'Gió mùa thu', bpm: 62, inst: 'soft', drums: 'none', bar: 8, soft: true,
    mel: N('C5 . D5 . E5 . . . | G5 . E5 . D5 . . . | C5 . A4 . G4 . . . | A4 . . . . . . . | C5 . . . D5 . E5 . | D5 . C5 . A4 . . . | G4 . . . A4 . . . | . . . . . . . .'), bass: N('C3 C3 F2 A2 C3 D3 G2 A2') },
  ru4: { name: 'Cái ngủ', bpm: 60, inst: 'soft', drums: 'none', bar: 8, soft: true,
    mel: N('G4 . A4 . C5 . . . | A4 . G4 . E4 . . . | D4 . E4 . G4 . A4 . | G4 . . . . . . . | C5 . . . A4 . G4 . | E4 . G4 . A4 . . . | G4 . E4 . D4 . . . | . . . . . . . .'), bass: N('C3 C3 G2 C3 F2 C3 G2 C3') }
});
export const PARTY = ['party1', 'party2', 'party3'];
function playInst(inst, m, t, v = 1) {
  const f = midi(m), o = { when: t, bus: 'music' };
  if (inst === 'marimba') { tone(f, .45, Object.assign({ vol: .17 * v }, o)); tone(f * 4, .07, Object.assign({ vol: .04 * v }, o)); }
  else if (inst === 'bell') { tone(f, .9, Object.assign({ vol: .13 * v }, o)); tone(f * 2.01, .45, Object.assign({ vol: .04 * v }, o)); }
  else if (inst === 'lead') { tone(f, .22, Object.assign({ type: 'square', vol: .045 * v }, o)); tone(f, .3, Object.assign({ type: 'triangle', vol: .1 * v }, o)); }
  else if (inst === 'danbau') { tone(f, .7, Object.assign({ vol: .13 * v, vib: 5, vibRate: 5.5, bend: Math.random() < .3 ? [.2, 1.059, .15] : null }, o)); }
  else if (inst === 'soft') { tone(f, 1.6, Object.assign({ vol: .09 * v, attack: .12 }, o)); tone(f * 2, .9, Object.assign({ vol: .015 * v, attack: .1 }, o)); } // a hushed music-box for lullabies
  else if (inst === 'flute') { tone(f, .5, Object.assign({ vol: .12 * v, vib: 3, vibRate: 5, attack: .05 }, o)); noise(.08, Object.assign({ freq: f * 2, vol: .015, q: 4 }, o)); }
  else tone(f, .28, Object.assign({ type: 'triangle', vol: .13 * v }, o));
}
function songStep(s, i, t) {
  const m = s.mel[i % s.mel.length], bar = Math.floor(i / s.bar) % s.bass.length, inBar = i % s.bar;
  if (m) playInst(s.inst, m, t);
  const half = s.bar === 6 ? 3 : 2;
  if (s.soft) { if (inBar === 0) { const b = s.bass[bar]; if (b) tone(midi(b), 2.4, { when: t, vol: .05, bus: 'music', attack: .2 }); } return; } // lullabies: one soft low note a bar, nothing else
  if (inBar % half === 0) { const b = s.bass[bar]; if (b) tone(midi(b + ((inBar / half) % 2 ? 12 : 0)), .24, { type: 'triangle', when: t, vol: .16, bus: 'music' }); }
  if (s.drums === 'party') { if (inBar % 4 === 0) tone(130, .18, { when: t, to: 45, vol: .26, bus: 'music' }); if (inBar % 8 === 4) noise(.12, { when: t, freq: 1600, vol: .16, bus: 'music' }); if (i % 2) noise(.03, { when: t, freq: 8000, vol: .04, bus: 'music' }); }
  else if (s.drums === 'soft') { if (inBar === 0) tone(110, .15, { when: t, to: 50, vol: .15, bus: 'music' }); noise(.03, { when: t, freq: 7000, vol: i % 2 ? .015 : .03, bus: 'music' }); }
  else if (s.drums === 'shaker') noise(.04, { when: t, freq: 6000, vol: inBar % 3 === 0 ? .035 : .018, bus: 'music' });
  else if (s.drums === 'wood') { if (inBar % 2 === 0) tone(inBar % 4 ? 1400 : 900, .05, { when: t, vol: .07, type: 'triangle', bus: 'music' }); }
}
// a family recording from Studio (content/music/…mp3) plays through this one hidden player, looped
let filePlayer = null;
// the music's own loudness: quieter in calm mode, and lowered under a speaking narrator (Music.under)
const fullGain = () => (settings.calm ? .17 : .35) * (Music.low ? .3 : 1);
export const Music = {
  key: null, timer: null, next: 0, step: 0, low: false,
  pinned: false, // the 🎵 Songs page chose the music: the valley leaves it alone until the page closes
  files: {},     // 'file:<id>' → its address (js/songs.js fills it from Studio's content pack)
  play(key, force) {
    if (this.key === key) return;
    this.key = key; clearInterval(this.timer); this.timer = null; if (filePlayer) filePlayer.pause();
    if (!settings.music && !force) return;
    if (key && key.startsWith('file:') && this.files[key]) {
      if (!filePlayer) { filePlayer = document.createElement('audio'); filePlayer.loop = true; filePlayer.hidden = true; document.body.appendChild(filePlayer); }
      if (filePlayer.dataset.src !== this.files[key]) { filePlayer.src = this.files[key]; filePlayer.dataset.src = this.files[key]; }
      filePlayer.volume = settings.calm ? .45 : .8; filePlayer.currentTime = 0; filePlayer.play().catch(() => { }); return;
    }
    if (!(THEMES[key] || SONGS[key])) return;
    const a = ac(); if (!a) return;
    this.next = a.currentTime + .1; this.step = 0;
    this.timer = setInterval(() => this.tick(), 50);
  },
  stop() { clearInterval(this.timer); this.timer = null; this.key = null; if (filePlayer) filePlayer.pause(); },
  has: key => !!(THEMES[key] || SONGS[key]),
  // the music fades out over a few seconds (the lullaby sleep timer), then stops
  fadeOut(sec = 6) { if (musicBus && AC) { const g = musicBus.gain, now = AC.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + sec); } if (filePlayer) { const v0 = filePlayer.volume, t0 = Date.now(), iv = setInterval(() => { const k = (Date.now() - t0) / (sec * 1000); filePlayer.volume = Math.max(0, v0 * (1 - k)); if (k >= 1) clearInterval(iv); }, 200); }
    setTimeout(() => { this.stop(); this.pinned = false; if (musicBus) musicBus.gain.value = fullGain(); }, sec * 1000 + 100); },
  // the music dips for a few seconds (an animal's call in a listening game), then comes back
  duck(sec = 2, to = .03) {
    const full = fullGain();
    if (musicBus && AC) { const g = musicBus.gain, now = AC.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(to, now + .15); g.setValueAtTime(to, now + sec); g.linearRampToValueAtTime(full, now + sec + .5); }
    if (filePlayer) { const v = settings.calm ? .45 : .8; filePlayer.volume = v * .1; clearTimeout(this.duckT); this.duckT = setTimeout(() => { if (filePlayer) filePlayer.volume = v; }, sec * 1000 + 300); }
  },
  refresh() { if (musicBus) musicBus.gain.value = fullGain(); const k = this.key; this.stop(); if (k) this.play(k); },
  // (story films) lower the music to a third while the narrator speaks, and bring it back after (gently)
  under(on) {
    on = !!on; if (on === this.low) return; this.low = on;
    if (musicBus && AC) { const g = musicBus.gain, now = AC.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(fullGain(), now + (on ? .25 : .8)); }
    if (filePlayer) filePlayer.volume = (settings.calm ? .45 : .8) * (on ? .3 : 1);
  },
  songName() { return SONGS[this.key] ? SONGS[this.key].name : ''; },
  tick() {
    if (!AC || document.hidden || AC.state !== 'running') return; // nothing is scheduled while the game is in the background
    const th = THEMES[this.key], sg = SONGS[this.key];
    if (th) while (this.next < AC.currentTime + .25) { th.play(this.next, this.step); this.next += th.tempo; this.step++; }
    else if (sg) { const d = 60 / sg.bpm / 2; while (this.next < AC.currentTime + .2) { songStep(sg, this.step, this.next); this.next += d; this.step++; } }
  }
};

// (tester's notes, 12 Oct) an animal's call for the listening games: about two seconds long (the call again until it
// fills them), louder than the other sounds, with the music dipped under it, so a child can tell which animal it is
const CALL_LEN = { moo: 1.1, quack: .35, woof: .35, meow: .75, baa: .75, oink: .45, cluck: .75, neigh: .8, ribbit: .32, hoot: .65 };
export function animalCall(name, sec = 2) {
  const f = SFX[name], a = ac(); if (!f) return;
  Music.duck(sec + .3);
  if (a && sfxBus) { const g = sfxBus.gain, now = a.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(1.6, now); g.setValueAtTime(1.6, now + sec + .2); g.linearRampToValueAtTime(.7, now + sec + .5); }
  const gap = (CALL_LEN[name] || .8) + .3;
  for (let t = 0; t < sec - .1; t += gap) setTimeout(() => f(), t * 1000);
}
