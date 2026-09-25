"""GRG V3 — sound design + score (electronic cinematic, D minor, 120 BPM on a 0.25 s offset grid).
Every cue below mirrors a timestamp in main.js. Output: assets/music.wav"""
import numpy as np
from scipy.signal import butter, lfilter, fftconvolve
import wave, os

SR = 44100; DUR = 24.5; N = int(SR * DUR)
DRY = np.zeros((N, 2)); VERB = np.zeros((N, 2))
rs = np.random.default_rng(21)


def T(d): return np.arange(int(d * SR)) / SR
def noise(d): return rs.standard_normal(int(d * SR))
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def filt(x, kind, f, o=2):
    b, a = butter(o, np.array(f) / (SR / 2), kind); return lfilter(b, a, x)


def add(sig, t0, g=1.0, pan=0.0, verb=0.0):
    i = int(t0 * SR)
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[:N - i] * g; n = len(sig)
    l, r = sig * (1 - max(0, pan)), sig * (1 + min(0, pan))
    DRY[i:i + n, 0] += l; DRY[i:i + n, 1] += r
    if verb: VERB[i:i + n, 0] += l * verb; VERB[i:i + n, 1] += r * verb


# ---------- instruments / sfx ----------
def chime(m1, m2):  # airport "ding-dong"
    out = np.zeros(int(3.0 * SR))
    for j, m in enumerate((m1, m2)):
        t = T(2.4); f = hz(m)
        s = (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 3) + .12 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 5)) * np.exp(-t * 1.6)
        i = int(j * .55 * SR); out[i:i + len(s)] += s
    return out * .12


def ambience(d):
    t = T(d); x = noise(d)
    rumble = filt(x, 'low', 180) * .5
    murmur = filt(noise(d), 'band', [250, 1100]) * (.5 + .5 * np.sin(2 * np.pi * .23 * t) * np.sin(2 * np.pi * .41 * t + 1))
    return (rumble + murmur * .35) * .06


def click(freq=3000, d=.012, g=.3):
    t = T(d); return filt(noise(d), 'band', [freq * .6, min(freq * 1.6, 20000)]) * np.exp(-t * 500) * g


def flap():  # mechanical split-flap
    t = T(.03); s = filt(noise(.03), 'band', [1200, 6000]) * np.exp(-t * 260)
    return (s + np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 400) * .3) * .22


def ui(f=2400):  # glassy UI tick
    t = T(.09); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 70) + np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 110) * .4) * .18


def confirm():
    return np.concatenate([ui(1760)[:int(.05 * SR)], ui(2640)]) * 1.1


def bass_hit(g=1.0):  # clean, deep hit for key phrases
    t = T(2.2)
    sub = np.sin(2 * np.pi * np.cumsum(40 + 70 * np.exp(-t * 14)) / SR) * np.exp(-t * 2.6) + .35 * np.sin(2 * np.pi * np.cumsum(110 + 90 * np.exp(-t * 20)) / SR) * np.exp(-t * 7)
    click_ = filt(noise(.02), 'high', 2000) * np.exp(-T(.02) * 300) * .6
    s = np.tanh(sub * 1.6) * .9; s[:len(click_)] += click_
    return s * g


def whoosh(d, up=True, g=.5):
    t = T(d); k = t / d if up else 1 - t / d; x = noise(d)
    s = filt(x, 'low', 600) * (1 - k) + filt(x, 'band', [1500, 9000]) * k
    return s * np.sin(np.pi * t / d) ** 1.5 * g


def deep_whoosh(d=.9):
    t = T(d); x = noise(d); s = filt(x, 'low', 300) * 1.5 + filt(x, 'band', [400, 2500]) * .4
    return s * np.sin(np.pi * t / d) ** 2 * .6


def reverse_rise(d):  # reversed noise swell into a hit
    t = T(d); s = filt(noise(d), 'band', [600, 8000]) * (t / d) ** 3
    return s * .35


def riser(d, f0=180, mult=6):
    t = T(d); f = f0 * mult ** (t / d)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * .18 + filt(noise(d), 'high', 3000) * .18 * (t / d)) * (t / d) ** 2


def stamp():
    t = T(.4); thud = np.sin(2 * np.pi * np.cumsum(60 + 120 * np.exp(-t * 35)) / SR) * np.exp(-t * 14)
    slap = filt(noise(.4), 'band', [300, 3500]) * np.exp(-t * 55)
    return np.tanh((thud + slap * 1.2) * 1.8) * .55


def jet(d=1.4):  # plane passing (doppler-ish)
    t = T(d); x = noise(d); out = np.zeros_like(x); seg = 2205
    for i in range(0, len(x), seg):
        k = i / len(x); fc = 1800 - 1300 * k
        out[i:i + seg] = filt(x[max(0, i - 4000):i + seg], 'band', [fc * .4, fc])[-len(out[i:i + seg]):]
    env = np.exp(-((t - d * .35) / (d * .3)) ** 2)
    return (out * .9 + filt(noise(d), 'low', 120) * 1.2) * env * .45


