// A microphone recorder that works the same on iPhone, Android and computers.
// It records raw sound and saves it as a small WAV file, so it does not depend on
// MediaRecorder or on which audio formats a browser can play back.

export class MicError extends Error { constructor(code, msg) { super(msg || code); this.code = code; } }

// Explain why the microphone cannot be used, before even asking.
export function micProblem() {
  if (!window.isSecureContext) return 'insecure';
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return 'nomedia';
  return null;
}

let stream = null;
// Must be called from a tap (iPhone only allows sound to start inside a tap).
export async function startRecording({ onLevel, maxMs = 6000, onAuto } = {}) {
  const prob = micProblem(); if (prob) throw new MicError(prob);
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC(); // created inside the tap
  try { await ctx.resume(); } catch (e) { }
  try {
    if (!stream || !stream.active) stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  } catch (e) {
    ctx.close && ctx.close();
    throw new MicError(e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'denied' : e && e.name === 'NotFoundError' ? 'nomic' : 'other', e && e.message);
  }
  const src = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const mute = ctx.createGain(); mute.gain.value = 0; // keep the graph running without echoing to the speaker
  const parts = []; let spoke = false, quietFor = 0, stopped = false, done;
  const finished = new Promise(r => done = r);
  proc.onaudioprocess = e => {
    if (stopped) return;
    const d = e.inputBuffer.getChannelData(0); parts.push(new Float32Array(d));
    let peak = 0; for (let i = 0; i < d.length; i += 4) peak = Math.max(peak, Math.abs(d[i]));
    onLevel && onLevel(Math.min(1, peak * 2.5));
    const secs = d.length / ctx.sampleRate;
    if (peak > .06) { spoke = true; quietFor = 0; } else if (spoke) quietFor += secs;
    // stop by itself after 1.3 seconds of quiet once the person has spoken
    if ((spoke && quietFor > 1.3) || parts.length * secs * 1000 > maxMs) { onAuto && onAuto(); stop(); }
  };
  src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
  const stop = async () => {
    if (stopped) return finished; stopped = true;
    try { src.disconnect(); proc.disconnect(); } catch (e) { }
    const rate = ctx.sampleRate; try { ctx.close(); } catch (e) { }
    done(toWav(trim(parts), rate));
    return finished;
  };
  return { stop, finished };
}
export function releaseMic() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } }

// cut silence from the start and end
function trim(parts) {
  const n = parts.reduce((a, p) => a + p.length, 0), all = new Float32Array(n); let o = 0;
  for (const p of parts) { all.set(p, o); o += p.length; }
  let a = 0, b = n - 1; while (a < n && Math.abs(all[a]) < .02) a++; while (b > a && Math.abs(all[b]) < .02) b--;
  return all.subarray(Math.max(0, a - 2400), Math.min(n, b + 4800));
}
// 16-bit mono WAV at about 22 kHz (small and plays everywhere)
function toWav(data, rate) {
  const target = 22050, step = rate / target, len = Math.floor(data.length / step);
  const buf = new ArrayBuffer(44 + len * 2), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + len * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, target, true); v.setUint32(28, target * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, len * 2, true);
  let peak = .01; for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
  const gain = Math.min(4, .9 / peak); // gently normalise quiet recordings
  for (let i = 0; i < len; i++) { const s = Math.max(-1, Math.min(1, data[Math.floor(i * step)] * gain)); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  return new Blob([buf], { type: 'audio/wav' });
}
