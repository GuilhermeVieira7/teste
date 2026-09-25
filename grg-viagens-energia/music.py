"""Energetic tropical-house soundtrack (120 BPM, D major) synced to index.html -> assets/music.wav"""
import numpy as np
from scipy.signal import butter, lfilter
import wave, os

SR = 44100; DUR = 25.0; N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rs = np.random.default_rng(11)
B = 0.5


def add(sig, t0, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    sig = sig[:N - i]
    L[i:i + len(sig)] += sig * g * (1 - max(0, pan)); R[i:i + len(sig)] += sig * g * (1 + min(0, pan))


def filt(x, kind, f, o=2):
    b, a = butter(o, np.array(f) / (SR / 2), kind); return lfilter(b, a, x)


def hz(m): return 440 * 2 ** ((m - 69) / 12)
def T(d): return np.arange(int(d * SR)) / SR
def noise(d): return rs.standard_normal(int(d * SR))


def kick():
    t = T(.4); s = np.sin(2 * np.pi * np.cumsum(48 + 130 * np.exp(-t * 30)) / SR) * np.exp(-t * 7)
    return np.tanh(s * 2) * .9


def clap():
    t = T(.3); e = np.exp(-t * 16) + .7 * (t < .03) * np.exp(-((t % .01) * 300))
    return filt(noise(.3), 'band', [900, 5000]) * e * .5


def hat(o=False):
    t = T(.3 if o else .05); return filt(noise(len(t) / SR), 'high', 7500) * np.exp(-t * (10 if o else 70)) * .3


def conga(m):
    t = T(.25); f = hz(m); return np.sin(2 * np.pi * f * t * (1 + .3 * np.exp(-t * 40))) * np.exp(-t * 16) * .35


def bass(m, d):
    t = T(d); f = hz(m); s = filt(2 * ((f * t) % 1) - 1, 'low', 600) + .7 * np.sin(2 * np.pi * f * t)
    return np.tanh(s * np.minimum(1, t / .005) * np.minimum(1, (d - t) / .02) * 1.4) * .32


def pluck(m, d=.22, g=.18):
    t = T(d * 3); f = hz(m)
    s = sum(a * np.sin(2 * np.pi * f * h * t) for h, a in [(1, 1), (2, .5), (3, .25), (4, .12)]) * np.exp(-t / d)
    return filt(s, 'low', 6000) * g


def lead(m, d=.2):
    t = T(d + .15); f = hz(m)
    s = (2 * ((f * t) % 1) - 1) + (2 * ((f * 1.006 * t) % 1) - 1)
    return filt(s, 'low', 3500) * np.exp(-t * 6) * np.minimum(1, t / .005) * .07


def pad(ms, d):
    t = T(d); s = sum(2 * ((hz(m + det) * t) % 1) - 1 for m in ms for det in (-.08, .08))
    return filt(s, 'low', 1800) * np.minimum(1, t / .2) * np.minimum(1, (d - t) / .2) * .03


def impact():
    t = T(2.0); boom = np.sin(2 * np.pi * np.cumsum(30 + 100 * np.exp(-t * 9)) / SR) * np.exp(-t * 2.2)
    return np.tanh(boom * 2) * .8 + filt(noise(2.0), 'high', 3000) * np.exp(-t * 2) * .35


def whoosh(d=.35):
    t = T(d); x = noise(d); k = t / d
    return (filt(x, 'low', 900) * (1 - k) + filt(x, 'band', [1800, 9000]) * k) * np.sin(np.pi * k) ** 2 * .6


def riser(d):
    t = T(d); f = 250 * 6 ** (t / d)
    return filt((2 * ((np.cumsum(f) / SR) % 1) - 1) * .12 + filt(noise(d), 'high', 2500) * .3 * (t / d), 'low', 10000) * (t / d) ** 2


def beep(f):
    t = T(.18); return np.sin(2 * np.pi * f * t) * np.exp(-t * 14) * .35


def slam():
    t = T(.35); th = np.sin(2 * np.pi * np.cumsum(70 + 180 * np.exp(-t * 40)) / SR) * np.exp(-t * 14)
    return np.tanh((th + filt(noise(.35), 'band', [500, 4000]) * np.exp(-t * 40)) * 1.6) * .7


def bubble(f=700):
    t = T(.12); return np.sin(2 * np.pi * np.cumsum(f + 900 * t / .12) / SR) * np.exp(-t * 30) * .45


def ding(m):
    t = T(.8); f = hz(m); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 8)) * np.exp(-t * 5) * .2