def kick(g=1.0):
    t = T(.35); s = np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-t * 32)) / SR) * np.exp(-t * 8)
    return np.tanh(s * 1.8) * .7 * g


def clap():
    t = T(.25); return filt(noise(.25), 'band', [1000, 5500]) * (np.exp(-t * 20) + .5 * (t < .025)) * .28


def hat(g=1.0):
    t = T(.04); return filt(noise(.04), 'high', 8000) * np.exp(-t * 90) * .16 * g


def pluck(m, d=.18, cutoff=4000):
    t = T(d * 3); f = hz(m)
    s = (2 * ((f * t) % 1) - 1) * .6 + np.sin(2 * np.pi * f * t)
    return filt(s * np.exp(-t / d) * np.minimum(1, t / .003), 'low', cutoff) * .09


def subbass(m, d):
    t = T(d); f = hz(m); return np.tanh(np.sin(2 * np.pi * f * t) * 1.5) * np.minimum(1, t / .01) * np.minimum(1, (d - t) / .03) * .3


def pad(ms, d, cut=2000, g=1.0):
    t = T(d); s = sum(2 * ((hz(m + det) * t) % 1) - 1 for m in ms for det in (-.07, 0, .07))
    return filt(s, 'low', cut) * np.minimum(1, t / .6) * np.minimum(1, (d - t) / .6) * .018 * g


def shimmer(ms):
    out = np.zeros(int(3.5 * SR))
    for j, m in enumerate(ms):
        t = T(3.0); f = hz(m); s = np.sin(2 * np.pi * f * t) * np.exp(-t * 1.5) * .06
        i = int(j * .06 * SR); out[i:i + len(s)] += s
    return out


