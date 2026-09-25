"""Synthesises the 22 s soundtrack (120 BPM, beat-synced to the animation) -> assets/music.wav.
Needs numpy + scipy. Hit points mirror the timeline in index.html."""
import numpy as np
from scipy.signal import butter, lfilter
import wave, os

SR = 44100
DUR = 22.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rs = np.random.default_rng(7)
BEAT = 0.5
DROP1, DROP2 = 1.5, 15.0


def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    sig = sig[: N - i]
    L[i:i + len(sig)] += sig * gain * (1 - max(0, pan))
    R[i:i + len(sig)] += sig * gain * (1 + min(0, pan))


def lp(x, fc, order=2):
    b, a = butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low'); return lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), 'high'); return lfilter(b, a, x)


def bp(x, lo, hi):
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)


def hz(m): return 440 * 2 ** ((m - 69) / 12)


# ---------- instruments ----------
def kick(g=1.0):
    n = int(.45 * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    s += .5 * rs.standard_normal(n) * np.exp(-t * 300)
    return np.tanh(s * 1.6) * g


def clap():
    n = int(.3 * SR); t = np.arange(n) / SR
    s = bp(rs.standard_normal(n), 900, 4000)
    e = np.exp(-t * 18) + .6 * np.exp(-((t - .012) % .011) * 400) * (t < .035)
    return s * e * .6


def hat(open_=False):
    n = int((.25 if open_ else .06) * SR); t = np.arange(n) / SR
    return hp(rs.standard_normal(n), 7000) * np.exp(-t * (12 if open_ else 60)) * .35


def pluck(m, d=.35, bright=5000):
    n = int(d * 2.5 * SR); t = np.arange(n) / SR; f = hz(m)
    s = np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) + .12 * np.sin(6 * np.pi * f * t)
    s += .25 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 40)  # marimba-ish click
    return lp(s * env(n, .002, d), bright) * .22


def bass(m, d):
    n = int(d * SR); t = np.arange(n) / SR; f = hz(m)
    saw = 2 * ((f * t) % 1) - 1
    s = lp(saw, 500) + .6 * np.sin(2 * np.pi * f * t)
    e = np.minimum(1, t / .01) * np.minimum(1, (d - t) / .03)
    return np.tanh(s * e * 1.2) * .33


def pad(ms, d):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in ms:
        for det in (-.1, .1):
            f = hz(m + det); s += 2 * ((f * t) % 1) - 1
    s = lp(s, 1600)
    e = np.minimum(1, t / .25) * np.minimum(1, (d - t) / .3)
    return s * e * .035


def whoosh(d=.45, up=True):
    n = int(d * SR); t = np.arange(n) / SR
    x = rs.standard_normal(n); k = t / d if up else 1 - t / d
    out = lp(x, 700) * (1 - k) + bp(x, 1800, 9000) * k * .8
    return out * np.sin(np.pi * t / d) ** 2 * .7


def riser(d):
    n = int(d * SR); t = np.arange(n) / SR
    f = 200 * (8 ** (t / d))
    s = (2 * ((np.cumsum(f) / SR) % 1) - 1) * .15 + hp(rs.standard_normal(n), 2000) * .25 * (t / d)
    return lp(s, 9000) * (t / d) ** 2


def impact():
    n = int(1.8 * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(30 + 90 * np.exp(-t * 10)) / SR) * np.exp(-t * 2.5)
    crash = hp(rs.standard_normal(n), 3000) * np.exp(-t * 2.2) * .35
    return np.tanh(boom * 1.8) * .8 + crash


def stamp():
    n = int(.35 * SR); t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * np.cumsum(70 + 160 * np.exp(-t * 40)) / SR) * np.exp(-t * 16)
    slap = bp(rs.standard_normal(n), 400, 3000) * np.exp(-t * 45)
    return np.tanh((thud + slap * .9) * 1.5) * .8


def flap_click():
    n = int(.02 * SR); t = np.arange(n) / SR
    return bp(rs.standard_normal(n), 2000, 7000) * np.exp(-t * 400) * .25