# D  A  Bm  G  (bar = 2 s, starting at the 1.5 s drop)
CH = [[62, 66, 69], [61, 64, 69], [62, 66, 71], [62, 67, 71]]
RT = [38, 45, 47, 43]
HOOK = [[74, 76, 78, 81, 78, None, 76, 74], [73, 76, None, 76, 78, 76, 73, None],
        [74, None, 78, 81, 83, 81, 78, None], [79, 78, 76, None, 74, 76, 74, None]]
SYNC = [0, .75, 1.5, 2, 2.75, 3.5]
full = lambda t: (1.5 <= t < 10.0) or (11.0 <= t < 24.3)

for i, t0 in enumerate([0, .5, 1.0]): add(beep([660, 780, 990][i]), t0); add(kick(), t0, .5)
add(riser(1.5), 0, .9)

bar = 0; t0 = 1.5
while t0 < 24.3:
    ci = bar % 4
    for b in range(4):
        tb = t0 + b * B
        if not full(tb): continue
        breakdown = 18.0 <= tb < 22.0          # lighter under the chat
        add(kick(), tb, .75 if breakdown else 1.0)
        if b % 2: add(clap(), tb, .7)
        add(hat(True), tb + .25, .5, .3)
        for s16 in range(4): add(hat(), tb + s16 * .125, .25 + .15 * (s16 % 2), -.3)
        if not breakdown:
            add(conga(67 if b % 2 else 72), tb + .375, 1, .4); add(conga(64), tb + .125, .7, .4)
    for k, sb in enumerate(SYNC):
        tt = t0 + sb * B
        if full(tt): add(bass(RT[ci] + (12 if k == 4 else 0), .2), tt)
    if t0 < 24: add(pad(CH[ci], 2.0), t0)
    for k in range(8):
        tt = t0 + k * .25
        if tt < 24.3: add(pluck(CH[ci][k % 3] + 12), tt, .8 if full(tt) else .45, (-.35 if k % 2 else .35))
        m = HOOK[ci][k]
        if m and full(tt) and not (18.0 <= tt < 22.0): add(lead(m), tt, 1, .15)
    bar += 1; t0 += 2.0

# hits
add(impact(), 1.5, 1.0); add(whoosh(.3), 2.2, .8)
for k in range(6): add(whoosh(.25), 2.5 + k - .2, .7, (-.5 if k % 2 else .5)); add(slam(), 2.55 + k, .5)
for k in range(6): add(clap(), 8.5 + k * .25, .6); add(slam(), 8.5 + k * .25, .4)
add(riser(1.5), 8.5, .9)
for k, tt in enumerate([10.0, 10.25, 10.5]): add(slam(), tt, .8); add(beep([520, 620, 740][k]), tt, .6)
add(riser(1.0), 10.0, 1.0)
add(impact(), 11.0, 1.1); add(slam(), 11.3, .7)
for k in range(4): add(slam(), 12.0 + k * .5, .9); add(ding(81 + [0, 4, 7, 12][k]), 12.05 + k * .5, .8)
add(whoosh(.3), 14.3, .8); add(slam(), 14.5, .8); add(slam(), 14.75, .8)
for k in range(5): add(whoosh(.3), 15.0 + k * .35 - .05, .5, (-.5 if k % 2 else .5)); add(bubble(500), 15.25 + k * .35, .6)
add(impact(), 17.0, .8); add(slam(), 17.0, 1.0)
for k in range(3): add(bubble(900 + k * 150), 17.25 + k * .25, .8)
add(whoosh(.3), 17.8, .8)
for tt in [18.25, 19.5, 20.4, 21.0]: add(bubble(800), tt, 1.0)
for k in range(10): add(filt(noise(.02), 'band', [2000, 6000]) * .12, 18.9 + k * .06)
add(ding(93), 21.5, .8)
add(riser(1.0), 21.0, .8); add(impact(), 22.0, 1.1)
for k in range(2): add(slam(), 22.25 + k * .25, .7)

mix = np.stack([L, R], 1); t = np.arange(N) / SR
mix *= np.minimum(1, (DUR - t) / .8)[:, None]
mix = np.tanh(mix * 1.15); mix /= np.abs(mix).max() / .92
with wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'music.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
