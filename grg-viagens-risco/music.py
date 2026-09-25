"""Lo-fi soundtrack for "um risco" (80 BPM, one bar = 3 s = one drawing) -> assets/music.wav.
Soft felt piano, brushed drums, vinyl crackle and a pencil-on-paper layer that follows the line."""
import numpy as np
from scipy.signal import butter, lfilter
import wave, os

SR = 44100; DUR = 24.0; N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rs = np.random.default_rng(3)
BEAT = 0.75


def add(sig, t0, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    sig = sig[:N - i]
    L[i:i + len(sig)] += sig * g * (1 - max(0, pan)); R[i:i + len(sig)] += sig * g * (1 + min(0, pan))


def filt(x, kind, f):
    b, a = butter(2, np.array(f) / (SR / 2), kind); return lfilter(b, a, x)


def hz(m): return 440 * 2 ** ((m - 69) / 12)


def piano(m, d=2.8, vel=1.0):
    n = int((d + 1.5) * SR); t = np.arange(n) / SR; f = hz(m) * (1 + rs.normal(0, .0007))
    s = sum(a * np.sin(2 * np.pi * f * h * t) * np.exp(-t * (1.1 + h * .9)) for h, a in [(1, 1), (2, .45), (3, .18), (4, .08)])
    s *= np.minimum(1, t / .006) * np.minimum(1, np.maximum(0, (d + 1.5 - t)) / 1.2)
    return filt(s, 'low', 2200) * .16 * vel


def kick():
    n = int(.35 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(48 + 70 * np.exp(-t * 30)) / SR) * np.exp(-t * 9) * .55


def rim():
    n = int(.15 * SR); t = np.arange(n) / SR
    return (filt(rs.standard_normal(n), 'band', [1500, 5000]) * np.exp(-t * 45) + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 60) * .4) * .3


def brush():
    n = int(.2 * SR); t = np.arange(n) / SR
    return filt(rs.standard_normal(n), 'high', 5000) * np.exp(-t * 25) * np.minimum(1, t / .02) * .12


def bell(m):
    n = int(3.5 * SR); t = np.arange(n) / SR; f = hz(m)
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 2) + .25 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 4)) * np.exp(-t * 1.2) * .13


def pencil(d):
    """graphite on paper: band-passed noise with a scribbly amplitude."""
    n = int(d * SR); t = np.arange(n) / SR
    x = filt(rs.standard_normal(n), 'band', [2500, 9000])
    am = .55 + .45 * np.abs(np.sin(2 * np.pi * 3.3 * t + np.sin(2 * np.pi * .7 * t) * 2))
    e = np.minimum(1, t / .08) * np.minimum(1, (d - t) / .15)
    return x * am * e * .09


# Fmaj7  Em7  Dm7  Cmaj7  — one chord per bar (3 s)
CH = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
BASS = [41, 40, 38, 36]
MEL = [[76, None, 72, 74], [71, None, 67, None], [69, 72, None, 77], [76, None, 74, 71]]
for bar in range(8):
    t0 = bar * 3.0; i = bar % 4
    if t0 >= 23: break
    for k, m in enumerate(CH[i]): add(piano(m, 2.9, .8), t0 + k * .025, pan=(k - 1.5) * .15)   # strum-ish roll
    add(piano(BASS[i], 2.9, 1.2), t0)
    if 1 <= bar <= 6 and bar != 5:  # melody rests while the circle closes
        for k, m in enumerate(MEL[i]):
            if m: add(piano(m, .9, .55), t0 + k * BEAT + .02 * rs.random(), pan=.2)
    # drums (bars 1-4 and 6-7)
    if bar in (1, 2, 3, 4, 6, 7):
        for b in range(4):
            tb = t0 + b * BEAT
            if b in (0,): add(kick(), tb)
            if b == 2: add(kick(), tb + BEAT * .5, .7)
            if b in (1, 3): add(rim(), tb + .01)
            add(brush(), tb + BEAT * .5, 1, pan=.3); add(brush(), tb + BEAT * .83, .5, pan=-.3)

add(piano(72, 4, .6), 21.0); add(piano(64, 4, .5), 21.0)
# pencil follows each drawing segment in index.html
for t0, t1 in [(.7, 3.0), (3.0, 5.7), (6.0, 8.7), (9.0, 11.8), (12.0, 14.5), (14.5, 17.0)]:
    add(pencil(t1 - t0), t0, 1.0)
add(pencil(.6), 7.4, .6)                # sun rays
add(bell(84), 16.8, 1.0); add(bell(91), 17.1, .6)   # logo appears
# vinyl crackle bed
crk = np.zeros(N); idx = rs.integers(0, N, 900); crk[idx] = rs.uniform(-1, 1, 900)
crk = filt(crk, 'band', [1000, 8000]) * 1.2 + filt(rs.standard_normal(N), 'low', 400) * .01
L += crk; R += crk

mix = np.stack([L, R], 1); t = np.arange(N) / SR
mix *= (np.minimum(1, t / .3) * np.minimum(1, (DUR - t) / 1.5))[:, None]
mix = np.tanh(mix * 1.2); mix /= np.abs(mix).max() / .9
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'music.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