def ding(m):
    n = int(.8 * SR); t = np.arange(n) / SR; f = hz(m)
    return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 8)) * np.exp(-t * 5) * .22


def tick():
    n = int(.08 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 60) * .25


# ---------- arrangement ----------
# C  G  Am  F  (one bar = 2 s, bars start at DROP1)
CHORDS = [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]]
ROOTS = [36, 43, 45, 41]
ARP = [0, 1, 2, 1, 2, 0, 1, 2]  # 8th notes in a bar
SYNC = [0, .75, 1.5, 2, 2.75, 3.5]  # tropical syncopation (beats)


def chord_at(t):
    i = int(np.floor((t - DROP1) / 2)) % 4; return CHORDS[i], ROOTS[i]


# Intro (0 – 1.5): filtered plucks + ticks on each word
for i, t0 in enumerate([0.0, 0.5, 1.0]):
    add(tick(), t0, 1.0); add(pluck(72 + [0, 2, 4][i], .3, 2500), t0, .9)
add(riser(1.5), 0.0, .8)

drums_on = lambda t: (DROP1 <= t < 14.0) or (DROP2 <= t < 21.0)
t = DROP1
while t < 21.5:
    b = round((t - DROP1) / BEAT)
    ch, root = chord_at(t)
    if drums_on(t):
        add(kick(), t, .9)
        if b % 2 == 1: add(clap(), t, .8)
        add(hat(), t + .25, .7, pan=.3)
        add(hat(), t + .125, .25, pan=-.3)
        add(hat(), t + .375, .25, pan=-.3)
    if b % 4 == 0 and t < 21:
        bar = t
        # bass: syncopated root pattern
        for k, sb in enumerate(SYNC):
            tt = bar + sb * BEAT
            if 14.0 <= tt < DROP2: continue
            add(bass(root + (12 if k == 4 else 0), .2), tt, 1.0)
        add(pad(ch, 2.0), bar, 1.0, pan=0)
        for k in range(8):
            tt = bar + k * .25
            if 14.0 <= tt < DROP2 or tt > 21.2: continue
            add(pluck(ch[ARP[k]] + 12, .25), tt, .8, pan=(-.4 if k % 2 else .4))
    t += BEAT

# Hits synced to visuals
add(impact(), DROP1, .9)
add(whoosh(.4), 2.2, .9)                                          # whip to board
for i in range(160):                                              # split-flap chatter
    tt = 2.7 + i * .018 + rs.random() * .01
    add(flap_click(), tt, .5 + .5 * rs.random(), pan=rs.uniform(-.6, .6))
for i in range(26):                                               # selector ticks (slowing)
    k = i / 26; tt = 5.1 + (1 - (1 - k) ** (1 / 3)) * 1.3
    if tt < 6.4: add(tick(), tt, .6)
add(stamp(), 6.5, 1.0)
add(whoosh(.35), 6.7, .9); add(impact(), 7.0, .45)
for tt in [7.5, 8.0, 8.5, 9.0, 9.5, 10.0]: add(stamp(), tt, 1.0)
add(whoosh(.35), 10.7, .9)
for tt in [11.5, 11.75, 12.0]: add(whoosh(.25), tt - .05, .4)
for i, tt in enumerate([12.5, 12.875, 13.25, 13.625]): add(ding(84 + [0, 4, 7, 12][i]), tt + .15, 1.0)
add(riser(1.0), 14.0, 1.2)
for i in range(16):                                               # snare roll into the logo
    add(clap(), 14.0 + i * (1.0 / 16), .25 + .6 * i / 16)
add(impact(), DROP2, 1.1)
add(whoosh(1.0), 15.25, .6)                                       # plane orbit
add(ding(96), 16.25, .7)                                          # shine sweep

# ---------- mix / master ----------
mix = np.stack([L, R], 1)
t = np.arange(N) / SR
mix *= np.minimum(1, (DUR - t) / 1.2)[:, None]                    # tail fade
mix = np.tanh(mix * 1.1)
mix /= np.abs(mix).max() / 0.92
os.makedirs('assets', exist_ok=True)
with wave.open(os.path.join(os.path.dirname(__file__) or '.', 'assets', 'music.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', mix.shape)
