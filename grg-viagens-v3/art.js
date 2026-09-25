/* GRG V3 — shared utilities + cinematic destination art.
   Every "shot" is a full-bleed 1080x1920 painting drawn procedurally with layered
   depth, haze and light, graded towards the GRG blues. k = 0..1 progress inside the shot. */
const W = 1080, H = 1920;
let ctx; // current drawing context (swapped when painting into offscreen buffers)

const C = {
  deep: '#020816', navy: '#051a4a', royal: '#0b4db3', electric: '#1f6bff', cyan: '#3ee8ff',
  ice: '#cfe6ff', white: '#ffffff',
};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
// professional easing (cubic-bezier-ish families)
const eOut = k => 1 - Math.pow(1 - k, 3);
const eOut5 = k => 1 - Math.pow(1 - k, 5);
const eIn = k => k * k * k;
const eInOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const eExpo = k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * k);
const eInExpo = k => k <= 0 ? 0 : Math.pow(2, 10 * k - 10);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function buffer() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
function paint(buf, fn) { const prev = ctx; ctx = buf.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.clearRect(0, 0, W, H); fn(); ctx = prev; return buf; }

function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function vgrad(y0, y1, stops) { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach((s, i) => Array.isArray(s) ? g.addColorStop(s[0], s[1]) : g.addColorStop(i / (stops.length - 1), s)); return g; }
function fill(style) { ctx.fillStyle = style; ctx.fillRect(-200, -200, W + 400, H + 400); }
function glow(x, y, r, col, a = 1) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); }
function haze(y, h, col, a = 1) { const g = ctx.createLinearGradient(0, y - h, 0, y + h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(-200, y - h, W + 400, 2 * h); ctx.restore(); }
function bokeh(seed, n, t, col, rmin, rmax, a = .12, drift = 12) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H, rr = rmin + r() * (rmax - rmin), ph = r() * 7;
    ctx.save(); ctx.globalAlpha = a * (.5 + .5 * Math.sin(t * 1.3 + ph)); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + Math.sin(t * .4 + ph) * drift, y - t * drift, rr, 0, 7); ctx.fill(); ctx.restore(); }
}
// camera: apply a push/pan around a focus point
function cam(k, s0, s1, fx = W / 2, fy = H / 2, dx = 0, dy = 0) { const s = lerp(s0, s1, k); ctx.translate(fx + dx * k, fy + dy * k); ctx.scale(s, s); ctx.translate(-fx, -fy); }

