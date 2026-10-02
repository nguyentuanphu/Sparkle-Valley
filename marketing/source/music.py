# Cheerful ukulele + glockenspiel + shaker jingle, synthesised from scratch (no samples, no licence issues).
# usage: python3 music.py out.wav seconds [seed]
import sys, wave, numpy as np

SR = 44100
out, secs = sys.argv[1], float(sys.argv[2])
rng = np.random.default_rng(int(sys.argv[3]) if len(sys.argv) > 3 else 7)
BPM = 116; beat = 60 / BPM
N = int(SR * secs)
mix = np.zeros((N, 2))

def hz(n): return 440 * 2 ** ((n - 69) / 12)

def pluck(f, dur, amp):  # Karplus-Strong string
    n = int(SR * dur); p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p); outv = np.zeros(n)
    for i in range(n):
        outv[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return outv * amp

def bell(f, dur, amp):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t * 5)
    return amp * env * (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 9) + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 14))

def add(sig, at, pan=0.0):
    i = int(at * SR)
    if i >= N: return
    sig = sig[:N - i]
    mix[i:i + len(sig), 0] += sig * (1 - pan) ; mix[i:i + len(sig), 1] += sig * (1 + pan)

cache = {}
def P(f, d, a):
    k = (round(f, 2), d, a)
    if k not in cache: cache[k] = pluck(f, d, a)
    return cache[k]

# C  G  Am  F  (ukulele voicings, MIDI)
CH = [[60, 64, 67, 72], [59, 62, 67, 71], [57, 60, 64, 69], [57, 60, 65, 69]]
BASS = [48, 43, 45, 41]
MEL = [[76, 79, 81, 79, 76, 74, 72, 74], [74, 71, 74, 79, 77, 76, 74, 71], [72, 76, 81, 79, 76, 72, 76, 79], [77, 76, 74, 72, 74, 76, 77, 79]]
strum = [0, 1, 1.5, 2, 3, 3.5]  # down, down-up, down, down-up
bar = 4 * beat; nb = int(np.ceil(secs / bar))
for b in range(nb):
    c = b % 4; t0 = b * bar
    for k, s in enumerate(strum):
        for j, n in enumerate(CH[c]):
            add(P(hz(n), 1.2, .11 if k % 2 == 0 else .07), t0 + s * beat + j * 0.012, -.25)
    add(P(hz(BASS[c]), 1.6, .32), t0); add(P(hz(BASS[c] + 7), 1.2, .22), t0 + 2 * beat)
    if b >= 1:  # bells join after the first bar
        for k, n in enumerate(MEL[c]):
            if (b // 4) % 2 == 1 and k % 2 == 1: continue
            add(bell(hz(n), .9, .09), t0 + k * beat / 2, .3)
    for k in range(8):  # shaker
        t = np.arange(int(SR * .06)) / SR
        add(rng.uniform(-1, 1, len(t)) * np.exp(-t * 60) * (.05 if k % 2 else .03), t0 + k * beat / 2, .1)
    for k in (0, 2):  # soft kick
        t = np.arange(int(SR * .25)) / SR
        add(np.sin(2 * np.pi * (110 * np.exp(-t * 18) + 45) * t) * np.exp(-t * 9) * .35, t0 + k * beat)

# final chord + fades
add(np.sum([pluck(hz(n), 2.5, .14) for n in CH[0] + [79, 84]], axis=0), max(0, secs - 2.6))
fade_in = int(SR * .3); fade_out = int(SR * 1.5)
mix[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]; mix[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
mix /= np.max(np.abs(mix)) * 1.12
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', out, secs, 's')
