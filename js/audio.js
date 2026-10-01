// Sound effects and calm generative music, all synthesised with Web Audio (no files to download).
import { settings } from './state.js';
import { pick, rand } from './util.js';

let AC = null, sfxBus = null, musicBus = null, noiseBuf = null;
export function ac() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      const comp = AC.createDynamicsCompressor(); comp.connect(AC.destination);
      sfxBus = AC.createGain(); sfxBus.gain.value = .7; sfxBus.connect(comp);
      musicBus = AC.createGain(); musicBus.gain.value = .35; musicBus.connect(comp);
      noiseBuf = AC.createBuffer(1, AC.sampleRate * .8, AC.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  } catch (e) { return null; }
}
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
  const g = a.createGain(); g.gain.setValueAtTime(o.vol || .15, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(o.bus === 'music' ? musicBus : sfxBus); s.start(t); s.stop(t + dur + .02);
}

const PENTA = [72, 74, 76, 79, 81, 84, 86, 88];
export const SFX = {
  tap() { tone(880, .08, { type: 'triangle', vol: .08 }); },
  ok() { tone(midi(79), .12, { type: 'triangle', vol: .12 }); tone(midi(84), .22, { type: 'triangle', at: .09, vol: .12 }); },
  no() { tone(300, .18, { to: 220, type: 'triangle', vol: .12 }); },
  pop(n = 0) { const f = midi(PENTA[n % PENTA.length]); tone(f * .5, .12, { to: f * 1.5, vol: .2 }); noise(.06, { vol: .12, freq: 3200 }); },
  chime() { [0, 4, 7, 12].forEach((s, i) => tone(midi(84 + s), .6, { type: 'triangle', at: i * .07, vol: .1 })); },
  // The "discovered a secret" jingle: rising arpeggio with a sparkly tail.
  secret() { [67, 71, 74, 79, 83, 86].forEach((m, i) => tone(midi(m), .5, { type: 'triangle', at: i * .09, vol: .1 })); noise(.6, { at: .5, freq: 7000, vol: .05 }); },
  fanfare() { [[72, 0], [76, .15], [79, .3], [84, .45], [79, .7], [84, .85]].forEach(([m, t], i) => { tone(midi(m), i === 5 ? .9 : .22, { type: 'square', at: t, vol: .05 }); tone(midi(m - 12), i === 5 ? .9 : .22, { type: 'triangle', at: t, vol: .1 }); }); },
  coin() { tone(midi(83), .08, { type: 'square', vol: .05 }); tone(midi(88), .3, { type: 'square', at: .08, vol: .05 }); },
  step() { noise(.05, { freq: rand(500, 900), vol: .05, q: .8 }); },
  jump() { tone(300, .2, { to: 600, type: 'triangle', vol: .08 }); },
  glide() { noise(.5, { freq: 600, vol: .08, q: .5 }); },
  splash() { noise(.4, { freq: 1300, vol: .12, q: .5 }); },
  whoosh() { noise(.4, { freq: 900, vol: .1, q: .6 }); },
  hee() { for (let i = 0; i < 4; i++) { const f = rand(900, 1200) + i * 40; tone(f, .08, { at: i * .09, to: f * 1.25, vol: .1 }); } },
  cook() { for (let i = 0; i < 8; i++) noise(.08, { at: i * .09, freq: rand(2500, 5000), vol: .06 }); },
  moo() { tone(150, 1.1, { type: 'sawtooth', to: 120, vol: .1, filter: 'lowpass', ff: 520 }); },
  quack() { [0, .2].forEach(t => tone(330, .15, { at: t, to: 260, type: 'square', vol: .08, filter: 'bandpass', ff: 1300, q: 3 })); },
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
  game: { tempo: .28, play(t, i) { const s = [72, 74, 76, 79, 76, 74, 72, 67]; if (i % 2 === 0) tone(midi(s[(i / 2) % 8 | 0]), .4, { when: t, vol: .07, type: 'triangle', bus: 'music' }); if (i % 4 === 0) tone(midi(48 + [0, 5, 7, 5][(i / 4) % 4 | 0]), .5, { when: t, vol: .08, bus: 'music' }); noise(.03, { when: t, freq: 6000, vol: .015, bus: 'music' }); } }
};
export const Music = {
  key: null, timer: null, next: 0, step: 0,
  play(key) {
    if (this.key === key) return;
    this.key = key; clearInterval(this.timer); this.timer = null;
    if (!settings.music || !THEMES[key]) return;
    const a = ac(); if (!a) return;
    this.next = a.currentTime + .1; this.step = 0;
    this.timer = setInterval(() => this.tick(), 60);
  },
  stop() { clearInterval(this.timer); this.timer = null; this.key = null; },
  refresh() { const k = this.key; this.stop(); if (k) this.play(k); },
  tick() {
    if (!AC) return; const th = THEMES[this.key]; if (!th) return;
    while (this.next < AC.currentTime + .25) { th.play(this.next, this.step); this.next += th.tempo; this.step++; }
  }
};