// ---------- silhouettes ----------
function airliner(x, y, len, ang, col, lights = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); const s = len / 1000; ctx.scale(s, s); ctx.fillStyle = col;
  ctx.beginPath(); // fuselage
  ctx.moveTo(500, 8); ctx.bezierCurveTo(500, -30, 470, -42, 420, -44); ctx.lineTo(-330, -44); ctx.bezierCurveTo(-400, -44, -450, -60, -500, -70);
  ctx.lineTo(-505, -52); ctx.bezierCurveTo(-470, 0, -420, 30, -330, 36); ctx.lineTo(420, 36); ctx.bezierCurveTo(470, 36, 500, 30, 500, 8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-340, -44); ctx.lineTo(-450, -230); ctx.lineTo(-395, -230); ctx.lineTo(-250, -44); ctx.fill(); // fin
  ctx.beginPath(); ctx.moveTo(-400, -30); ctx.lineTo(-500, -10); ctx.lineTo(-470, -2); ctx.lineTo(-360, -10); ctx.fill(); // stabiliser
  ctx.beginPath(); ctx.moveTo(60, 10); ctx.lineTo(-150, 110); ctx.lineTo(-110, 118); ctx.lineTo(130, 20); ctx.fill(); // wing (far side)
  ctx.beginPath(); ctx.ellipse(50, 62, 70, 26, 0, 0, 7); ctx.fill(); // engine
  if (lights) { glow(495, 10, 70, 'rgba(255,255,255,.9)', lights); glow(-150, 112, 40, 'rgba(255,80,80,.9)', lights * .8); }
  ctx.restore();
}
function eiffel(x, y, h, col, t = 0, sparkle = 0) {
  ctx.save(); ctx.translate(x, y); const s = h / 1000; ctx.scale(s, s);
  const shape = () => { ctx.beginPath(); ctx.moveTo(-230, 0); ctx.quadraticCurveTo(-110, -280, -62, -560); ctx.lineTo(-34, -880); ctx.lineTo(-10, -965); ctx.lineTo(0, -1000); ctx.lineTo(10, -965); ctx.lineTo(34, -880); ctx.lineTo(62, -560); ctx.quadraticCurveTo(110, -280, 230, 0);
    ctx.lineTo(150, 0); ctx.quadraticCurveTo(0, -250, -150, 0); ctx.closePath(); };
  shape(); ctx.fillStyle = col; ctx.fill();
  ctx.fillRect(-140, -300, 280, 22); ctx.fillRect(-80, -575, 160, 18); ctx.fillRect(-40, -880, 80, 14);
  // lattice hint
  ctx.save(); shape(); ctx.clip(); ctx.strokeStyle = 'rgba(120,170,255,.12)'; ctx.lineWidth = 3;
  for (let i = -1200; i < 1200; i += 36) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 700, -1000); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 700, -1000); ctx.stroke(); }
  ctx.restore();
  if (sparkle) { const r = rng(Math.floor(t * 14)); for (let i = 0; i < 40; i++) { const yy = -r() * 950, w = 230 * (1 - Math.min(1, -yy / 1000)) * .9 + 10; glow((r() * 2 - 1) * w * .6, yy, 16, 'rgba(255,255,255,1)', sparkle * r()); } }
  glow(0, -1000, 60, 'rgba(255,240,200,.9)', .8);
  ctx.restore();
}
function colosseum(x, y, w, col, sky) {
  ctx.save(); ctx.translate(x, y); const h = w * .42;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h * .78);
  ctx.lineTo(w * .12, -h * .8); ctx.lineTo(w * .16, -h); ctx.lineTo(w * .3, -h); ctx.lineTo(w * .34, -h * .9); ctx.lineTo(w * .42, -h * .84); ctx.lineTo(w * .46, -h * .6); ctx.lineTo(w / 2, -h * .5); ctx.lineTo(w / 2, 0); ctx.fill();
  // arches (sky showing through), 3 tiers
  ctx.fillStyle = sky; const tiers = [[-h * .08, -h * .27, 1], [-h * .33, -h * .52, 1], [-h * .58, -h * .74, .8]];
  tiers.forEach(([y0, y1, lim], ti) => { const n = 13, aw = w / n * .52; for (let i = 0; i < n; i++) { const ax = -w / 2 + (i + .5) * w / n; if (ti === 2 && ax > w * .42) continue; if (ti === 1 && ax > w * .47) continue;
    ctx.beginPath(); ctx.moveTo(ax - aw / 2, y0); ctx.lineTo(ax - aw / 2, y1 + aw / 2); ctx.arc(ax, y1 + aw / 2, aw / 2, Math.PI, 0); ctx.lineTo(ax + aw / 2, y0); ctx.fill(); } });
  ctx.fillStyle = col; for (const yy of [-h * .08, -h * .33, -h * .58]) ctx.fillRect(-w / 2, yy - 4, w * .96, 10);
  ctx.restore();
}
function umbrellaPine(x, y, s, col) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -200, -20, -380); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-5, -300); ctx.lineTo(60, -390); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(10, -420, 190, 55, 0, 0, 7); ctx.ellipse(-60, -400, 110, 40, 0, 0, 7); ctx.ellipse(90, -400, 120, 40, 0, 0, 7); ctx.fill(); ctx.restore(); }
function palmSil(x, y, s, col, t) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 1.4) * .02); ctx.strokeStyle = col; ctx.lineWidth = 26; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(40, -450, 130, -900); ctx.stroke(); ctx.fillStyle = col;
  for (let i = 0; i < 8; i++) { ctx.save(); ctx.translate(130, -900); ctx.rotate(-3.1 + i * .78 + Math.sin(t * 2 + i) * .03); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(120, -40, 260, 30); ctx.quadraticCurveTo(120, 0, 0, 14); ctx.fill(); ctx.restore(); }
  ctx.restore(); }