# ---------- arrangement ----------
G0 = .25; B = .5  # beat grid: 0.25 + n*0.5
CH = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]   # Dm Bb F C
RT = [38, 34, 41, 36]
def chord(t): return int(((t - G0) // 2.0) % 4)

# 0 – 2.5  hook
add(ambience(3.2), 0, 1.0)
add(chime(76, 72), .02, 1.0, verb=.6)
for tt in rs.uniform(.05, .7, 7): add(click(3500, g=.12), tt, pan=rs.uniform(-.5, .5))
for i in range(5):  # cinematic flashes
    t0 = .75 + i * .25; add(whoosh(.22, g=.35), t0 - .05, pan=(-.4 if i % 2 else .4), verb=.3); add(click(5000, g=.25), t0); add(kick(.35), t0)
add(reverse_rise(1.2), .8, 1.0, verb=.4)
add(bass_hit(1.0), 2.0, verb=.5); add(deep_whoosh(1.0), 1.9, 1.0, verb=.3)
# 2.5 slats + board
for i in range(16): add(flap(), 2.5 + i * .012 + .1, .7, pan=(i / 8 - 1) * .5)
EV = [2.85, 3.07, 3.29, 3.51, 3.73, 4.0]
for j, ev in enumerate(EV):
    for r in range(5):
        for c in range(8 if j else 13):
            add(flap(), ev + c * .018 + r * .025 + .045, .35 + .2 * rs.random(), pan=(c / 6 - .6) * .6)
add(ui(1900), 2.72, .8, verb=.2); add(bass_hit(.45), 4.0, verb=.4); add(ui(2200), 4.55, .6, verb=.2)
# score begins (mysterious, grows)
t0 = G0 + 2.0 * 1  # 2.25
while t0 < 24.0:
    ci = chord(t0 + .01)
    if not (8.25 <= t0 < 8.45) and not (12.75 <= t0 < 13.0):
        add(pad(CH[ci], 2.1, cut=900 if t0 < 5.5 else 1800 if t0 < 20.5 else 2400), t0, 1.0, verb=.5)
    for s16 in range(16):
        tt = t0 + s16 * .125
        if tt < 2.5 or tt >= 24.0 or 8.25 <= tt < 8.45 or 12.75 <= tt < 13.25: continue
        cut = 700 + 5000 * min(1, (tt - 2.5) / 7) if tt < 13 else (3200 if tt < 20.5 else 2200)
        m = CH[ci][[0, 1, 2, 1][s16 % 4]] + 12 + (12 if s16 % 8 == 6 else 0)
        add(pluck(m, .14, cut), tt, .8 if s16 % 4 == 0 else .55, pan=(.3 if s16 % 2 else -.3), verb=.35)
    t0 += 2.0

def groove(a, b, kick_g=1.0, claps=True, bass=True, hats=True):
    tb = G0 + np.ceil((a - G0) / B) * B
    while tb < b - 1e-6:
        n = int(round((tb - G0) / B)); ci = chord(tb + .01)
        add(kick(kick_g), tb)
        if claps and n % 2: add(clap(), tb, verb=.3)
        if hats:
            for q in range(4): add(hat(1 if q % 2 else .5), tb + q * .125, pan=.25)
        if bass: add(subbass(RT[ci], .2), tb + .25, 1.0)
        tb += B

groove(5.5, 8.25, kick_g=.6, claps=False, bass=True, hats=False)       # half energy under passport
for tt in np.arange(5.75, 8.25, 1.0): add(kick(.4), tt + .5)
groove(9.75, 12.5)                                                     # journey: full
groove(13.75, 20.5, kick_g=.8, claps=True)                             # brand: elegant drive
groove(20.5, 22.5, kick_g=.5, claps=False, bass=False)

# 5.5 – 9.75 passport + hero
add(click(2500, .02, .4), 5.5)
for s in [5.75, 6.25, 6.75, 7.25]:
    add(stamp(), s, 1.0, verb=.25); add(whoosh(.3, g=.35), s + .1, pan=.3, verb=.3); add(click(4500, g=.2), s + .42)
add(ui(2000), 7.5, .7); add(ui(2300), 7.62, .7)
add(reverse_rise(.6), 7.85, .8)
add(bass_hit(1.1), 8.45, verb=.7); add(pad([62, 65, 69, 74], 1.6, cut=3000, g=2.2), 8.45, verb=.8)
add(riser(.4, 300, 8), 9.35, 1.0); add(deep_whoosh(.6), 9.35, 1.0)
add(jet(1.5), 9.7, 1.0, verb=.3)
for i in range(1, 8): add(click(3000, g=.18), 9.75 + i * .375, pan=(-.3 if i % 2 else .3))
add(whoosh(.35, g=.3), 11.6, pan=-.3)
# 12.45 – 13.75  "É sobre / VIVER."
add(riser(.35, 200, 5), 12.4, .9)
add(ui(1700), 12.75, .7, verb=.4)
add(reverse_rise(.25), 12.76, 1.0)
add(bass_hit(1.35), 13.0, verb=.8); add(pad([50, 57, 62, 65], 2.0, cut=2400, g=2.5), 13.0, verb=.9)
# 13.75 – 17  GRG
add(whoosh(.5, g=.35), 13.7, verb=.4)
add(shimmer([81, 86, 88, 93]), 13.95, 1.0, verb=.6)
add(ui(2100), 14.15, .6); add(ui(2500), 14.5, .6)
for i in range(6): add(ui(2000 + i * 140), 14.85 + i * .2, .9, pan=(-.3 if i % 2 == 0 else .3), verb=.2)
add(whoosh(.4, g=.3), 16.8, verb=.3)
# 17 – 20.5  trip confirmed
for i in range(4): add(confirm(), 17.45 + i * .25 + .3, 1.0, verb=.25)
t = T(1.4); add(np.sin(2 * np.pi * np.cumsum(900 + 700 * t / 1.4) / SR) * np.sin(np.pi * t / 1.4) * .03, 17.2, verb=.5)
add(ui(1800), 19.05, .6)
add(reverse_rise(.4), 19.36, .8); add(bass_hit(.9), 19.75, verb=.6)
# 20.5 – end  resolve to D major, brand shimmer
add(pad([50, 54, 57, 62], 4.0, cut=2600, g=2.0), 20.5, verb=.8)
add(shimmer([74, 78, 81, 86, 90]), 20.7, 1.2, verb=.7)
add(whoosh(.6, g=.2), 21.5, pan=.3, verb=.5)
add(ui(2200), 22.35, .7, verb=.3)
add(chime(76, 72), 23.0, .55, verb=.8)

# ---------- master ----------
ir_t = T(2.6); ir = rs.standard_normal((len(ir_t), 2)) * np.exp(-ir_t * 2.4)[:, None]
ir[:, 0] = filt(ir[:, 0], 'low', 6000); ir[:, 1] = filt(ir[:, 1], 'low', 6000)
wet = np.stack([fftconvolve(VERB[:, c], ir[:, c])[:N] for c in range(2)], 1) * .08
mix = DRY + wet
# total silence beat before the hero lines (ducks everything)
for a, b in [(8.28, 8.45), (12.8, 13.0)]:
    i0, i1 = int(a * SR), int(b * SR); ramp = np.linspace(1, .05, int(.03 * SR))
    mix[i0:i0 + len(ramp)] *= ramp[:, None]; mix[i0 + len(ramp):i1] *= .05
tt = np.arange(N) / SR
mix *= np.minimum(1, (DUR - tt) / 1.2)[:, None]
mix = np.tanh(mix * 1.3); mix /= np.abs(mix).max() / .93
with wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'music.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