// ---------- DESTINATIONS (used in hook flashes, stamp micro-scenes) ----------
function shotParis(t, k) {
  fill(vgrad(0, H, [[0, '#040d2b'], [.45, '#0d2f6e'], [.72, '#3a64a8'], [.8, '#c89a86'], [1, '#1a1f3a']]));
  glow(560, 1420, 700, 'rgba(255,190,140,.25)');
  ctx.save(); cam(k, 1.02, 1.1, 540, 1400, 0, 30);
  bokeh(3, 30, t, '#bcd6ff', 2, 5, .6, 2);
  eiffel(560, 1560, 1250, '#030a1f', t, .9);
  haze(1480, 140, 'rgba(90,130,200,.35)');
  const r = rng(4); let bx = -60; ctx.fillStyle = '#040a1c';
  while (bx < W + 60) { const bw = 90 + r() * 110, bh = 120 + r() * 160; ctx.fillRect(bx, 1560 - bh + 200, bw, bh + 400); bx += bw + 4; }
  const r2 = rng(9); for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,200,130,${.35 + r2() * .5})`; ctx.fillRect(r2() * W, 1640 + r2() * 250, 7, 11); }
  ctx.restore();
}
function shotMaldivas(t, k) { // aerial lagoon
  ctx.save(); cam(k, 1.05, 1.14, 540, 960, -20, -40); ctx.translate(540, 960); ctx.rotate(-.35); ctx.translate(-540, -960);
  fill('#06306e');
  const lag = (cx, cy, rx, ry, col) => { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); g.addColorStop(0, col[0]); g.addColorStop(.7, col[1]); g.addColorStop(1, 'rgba(6,48,110,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill(); };
  lag(540, 900, 900, 520, ['#6ff3ea', '#1bb6d0']); lag(560, 880, 520, 260, ['#e9fff8', '#7de9df']);
  ctx.fillStyle = '#f3ecd9'; ctx.beginPath(); ctx.ellipse(560, 880, 300, 120, 0, 0, 7); ctx.fill();
  for (let i = 0; i < 40; i++) { const r = rng(i + 200); ctx.fillStyle = r() > .5 ? '#1f6e4c' : '#2b8a5c'; ctx.beginPath(); ctx.arc(560 + (r() - .5) * 400, 870 + (r() - .5) * 120, 18 + r() * 22, 0, 7); ctx.fill(); }
  ctx.strokeStyle = '#d8cdb5'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(560, 960); ctx.bezierCurveTo(560, 1200, 300, 1250, 150, 1450); ctx.stroke();
  for (let i = 0; i < 16; i++) { const q = i / 15, x = lerp(560, 150, q) + Math.sin(q * 3) * 60, y = lerp(1000, 1450, q); for (const sd of [-1, 1]) { ctx.fillStyle = 'rgba(0,30,60,.3)'; ctx.fillRect(x + sd * 34 - 13 + 6, y - 9 + 7, 26, 18); ctx.fillStyle = '#6b4a36'; ctx.fillRect(x + sd * 34 - 13, y - 9, 26, 18); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + sd * 34 - 13, y - 9, 26, 3); } }
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; for (let i = 0; i < 20; i++) { const r = rng(i); ctx.beginPath(); const y = r() * H; for (let x = -100; x < W + 100; x += 20) ctx.lineTo(x, y + Math.sin(x / 60 + t * 2 + i) * 6); ctx.stroke(); }
  ctx.restore();
}
function shotNY(t, k, trails = false) {
  fill(vgrad(0, H, [[0, '#01040f'], [.5, '#071a45'], [.62, '#123d82'], [.66, '#061232'], [1, '#020716']]));
  ctx.save(); cam(k, 1.0, 1.08, 540, 1180, -40, 0);
  const layer = (seed, base, hmin, hmax, col, winA, spire) => { const r = rng(seed); let x = -80;
    while (x < W + 80) { const w = 50 + r() * 90, h = hmin + r() * (hmax - hmin); ctx.fillStyle = col; ctx.fillRect(x, base - h, w, h + 5);
      if (spire && r() > .82) { ctx.fillRect(x + w * .3, base - h - 90, w * .4, 90); ctx.fillRect(x + w * .47, base - h - 200, w * .06, 110); }
      for (let wy = base - h + 14; wy < base - 10; wy += 16) for (let wx = x + 8; wx < x + w - 8; wx += 12) if (r() < winA) { ctx.fillStyle = r() > .3 ? 'rgba(200,225,255,.8)' : 'rgba(255,210,150,.8)'; ctx.fillRect(wx, wy, 5, 7); }
      x += w + 3; } };
  layer(21, 1250, 250, 650, '#0c2657', .10, false); haze(1150, 200, 'rgba(60,110,200,.25)');
  layer(22, 1260, 150, 520, '#050f2c', .22, true);
  // empire-esque tower
  ctx.fillStyle = '#040c24'; ctx.fillRect(600, 520, 150, 740); ctx.fillRect(630, 440, 90, 90); ctx.fillRect(655, 330, 40, 120); ctx.fillRect(672, 200, 6, 140); glow(675, 420, 120, 'rgba(160,200,255,.5)');
  // river reflection
  ctx.fillStyle = '#020815'; ctx.fillRect(-100, 1262, W + 200, 700);
  const r = rng(31); for (let i = 0; i < 90; i++) { const x = r() * W, y = 1275 + r() * 300; ctx.fillStyle = `rgba(190,215,255,${.15 + .25 * Math.abs(Math.sin(t * 6 + i))})`; ctx.fillRect(x + Math.sin(t * 3 + i) * 8, y, 18 + r() * 30, 3); }
  ctx.restore();
  bokeh(40, 12, t, '#9cc6ff', 40, 110, .08, 20);
}
function shotCancun(t, k) { // aerial shoreline
  ctx.save(); cam(k, 1.04, 1.12, 540, 960, 30, 40); ctx.translate(540, 960); ctx.rotate(.5); ctx.translate(-540, -960);
  fill('#0a3f86');
  const g = ctx.createLinearGradient(-300, 0, 1300, 0); g.addColorStop(0, '#f1e6cf'); g.addColorStop(.36, '#f4ead6'); g.addColorStop(.40, '#b9f5ec'); g.addColorStop(.52, '#40d6d4'); g.addColorStop(.7, '#139ac4'); g.addColorStop(1, '#0a3f86');
  ctx.fillStyle = g; ctx.fillRect(-600, -600, 2400, 3200);
  for (let w = 0; w < 3; w++) { const ph = (t * .5 + w / 3) % 1; ctx.strokeStyle = `rgba(255,255,255,${.85 * (1 - ph)})`; ctx.lineWidth = 8 - w * 2;
    ctx.beginPath(); for (let y = -600; y < 2600; y += 20) { const x = 300 + ph * 120 + Math.sin(y / 90 + w) * 18 + Math.sin(y / 31) * 6; y === -600 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,40,80,.25)'; for (let i = 0; i < 9; i++) { const r = rng(i + 50); ctx.beginPath(); ctx.ellipse(-100 + r() * 300, r() * 2000, 30, 12, 0, 0, 7); ctx.fill(); }
  ctx.restore();
}
function shotRoma(t, k) {
  fill(vgrad(0, H, [[0, '#07183f'], [.4, '#1c4a8c'], [.62, '#b98a6a'], [.7, '#e2b47e'], [1, '#2a1a24']]));
  glow(760, 1180, 520, 'rgba(255,200,140,.35)');
  ctx.save(); cam(k, 1.03, 1.1, 540, 1300, 30, 0);
  colosseum(560, 1400, 1100, '#150d1c', 'rgba(226,180,126,.95)');
  umbrellaPine(110, 1480, 1.1, '#0c0812'); umbrellaPine(990, 1520, .9, '#0c0812');
  ctx.fillStyle = '#0c0812'; ctx.fillRect(-100, 1400, W + 200, 600);
  haze(1390, 80, 'rgba(255,190,140,.25)');
  ctx.restore();
}

// ---------- JOURNEY SHOTS (scene 4) ----------
function shotTakeoff(t, k, mb = 1) {
  fill(vgrad(0, H, [[0, '#020a24'], [.55, '#0e3576'], [.7, '#3f7fc4'], [.74, '#f0c8a0'], [.76, '#0b1a3a'], [1, '#030815']]));
  glow(300, 1420, 500, 'rgba(255,200,160,.25)');
  // runway lights in perspective
  ctx.save(); for (let i = 0; i < 26; i++) { const q = ((i / 26) + k * .25) % 1, y = lerp(1460, 1920, q * q), sp = lerp(40, 700, q * q);
    for (const s of [-1, 1]) glow(540 + s * sp, y, lerp(4, 22, q), 'rgba(255,230,190,1)', .9); } ctx.restore();
  const px = lerp(-80, 900, k), py = lerp(1360, 820, k);
  airliner(px, py, 1100, -.2, '#010510', 1);
  glow(px, py, 260, 'rgba(120,170,255,.08)');
}
function shotWindow(t, k) {
  fill('#0a1226');
  ctx.save(); cam(k, 1.0, 1.05, 540, 960);
  const wx = 540, wy = 950, ww = 560, wh = 800;
  // outside view (clipped)
  ctx.save(); rrect(wx - ww / 2, wy - wh / 2, ww, wh, 270); ctx.clip();
  ctx.fillStyle = vgrad(wy - wh / 2, wy + wh / 2, [[0, '#2f7fd6'], [.55, '#bfe3ff'], [.6, '#ffffff'], [1, '#9fc8ef']]); ctx.fillRect(wx - ww, wy - wh, ww * 2, wh * 2);
  glow(wx + 120, wy - 180, 260, 'rgba(255,255,255,.9)');
  for (let i = 0; i < 16; i++) { const r = rng(i + 7); const x = ((r() * 1400 - t * (300 + r() * 250)) % 1400 + 1400) % 1400 - 300, y = wy + 60 + r() * 350;
    ctx.fillStyle = `rgba(255,255,255,${.7 + r() * .3})`; ctx.beginPath(); ctx.ellipse(x, y, 140 + r() * 120, 30 + r() * 30, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#c9d3df'; ctx.beginPath(); ctx.moveTo(wx - 400, wy + 260); ctx.lineTo(wx + 300, wy + 150); ctx.lineTo(wx + 320, wy + 175); ctx.lineTo(wx - 400, wy + 330); ctx.fill();
  ctx.restore();
  // frame + reflection
  ctx.lineWidth = 46; ctx.strokeStyle = '#1b2640'; rrect(wx - ww / 2 - 23, wy - wh / 2 - 23, ww + 46, wh + 46, 290); ctx.stroke();
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(160,190,230,.25)'; rrect(wx - ww / 2, wy - wh / 2, ww, wh, 270); ctx.stroke();
  ctx.save(); rrect(wx - ww / 2, wy - wh / 2, ww, wh, 270); ctx.clip(); const rg = ctx.createLinearGradient(wx - 300, wy - 400, wx + 300, wy + 400);
  rg.addColorStop(.3, 'rgba(255,255,255,0)'); rg.addColorStop(.42, 'rgba(255,255,255,.18)'); rg.addColorStop(.5, 'rgba(255,255,255,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.restore();
  fill('rgba(4,10,30,.18)');
}
function shotOcean(t, k) {
  ctx.save(); ctx.translate(540, 960); ctx.rotate(-.015 + Math.sin(t * .8) * .004); ctx.translate(-540, -960); cam(k, 1.02, 1.08, 540, 960, 0, -20);
  fill(vgrad(0, 980, [[0, '#06225e'], [.7, '#4f8fd6'], [1, '#e8f4ff']]));
  ctx.fillStyle = vgrad(980, H, [[0, '#1b5aa6'], [.3, '#0b3778'], [1, '#020c26']]); ctx.fillRect(-200, 980, W + 400, 1200);
  glow(560, 980, 420, 'rgba(255,255,255,.85)'); glow(560, 980, 120, 'rgba(255,255,255,1)');
  const r = rng(Math.floor(t * 18)); for (let i = 0; i < 160; i++) { const d = r(), y = 990 + d * d * 900, w = 10 + d * 90, x = 560 + (r() - .5) * (80 + d * 520);
    ctx.fillStyle = `rgba(255,255,255,${(1 - d) * .8 * r()})`; ctx.fillRect(x - w / 2, y, w, 2 + d * 4); }
  ctx.restore();
}
function shotHotel(t, k) {
  fill(vgrad(0, 1000, [[0, '#051b4d'], [.8, '#2e6cb8'], [1, '#9cc6ea']]));
  ctx.save(); cam(k, 1.0, 1.07, 540, 1100, -30, 0);
  ctx.fillStyle = vgrad(1000, 1150, ['#1d4f93', '#0b2b5c']); ctx.fillRect(-100, 1000, W + 200, 160);
  ctx.fillStyle = vgrad(1150, H, [[0, '#3fe0e8'], [.35, '#12a3c9'], [1, '#063d78']]); ctx.fillRect(-100, 1150, W + 200, 900);
  ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fillRect(-100, 1146, W + 200, 5);
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; for (let i = 0; i < 18; i++) { const y = 1190 + i * i * 2.4; ctx.beginPath(); for (let x = -100; x < W + 100; x += 24) ctx.lineTo(x, y + Math.sin(x / (40 + i * 5) + t * 2.5 + i) * (2 + i * .5)); ctx.stroke(); }
  for (const x of [220, 820]) glow(x, 1640, 180, 'rgba(180,255,255,.5)');
  palmSil(930, 1200, .9, '#020a1c', t); ctx.fillStyle = '#020a1c'; ctx.fillRect(-100, 1700, 420, 400);
  ctx.save(); ctx.translate(120, 1700); ctx.fillRect(0, -40, 230, 26); ctx.beginPath(); ctx.moveTo(180, -30); ctx.lineTo(260, -120); ctx.lineTo(272, -110); ctx.lineTo(200, -26); ctx.fill(); ctx.restore();
  ctx.restore();
}
function shotCity(t, k) {
  fill(vgrad(0, H, ['#010512', '#06173f', '#010512']));
  ctx.save(); cam(k, 1.0, 1.1, 540, 900);
  const vp = [540, 860];
  for (const s of [-1, 1]) { const r = rng(s > 0 ? 3 : 4); for (let i = 0; i < 9; i++) { const x0 = 540 + s * (80 + i * 70), x1 = 540 + s * (160 + i * 160);
      ctx.fillStyle = `rgb(${6 + i},${16 + i * 2},${40 + i * 5})`; ctx.beginPath(); ctx.moveTo(x0, vp[1] - 300 - i * 60); ctx.lineTo(x1, -200); ctx.lineTo(x1, H); ctx.lineTo(x0, vp[1] + 60); ctx.fill();
      for (let j = 0; j < 14; j++) if (r() > .45) { const q = r(); glow(lerp(x0, x1, q), lerp(vp[1] - 200, 100 + i * 20, q) + r() * 400, 6 + q * 14, r() > .4 ? 'rgba(190,220,255,.9)' : 'rgba(255,210,150,.9)'); } } }
  // light trails
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) { const r = rng(i + 90), lane = (r() - .5) * 2, ph = (t * (1.2 + r()) + r()) % 1, warm = r() > .55;
    const a = ph, b = Math.min(1, ph + .25); const P = q => [lerp(vp[0] + lane * 20, 540 + lane * 900, q * q), lerp(vp[1] + 40, H + 100, q * q)];
    const [ax, ay] = P(a), [bx, by] = P(b); ctx.strokeStyle = warm ? 'rgba(255,120,90,.85)' : 'rgba(220,240,255,.9)'; ctx.lineWidth = 2 + b * 10; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
  ctx.restore();
  bokeh(77, 10, t, '#a9cfff', 60, 140, .07, 10);
}
function shotDinner(t, k) {
  fill(vgrad(0, H, ['#070a18', '#0b1430', '#05070f']));
  ctx.save(); cam(k, 1.0, 1.06, 540, 1000, 20, 0);
  bokeh(55, 16, t, '#ffcf8a', 40, 120, .14, 6); bokeh(56, 10, t, '#8fb8ff', 50, 130, .09, 6);
  ctx.fillStyle = '#0a0d1a'; ctx.fillRect(-100, 1420, W + 200, 600); ctx.fillStyle = 'rgba(255,200,140,.08)'; ctx.fillRect(-100, 1420, W + 200, 4);
  // candle
  glow(250, 1250, 260, 'rgba(255,170,90,.35)'); ctx.fillStyle = '#e9dcc8'; ctx.fillRect(225, 1280, 50, 150); ctx.fillStyle = '#ffd08a'; ctx.beginPath(); ctx.ellipse(250 + Math.sin(t * 9) * 2, 1250, 11, 28, 0, 0, 7); ctx.fill(); glow(250, 1250, 50, 'rgba(255,230,180,.9)');
  // wine glass
  ctx.save(); ctx.translate(620, 1430); ctx.strokeStyle = 'rgba(230,240,255,.85)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-120, -700); ctx.bezierCurveTo(-140, -470, -40, -380, -6, -370); ctx.lineTo(-6, -40); ctx.lineTo(-110, 0); ctx.lineTo(110, 0); ctx.lineTo(6, -40); ctx.lineTo(6, -370); ctx.bezierCurveTo(40, -380, 140, -470, 120, -700); ctx.stroke();
  ctx.fillStyle = 'rgba(110,12,34,.92)'; ctx.beginPath(); ctx.moveTo(-128, -560); ctx.quadraticCurveTo(0, -548 + Math.sin(t * 3) * 4, 128, -560); ctx.bezierCurveTo(118, -440, 40, -385, 0, -382); ctx.bezierCurveTo(-40, -385, -118, -440, -128, -560); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-95, -660); ctx.quadraticCurveTo(-110, -520, -60, -440); ctx.stroke();
  ctx.restore(); ctx.restore();
}
function shotLandscape(t, k) {
  fill(vgrad(0, H, [[0, '#08204f'], [.45, '#6f9fd8'], [.55, '#e6effa'], [1, '#0c2552']]));
  glow(700, 930, 520, 'rgba(255,245,225,.7)');
  ctx.save(); cam(k, 1.0, 1.08, 700, 960, 0, 0);
  const ridge = (seed, base, amp, col, par) => { const r = rng(seed); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-200, H); let y = base; const off = k * par;
    for (let x = -200; x <= W + 200; x += 30) { y = base - Math.abs(Math.sin((x + off) / 170 + seed)) * amp - Math.sin((x + off) / 57 + seed * 2) * amp * .15 - r() * 8; ctx.lineTo(x, y); } ctx.lineTo(W + 200, H); ctx.fill(); };
  ridge(1, 1000, 260, '#9ab8e0', 20); haze(990, 90, 'rgba(255,255,255,.45)');
  ridge(2, 1150, 300, '#5a80b8', 50); haze(1130, 90, 'rgba(230,240,255,.35)');
  ridge(3, 1320, 320, '#274a86', 100); haze(1300, 80, 'rgba(200,220,255,.25)');
  ridge(4, 1560, 260, '#0b1f47', 180);
  ctx.restore();
}
