/* GRG V3 — "O mundo não foi feito para ficar na sua lista."
   Timeline (s): 0 hook · 2.5 departures board · 5.5 passport · 8.45 VIVA HISTÓRIAS · 9.75 journey
   · 12.75 VIVER · 13.75 GRG services · 17 trip confirmed · 20.5 end card. */
const FPS = 30, DUR = 24.5;
const main = document.getElementById('c'), mctx = main.getContext('2d');
const CAPTURE = location.search.includes('capture');
if (CAPTURE) document.body.classList.add('capture');
const bufF = buffer(), bufA = buffer(), bufB = buffer(), bufS = buffer(), bufT = buffer();
const logo = new Image(); logo.src = 'assets/logo.png';
const SANS = 'Inter Tight', MONO = 'JetBrains Mono';

// ---------- typography ----------
function setFont(o) { ctx.font = `${o.weight || 800} ${o.size || 100}px "${o.font === 'mono' ? MONO : SANS}"`; ctx.letterSpacing = (o.tracking ?? 0) + 'px'; ctx.textBaseline = 'alphabetic'; }
function measure(str, o) { ctx.save(); setFont(o); const w = ctx.measureText(str).width; ctx.restore(); return w; }
// o: {size, weight, font, color, align, alpha, tracking, blur, dx, dy, scale, shadow}
function T(str, x, y, o = {}) {
  const a = o.alpha ?? 1; if (a <= .002) return;
  ctx.save(); ctx.globalAlpha *= a; setFont(o); ctx.textAlign = o.align || 'left';
  ctx.translate(x + (o.dx || 0), y + (o.dy || 0)); if (o.scale && o.scale !== 1) ctx.scale(o.scale, o.scale);
  if (o.blur > .3) ctx.filter = `blur(${o.blur}px)`;
  if (o.shadow) { ctx.shadowColor = 'rgba(0,6,24,.55)'; ctx.shadowBlur = o.shadow; }
  if (o.parts) { // [[text, color], ...] single line with mixed colours
    let w = 0; for (const [s] of o.parts) w += ctx.measureText(s).width;
    let cx = o.align === 'center' ? -w / 2 : o.align === 'right' ? -w : 0; ctx.textAlign = 'left';
    for (const [s, col] of o.parts) { ctx.fillStyle = col; ctx.fillText(s, cx, 0); cx += ctx.measureText(s).width; }
  } else { ctx.fillStyle = o.color || C.white; ctx.fillText(str, 0, 0); }
  ctx.restore();
}
// line rises out of a mask (editorial reveal); out=time it leaves upward
function R(str, x, y, t, t0, o = {}, out = null, d = .45) {
  const k = eOut5(prog(t, t0, t0 + d)); if (k <= 0) return;
  const ko = out ? eIn(prog(t, out, out + .3)) : 0; if (ko >= 1) return;
  const s = o.size || 100;
  ctx.save(); ctx.beginPath(); ctx.rect(-50, y - s * 1.0, W + 100, s * 1.28); ctx.clip();
  T(str, x, y, { ...o, dy: (1 - k) * s * 1.1 - ko * s * 1.1, blur: (1 - k) * 6 });
  ctx.restore();
}

// ---------- icons (custom line set) ----------
const ICONS = {
  plane: () => { const p = new Path2D(); p.moveTo(30, 2); p.bezierCurveTo(30, -2, 26, -3, 20, -3); p.lineTo(6, -3); p.lineTo(-8, -26); p.lineTo(-14, -26); p.lineTo(-6, -3); p.lineTo(-20, -3); p.lineTo(-26, -12); p.lineTo(-30, -12); p.lineTo(-27, 2); p.lineTo(-30, 16); p.lineTo(-26, 16); p.lineTo(-20, 7); p.lineTo(-6, 7); p.lineTo(-14, 30); p.lineTo(-8, 30); p.lineTo(6, 7); p.lineTo(20, 7); p.bezierCurveTo(26, 7, 30, 6, 30, 2); return p; },
  bed: () => { const p = new Path2D(); p.moveTo(-30, -22); p.lineTo(-30, 24); p.moveTo(-30, 10); p.lineTo(30, 10); p.lineTo(30, 24); p.moveTo(-30, -2); p.lineTo(30, -2); p.quadraticCurveTo(30, -10, 22, -10); p.lineTo(-6, -10); p.lineTo(-6, -2); p.moveTo(-24, -2); p.roundRect(-24, -12, 14, 10, 4); return p; },
  globe: () => { const p = new Path2D(); p.arc(0, 0, 28, 0, Math.PI * 2); p.moveTo(0, -28); p.ellipse(0, 0, 12, 28, 0, -Math.PI / 2, Math.PI * 1.5); p.moveTo(-28, 0); p.lineTo(28, 0); p.moveTo(-24, -14); p.lineTo(24, -14); p.moveTo(-24, 14); p.lineTo(24, 14); return p; },
  ticket: () => { const p = new Path2D(); p.moveTo(-30, -18); p.lineTo(30, -18); p.lineTo(30, -7); p.arc(30, 0, 7, -Math.PI / 2, Math.PI / 2, true); p.lineTo(30, 18); p.lineTo(-30, 18); p.lineTo(-30, 7); p.arc(-30, 0, 7, Math.PI / 2, -Math.PI / 2, true); p.closePath(); p.moveTo(8, -12); p.lineTo(8, -6); p.moveTo(8, -2); p.lineTo(8, 3); p.moveTo(8, 7); p.lineTo(8, 12); p.moveTo(-20, -4); p.lineTo(-4, -4); p.moveTo(-20, 5); p.lineTo(-10, 5); return p; },
  car: () => { const p = new Path2D(); p.moveTo(-30, 12); p.lineTo(-30, 0); p.lineTo(-18, -4); p.lineTo(-8, -16); p.lineTo(12, -16); p.lineTo(22, -4); p.lineTo(30, -1); p.lineTo(30, 12); p.lineTo(22, 12); p.moveTo(10, 12); p.lineTo(-10, 12); p.moveTo(-22, 12); p.lineTo(-30, 12); p.moveTo(-10, 12); p.arc(-16, 12, 6, 0, Math.PI * 2); p.moveTo(22, 12); p.arc(16, 12, 6, 0, Math.PI * 2); p.moveTo(-16, -4); p.lineTo(22, -4); return p; },
  bag: () => { const p = new Path2D(); p.roundRect(-28, -14, 56, 40, 7); p.moveTo(-10, -14); p.lineTo(-10, -24); p.lineTo(10, -24); p.lineTo(10, -14); p.moveTo(-16, -14); p.lineTo(-16, 26); p.moveTo(16, -14); p.lineTo(16, 26); return p; },
};
function icon(name, x, y, s, p, col = C.white) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineWidth = 2.6 / s * 1.25; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col;
  ctx.setLineDash([400, 400]); ctx.lineDashOffset = 400 * (1 - eOut(p)); ctx.stroke(ICONS[name]()); ctx.restore();
}
function glass(x, y, w, h, r, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; rrect(x, y, w, h, r);
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(120,170,255,.13)'); g.addColorStop(1, 'rgba(40,90,200,.06)'); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 1.6; const s = ctx.createLinearGradient(x, y, x + w, y + h); s.addColorStop(0, 'rgba(255,255,255,.32)'); s.addColorStop(.5, 'rgba(255,255,255,.07)'); s.addColorStop(1, 'rgba(255,255,255,.18)'); ctx.strokeStyle = s; ctx.stroke();
  ctx.restore();
}
function drawLogo(x, y, R, a = 1, blur = 0) {
  ctx.save(); ctx.globalAlpha *= a; if (blur > .3) ctx.filter = `blur(${blur}px)`;
  ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
  const sc = R / 548; ctx.drawImage(logo, x - 627 * sc, y - 627 * sc, 1254 * sc, 1254 * sc); ctx.restore();
}
function flare(x, y, w, a) { // controlled anamorphic streak
  if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, 'rgba(62,232,255,0)'); g.addColorStop(.5, `rgba(160,240,255,${.75 * a})`); g.addColorStop(1, 'rgba(62,232,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x - w, y - 2, 2 * w, 4); glow(x, y, 160, `rgba(62,232,255,${.25 * a})`); ctx.restore();
}
function grgSpace(t) {
  fill(C.deep);
  glow(180 + Math.sin(t * .3) * 80, 380, 950, 'rgba(11,77,179,.55)');
  glow(960, 1560 + Math.cos(t * .25) * 80, 900, 'rgba(31,107,255,.28)');
  glow(540, 960, 700, 'rgba(5,26,74,.6)');
}
// text filled with a live shot (letters as windows)
function textWindow(lines, shotFn, t, k, bgA = .1) {
  paint(bufS, () => shotFn(t, k));
  paint(bufT, () => { for (const L of lines) T(L.s, L.x, L.y, { ...L.o, color: '#fff' }); ctx.globalCompositeOperation = 'source-in'; ctx.drawImage(bufS, 0, 0); });
  ctx.save(); ctx.globalAlpha = bgA; ctx.drawImage(bufS, 0, 0); ctx.restore();
  return bufT;
}

// ============ S1 — HOOK (0 – 2.5) ============
const FLASH = [[shotParis, 'PARIS', '48.8566° N  2.3522° E'], [shotMaldivas, 'MALDIVAS', '3.2028° N  73.2207° E'], [shotNY, 'NOVA YORK', '40.7128° N  74.0060° O'], [shotCancun, 'CANCÚN', '21.1619° N  86.8515° O'], [shotRoma, 'ROMA', '41.8902° N  12.4922° E']];
function s1(t) {
  fill(C.deep); glow(540, 1000, 900, 'rgba(8,36,96,.55)');
  if (t >= .75 && t < 2.0) {
    const i = Math.floor((t - .75) / .25), fk = ((t - .75) % .25) / .25, [fn, name, co] = FLASH[i];
    ctx.save(); fn(t, .2 + fk * .25); ctx.restore();
    fill(`rgba(2,8,22,${.28 + .38 * fk})`);
    T(name, 90, 1470, { font: 'mono', weight: 700, size: 30, tracking: 6, color: '#fff', alpha: .9 });
    T(co, 90, 1515, { font: 'mono', weight: 500, size: 22, tracking: 2, color: C.ice, alpha: .7 });
  }
  const fl = t < 2.0 ? (Math.sin(t * 40) > -.2 ? .75 : .3) : .75 * (1 - prog(t, 2.0, 2.3));
  T('● ÚLTIMA CHAMADA  ·  FINAL CALL', 90, 280, { font: 'mono', weight: 600, size: 24, tracking: 4, color: C.cyan, alpha: fl * prog(t, .05, .15) });
  const up = eInOut(prog(t, 1.95, 2.3)) * 110;
  R('E SE', 88, 760 - up, t, -.14, { size: 170, weight: 850, tracking: -4 }, null, .32);
  R('VOCÊ…', 88, 925 - up, t, .02, { size: 170, weight: 850, tracking: -4 }, null, .32);
  if (t >= 2.0) {
    const k = prog(t, 2.0, 2.35);
    T('FOSSE?', 80, 1170 - up * .35, { size: 262, weight: 900, tracking: lerp(40, -8, eExpo(k)), scale: lerp(1.22, 1, eExpo(k)), blur: (1 - eExpo(k)) * 26, alpha: clamp(k * 5), color: '#fff' });
    flare(520, 1100, 900 * eOut(prog(t, 2.0, 2.2)), 1 - prog(t, 2.05, 2.6));
  }
}

// ============ S2 — DEPARTURES (2.5 – 5.5) ============
const NAMES = ['PARIS', 'CANCÚN', 'LISBOA', 'ROMA', 'MALDIVAS'];
const TIMES = ['08:40', '09:15', '10:30', '11:05', '12:50'];
const EVENTS = [2.85, 3.07, 3.29, 3.51, 3.73, 4.0];
const CW = 52, CH = 78, CS = 56;
function glyphHalf(ch, x, y, half, sy) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, half ? y + CH / 2 : y, CW, CH / 2); ctx.clip();
  ctx.translate(x + CW / 2, y + CH / 2); ctx.scale(1, sy); ctx.fillStyle = '#eaf2ff'; ctx.font = `700 46px "${MONO}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, 3); ctx.restore();
}
function flapCell(x, y, cur, next, f) {
  const cell = (hy, col) => { ctx.fillStyle = col; ctx.fillRect(x, hy, CW, CH / 2 - 1); };
  rrect(x, y, CW, CH, 7); ctx.save(); ctx.clip(); cell(y, '#0c1d45'); cell(y + CH / 2 + 1, '#091839');
  if (f >= 1 || f <= 0) { const c = f >= 1 ? next : cur; glyphHalf(c, x, y, 0, 1); glyphHalf(c, x, y, 1, 1); }
  else {
    glyphHalf(next, x, y, 0, 1); glyphHalf(cur, x, y, 1, 1);
    if (f < .5) { const s = 1 - 2 * f; ctx.save(); ctx.translate(0, y + CH / 2); ctx.scale(1, s); ctx.translate(0, -(y + CH / 2)); cell(y, '#10245a'); glyphHalf(cur, x, y, 0, 1); ctx.restore(); ctx.fillStyle = `rgba(0,0,0,${.4 * (1 - s)})`; ctx.fillRect(x, y + CH / 2 + 1, CW, CH / 2); }
    else { const s = 2 * f - 1; ctx.save(); ctx.translate(0, y + CH / 2); ctx.scale(1, s); ctx.translate(0, -(y + CH / 2)); cell(y + CH / 2 + 1, '#0b1d4a'); glyphHalf(next, x, y, 1, 1); ctx.restore(); }
  }
  ctx.restore(); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x, y + CH / 2 - 1, CW, 2);
}
function cellState(seq, times, t, c, r) {
  let cur = ' ', next = ' ', f = 1;
  for (let j = 0; j < times.length; j++) { const st = times[j] + c * .018 + r * .025; if (t < st) break; cur = j ? seq[j - 1][c] : ' '; next = seq[j][c]; f = (t - st) / .09; }
  return [cur || ' ', next || ' ', clamp(f)];
}
function s2(t) {
  fill(vgrad(0, H, ['#020816', '#061a45', '#020816']));
  bokeh(12, 14, t, '#6fa8ff', 50, 140, .06, 10); bokeh(13, 10, t, '#ffffff', 20, 60, .05, 16);
  ctx.save(); cam(prog(t, 2.5, 5.5), 1.0, 1.035, 540, 1000);
  R('PARA ONDE…', 88, 470, t, 2.72, { size: 118, weight: 850, tracking: -3 });
  R('', 88, 600, t, 4.0, { size: 118, weight: 850, tracking: -3, parts: [['…VOCÊ ', '#fff'], ['IRIA?', C.cyan]] });
  const pa = eOut5(prog(t, 2.6, 3.0));
  ctx.save(); ctx.globalAlpha = pa; ctx.translate(0, (1 - pa) * 40);
  glass(70, 690, 940, 650, 30);
  T('PARTIDAS', 110, 752, { font: 'mono', weight: 700, size: 24, tracking: 6, alpha: .8 });
  T('DEPARTURES', 970, 752, { font: 'mono', weight: 500, size: 24, tracking: 6, alpha: .4, align: 'right' });
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(110, 776, 860, 1.5);
  for (let r = 0; r < 5; r++) {
    const y = 806 + r * 104;
    const seqN = EVENTS.map((_, j) => (j < EVENTS.length - 1 ? NAMES[(r + j * 2 + 1) % 5] : NAMES[r]).padEnd(8, ' '));
    for (let c = 0; c < 5; c++) { const [a, b, f] = cellState([TIMES[r]], [2.85], t, c, r); flapCell(110 + c * CS, y, a, b, f); }
    for (let c = 0; c < 8; c++) { const [a, b, f] = cellState(seqN, EVENTS, t, c, r); flapCell(410 + c * CS, y, a, b, f); }
    const on = t > 4.35, boarding = r === 3;
    const st = !on ? '' : boarding ? 'EMBARQUE' : 'NO HORÁRIO';
    T(st, 970, y + 50, { font: 'mono', weight: 600, size: 20, tracking: 1, align: 'right', color: boarding ? C.cyan : '#fff', alpha: (boarding ? (Math.sin(t * 8) > -.3 ? 1 : .35) : .45) * prog(t, 4.35 + r * .05, 4.55 + r * .05) });
  }
  ctx.restore();
  R('Seu próximo destino pode estar', 88, 1440, t, 4.55, { size: 38, weight: 500, alpha: .78 });
  R('mais perto do que parece.', 88, 1492, t, 4.65, { size: 38, weight: 500, alpha: .78 });
  ctx.restore();
}

// ============ S3 — PASSPORT + VIVA HISTÓRIAS (5.5 – 9.75) ============
const STAMPS = [
  { t: 5.75, x: 330, y: 820, rot: -.16, name: 'PARIS', shape: 'circle', shot: shotParis, co: '48.8566° N  2.3522° E' },
  { t: 6.25, x: 745, y: 960, rot: .1, name: 'CANCÚN', shape: 'rect', shot: shotCancun, co: '21.1619° N  86.8515° O' },
  { t: 6.75, x: 330, y: 1210, rot: .08, name: 'ROMA', shape: 'oval', shot: shotRoma, co: '41.8902° N  12.4922° E' },
  { t: 7.25, x: 745, y: 1350, rot: -.1, name: 'NEW YORK', shape: 'rect2', shot: shotNY, co: '40.7128° N  74.0060° O' },
];
const stampCache = {};
function stampImg(s, i) {
  if (stampCache[i]) return stampCache[i];
  const c = document.createElement('canvas'); c.width = 440; c.height = 340; const g = c.getContext('2d'); const prev = ctx; ctx = g;
  g.translate(220, 170); const ink = '#123a8f'; g.strokeStyle = g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  const mono = (sz, w = 700) => `${w} ${sz}px "${MONO}"`, sans = (sz) => `850 ${sz}px "${SANS}"`;
  if (s.shape === 'circle') { g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 150, 0, 7); g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 132, 0, 7); g.stroke();
    g.font = mono(17); const lbl = 'ARRIVAL · CHEGADA · ARRIVÉE · '; for (let k = 0; k < lbl.length; k++) { g.save(); g.rotate(k / lbl.length * Math.PI * 2); g.fillText(lbl[k], 0, -114); g.restore(); }
    g.font = sans(64); g.fillText(s.name, 0, 4); g.font = mono(22); g.fillText('12 OUT 2026', 0, 58); }
  else if (s.shape === 'oval') { g.lineWidth = 7; g.beginPath(); g.ellipse(0, 0, 195, 125, 0, 0, 7); g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.ellipse(0, 0, 176, 108, 0, 0, 7); g.stroke();
    g.font = mono(20); g.fillText('ITALIA · FCO', 0, -58); g.font = sans(78); g.fillText(s.name, 0, 6); g.font = mono(20); g.fillText('ENTRATA 03 NOV', 0, 64); }
  else { g.lineWidth = 7; g.strokeRect(-200, -110, 400, 220); if (s.shape === 'rect2') { g.lineWidth = 2.5; g.strokeRect(-184, -94, 368, 188); }
    g.font = mono(20); g.fillText(s.shape === 'rect2' ? 'ADMITTED · JFK' : 'MÉXICO · CUN', 0, -62); g.font = sans(s.name.length > 6 ? 62 : 76); g.fillText(s.name, 0, 4); g.fillRect(-140, 46, 280, 3); g.font = mono(20); g.fillText('2026 · 14 DIAS', 0, 76); }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out'; const r = rng(i + 5);
  for (let k = 0; k < 1100; k++) { g.globalAlpha = .25 + r() * .75; g.beginPath(); g.arc(r() * 440, r() * 340, r() * 2.6, 0, 7); g.fill(); }
  ctx = prev; return (stampCache[i] = c);
}
function passportPage(t) {
  fill(vgrad(0, H, ['#dfe6f1', '#eef2f8', '#d9e1ee']));
  ctx.save(); ctx.lineWidth = 1.6;
  for (let k = 0; k < 40; k++) { ctx.strokeStyle = k % 3 ? 'rgba(18,58,143,.07)' : 'rgba(62,160,220,.08)'; ctx.beginPath();
    for (let x = -40; x <= W + 40; x += 10) { const y = 40 + k * 48 + Math.sin(x / 90 + k * .5) * 20 + Math.sin(x / 27 + k) * 5; x === -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  ctx.restore();
  T('VISTOS / VISAS', 540, 640, { font: 'mono', weight: 600, size: 22, tracking: 8, color: '#123a8f', alpha: .4, align: 'center' });
  T('07', 980, 1780, { font: 'mono', weight: 600, size: 26, color: '#123a8f', alpha: .4, align: 'right' });
  STAMPS.forEach((s, i) => { if (t < s.t - .07) return; const k = prog(t, s.t - .07, s.t), sc = t < s.t ? lerp(1.3, 1, eIn(k)) : 1;
    ctx.save(); ctx.globalAlpha = t < s.t ? k * .6 : .88; ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.scale(sc * .9, sc * .9); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(stampImg(s, i), -220, -170); ctx.restore(); });
}
function s3(t) {
  // passport with depth of field
  const jolt = STAMPS.reduce((a, s) => a + (t >= s.t ? 5 * Math.exp(-(t - s.t) * 18) : 0), 0);
  paint(bufA, () => { ctx.translate(0, jolt); ctx.translate(540, 1000); ctx.rotate(-.05); const k = prog(t, 5.5, 8.25); ctx.scale(lerp(1.08, 1.16, eInOut(k)), lerp(1.08, 1.16, eInOut(k))); ctx.translate(-540, -1000 + lerp(30, -40, k)); passportPage(t); });
  ctx.drawImage(bufA, 0, 0);
  paint(bufB, () => { ctx.filter = 'blur(9px)'; ctx.drawImage(bufA, 0, 0); ctx.filter = 'none'; ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = vgrad(0, H, [[0, 'rgba(0,0,0,1)'], [.2, 'rgba(0,0,0,0)'], [.78, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,1)']]); ctx.fillRect(0, 0, W, H); });
  ctx.drawImage(bufB, 0, 0);
  fill('rgba(5,26,74,.06)');
  // stamp -> micro-scene (circular reveal from the stamp)
  for (const s of STAMPS) {
    const a = s.t + .12, b = s.t + .42; if (t < a || t >= b) continue;
    const rr = eOut5(prog(t, a, a + .1)) * 1500;
    ctx.save(); ctx.beginPath(); ctx.arc(s.x, s.y, rr, 0, 7); ctx.clip(); s.shot(t, prog(t, a, b) * .5 + .1); fill('rgba(2,8,22,.18)');
    T(s.name, 90, 1470, { font: 'mono', weight: 700, size: 30, tracking: 6 }); T(s.co, 90, 1515, { font: 'mono', weight: 500, size: 22, tracking: 2, color: C.ice, alpha: .75 });
    ctx.restore();
  }
  if (t > 7.45) { R('COLECIONE', 88, 400, t, 7.5, { size: 132, weight: 850, tracking: -4, color: C.navy }); R('DESTINOS.', 88, 540, t, 7.62, { size: 132, weight: 850, tracking: -4, color: C.navy }); }
}
function heroViva(t) { // 8.45 – 9.75
  fill(C.deep);
  const k = prog(t, 8.45, 9.75), s = lerp(1, 1.05, eInOut(k));
  const l1 = { size: 392, weight: 900, tracking: -14, align: 'center' }, l2 = { size: 176, weight: 900, tracking: -5, align: 'center' };
  const a1 = eOut5(prog(t, 8.45, 8.75)), a2 = eOut5(prog(t, 8.62, 8.92));
  const buf = textWindow([{ s: 'VIVA', x: 540, y: 900 + (1 - a1) * 80, o: { ...l1, alpha: a1 } }, { s: 'HISTÓRIAS.', x: 540, y: 1080 + (1 - a2) * 60, o: { ...l2, alpha: a2 } }], shotLandscape, t, .1 + k * .5, .07);
  // zoom-through the Ó
  const z = prog(t, 9.4, 9.75); const Z = 1 + eInExpo(z) * 60;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0)';
  const w2 = measure('HISTÓRIAS.', l2), ox = 540 - w2 / 2 + measure('HIST', l2) + measure('Ó', l2) / 2, oy = 1080 - 62;
  ctx.translate(ox, oy); ctx.scale(s * Z, s * Z); ctx.translate(-ox, -oy); ctx.drawImage(buf, 0, 0); ctx.restore();
  if (z > .55) { ctx.save(); ctx.globalAlpha = eOut(prog(z, .55, 1)); shotTakeoff(t, .5); ctx.restore(); }
  T('GRG VIAGENS  ·  CAPÍTULO 01', 540, 1300, { font: 'mono', weight: 600, size: 20, tracking: 6, align: 'center', alpha: .45 * prog(t, 8.9, 9.2) * (1 - z) });
}

// ============ S4 — JOURNEY (9.75 – 12.75) ============
const JOURNEY = [shotTakeoff, shotWindow, shotOcean, shotHotel, shotCity, shotCancun, shotDinner, shotLandscape];
const SHOT = .375;
function s4(t) {
  const i = Math.min(7, Math.floor((t - 9.75) / SHOT)), k = ((t - 9.75) - i * SHOT) / SHOT;
  ctx.save(); JOURNEY[i](t, i === 0 ? .5 + k * .35 : k * .9); ctx.restore();
  fill('rgba(2,8,22,.12)');
  const g = ctx.createLinearGradient(0, 1100, 0, 1700); g.addColorStop(0, 'rgba(2,8,22,0)'); g.addColorStop(1, 'rgba(2,8,22,.55)'); ctx.fillStyle = g; ctx.fillRect(0, 1100, W, 820);
  R('Não é sobre chegar.', 540, 1420, t, 10.05, { size: 82, weight: 750, tracking: -2, align: 'center', shadow: 30 }, 12.45);
}
function s4b(t) { // 12.75 – 13.75  "É sobre VIVER."
  fill(C.deep);
  R('É sobre', 540, 700, t, 12.75, { size: 92, weight: 600, tracking: -2, align: 'center', alpha: t > 13 ? .7 : 1 }, null, .3);
  if (t >= 13.0) {
    const k = prog(t, 13.0, 13.4), sc = lerp(1.16, 1, eExpo(k)) * lerp(1, 1.03, prog(t, 13.4, 13.75));
    const buf = textWindow([{ s: 'VIVER.', x: 540, y: 1060, o: { size: 300, weight: 900, tracking: -10, align: 'center' } }], shotOcean, t, .2 + prog(t, 13, 13.75) * .4, 0);
    ctx.save(); ctx.globalAlpha = clamp(k * 5); ctx.translate(540, 960); ctx.scale(sc, sc); ctx.translate(-540, -960); if (k < 1) ctx.filter = `blur(${(1 - eExpo(k)) * 20}px)`; ctx.drawImage(buf, 0, 0); ctx.restore();
    flare(540, 960, 1000 * eOut(prog(t, 13.0, 13.2)), 1 - prog(t, 13.05, 13.7));
  }
}

// ============ S5 — GRG SERVICES (13.75 – 17.0) ============
const SERVICES = [['plane', 'Passagens'], ['bed', 'Hospedagem'], ['globe', 'Pacotes'], ['ticket', 'Experiências'], ['car', 'Locação'], ['bag', 'Assessoria']];
function s5(t, exitK = 0) {
  grgSpace(t);
  ctx.save(); ctx.globalAlpha = 1 - exitK; ctx.translate(0, -exitK * 60);
  const lk = eOut5(prog(t, 13.95, 14.5)); drawLogo(540, 330, 92 * lerp(.9, 1, lk), lk, (1 - lk) * 14);
  R('Você escolhe o destino.', 540, 540, t, 14.15, { size: 68, weight: 750, tracking: -2, align: 'center' });
  R('', 540, 625, t, 14.5, { size: 68, weight: 750, tracking: -2, align: 'center', parts: [['A ', '#fff'], ['GRG', C.cyan], [' cuida do resto.', '#fff']] });
  SERVICES.forEach(([ic, lbl], i) => {
    const t0 = 14.85 + i * .2, k = eOut5(prog(t, t0, t0 + .5)); if (k <= 0) return;
    const x = 80 + (i % 2) * 480, y = 740 + Math.floor(i / 2) * 200;
    ctx.save(); ctx.globalAlpha *= k; ctx.translate(0, (1 - k) * 36); if (k < 1) ctx.filter = `blur(${(1 - k) * 8}px)`;
    glass(x, y, 440, 172, 28);
    ctx.beginPath(); ctx.arc(x + 82, y + 86, 46, 0, 7); ctx.fillStyle = 'rgba(62,232,255,.08)'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(62,232,255,.35)'; ctx.stroke();
    ctx.filter = 'none'; icon(ic, x + 82, y + 86, 1.0, prog(t, t0 + .1, t0 + .7), C.cyan);
    T(lbl, x + 150, y + 100, { size: 42, weight: 650, tracking: -.5 });
    T('0' + (i + 1), x + 410, y + 44, { font: 'mono', weight: 500, size: 18, align: 'right', alpha: .35 });
    ctx.restore();
  });
  ctx.restore();
}

// ============ S6 — TRIP CONFIRMED (17.0 – 20.5) ============
const LAND = [
  [[-168, 66], [-162, 70], [-140, 70], [-125, 72], [-95, 74], [-80, 73], [-62, 66], [-56, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-90, 30], [-97, 26], [-97, 21], [-92, 18], [-88, 21], [-87, 15], [-83, 10], [-78, 8], [-80, 7], [-86, 11], [-92, 14], [-105, 20], [-110, 24], [-112, 30], [-117, 33], [-124, 40], [-124, 48], [-131, 55], [-140, 60], [-152, 58], [-165, 60]],
  [[-73, 78], [-60, 82], [-30, 83], [-20, 78], [-22, 70], [-40, 65], [-43, 60], [-50, 62], [-55, 68], [-60, 75]],
  [[-80, 8], [-72, 12], [-62, 11], [-52, 5], [-50, 0], [-35, -5], [-35, -10], [-39, -15], [-41, -22], [-48, -26], [-53, -34], [-58, -38], [-65, -41], [-66, -47], [-69, -52], [-72, -54], [-75, -50], [-73, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -6], [-80, -1], [-78, 3]],
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [0, 50], [5, 53], [8, 57], [5, 62], [12, 66], [20, 70], [30, 71], [40, 68], [45, 60], [40, 45], [30, 46], [28, 41], [24, 38], [20, 40], [15, 38], [12, 44], [8, 44], [3, 42], [-1, 37]],
  [[-6, 50], [1, 51], [2, 53], [-2, 56], [-3, 58], [-6, 58], [-5, 54]],
  [[-17, 21], [-16, 27], [-9, 32], [-6, 36], [10, 37], [11, 33], [20, 31], [32, 31], [35, 28], [43, 12], [51, 12], [50, 2], [40, -3], [40, -15], [35, -24], [32, -29], [26, -34], [19, -35], [17, -29], [12, -17], [13, -5], [9, -1], [9, 4], [4, 6], [-8, 4], [-13, 8], [-17, 14]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  [[26, 40], [36, 36], [36, 31], [43, 13], [52, 17], [58, 22], [56, 27], [62, 25], [67, 24], [72, 20], [77, 8], [80, 15], [88, 22], [92, 21], [98, 16], [100, 8], [104, 1], [104, 10], [109, 12], [108, 21], [118, 24], [122, 30], [121, 40], [128, 38], [130, 43], [142, 47], [141, 53], [137, 55], [143, 59], [156, 51], [162, 57], [160, 61], [170, 60], [180, 65], [180, 70], [160, 70], [140, 73], [113, 74], [105, 78], [90, 76], [75, 73], [68, 70], [60, 69], [45, 68], [40, 65], [30, 70], [28, 60], [40, 45], [30, 46]],
  [[130, 31], [135, 34], [140, 35], [142, 40], [141, 45], [145, 44], [140, 39], [136, 36], [131, 34]],
  [[95, 5], [106, -6], [104, -6], [98, 0]], [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]], [[106, -6], [114, -8], [106, -7]], [[131, -1], [141, -3], [150, -10], [141, -9], [137, -5]],
  [[114, -22], [114, -34], [118, -35], [124, -33], [132, -32], [138, -35], [141, -38], [147, -38], [150, -37], [153, -30], [153, -25], [146, -19], [142, -11], [141, -17], [136, -12], [130, -12], [126, -14], [122, -18]],
  [[172, -34], [175, -37], [178, -38], [174, -41], [171, -44], [167, -46], [170, -42]], [[-24, 64], [-14, 66], [-14, 64], [-20, 63]],
];
function inPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
const DOTS = []; for (let lat = 80; lat >= -56; lat -= 4.2) for (let lon = -180; lon < 180; lon += 4.2) if (LAND.some(p => inPoly(lon, lat, p))) DOTS.push([lon, lat]);
function mapXY(lon, lat, m) { return [m.x + (lon + 180) / 360 * m.w, m.y + (80 - lat) / 136 * m.w * 136 / 360]; }
function worldMap(t, m, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(140,185,255,.42)';
  for (const [lon, lat] of DOTS) { const [x, y] = mapXY(lon, lat, m); ctx.beginPath(); ctx.arc(x, y, m.w / 520, 0, 7); ctx.fill(); }
  ctx.restore();
}
function flightArc(t, m, t0, t1, a = 1) {
  const A = mapXY(-46.6, -23.5, m), B = mapXY(12.25, 41.8, m), Cc = [(A[0] + B[0]) / 2 - 40, Math.min(A[1], B[1]) - m.w * .16];
  const P = q => [(1 - q) * (1 - q) * A[0] + 2 * (1 - q) * q * Cc[0] + q * q * B[0], (1 - q) * (1 - q) * A[1] + 2 * (1 - q) * q * Cc[1] + q * q * B[1]];
  const k = eInOut(prog(t, t0, t1));
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
  ctx.setLineDash([2, 10]); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let q = 0; q <= 1.001; q += .02) ctx.lineTo(...P(q)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = C.cyan; ctx.lineWidth = 3.2; ctx.shadowColor = C.cyan; ctx.shadowBlur = 12; ctx.beginPath(); for (let q = 0; q <= k + .001; q += .01) ctx.lineTo(...P(Math.min(q, k))); ctx.stroke(); ctx.shadowBlur = 0;
  for (const [pt, lbl, al] of [[A, 'GRU', 1], [B, 'FCO', prog(t, t1 - .1, t1 + .2)]]) { if (al <= 0) continue; ctx.globalAlpha = a * al; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pt[0], pt[1], 7 + 5 * Math.abs(Math.sin(t * 3)), 0, 7); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pt[0], pt[1], 4, 0, 7); ctx.fill(); T(lbl, pt[0] + 14, pt[1] - 12, { font: 'mono', weight: 700, size: 20, tracking: 2 }); }
  if (k > 0 && k < 1) { const h = P(k); glow(h[0], h[1], 30, 'rgba(160,245,255,.9)'); }
  ctx.restore();
}
function checkMark(x, y, p) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = C.cyan; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * eOut(clamp(p * 1.6))); ctx.stroke();
  const q = clamp(p * 1.6 - .6); if (q > 0) { ctx.setLineDash([40, 40]); ctx.lineDashOffset = 40 * (1 - eOut(q)); ctx.beginPath(); ctx.moveTo(x - 9, y + 1); ctx.lineTo(x - 2, y + 8); ctx.lineTo(x + 10, y - 7); ctx.stroke(); }
  if (p >= 1) glow(x, y, 40, 'rgba(62,232,255,.25)');
  ctx.restore();
}
const ROWS6 = ['Destino', 'Voo', 'Hospedagem', 'Experiências'];
function s6(t) {
  grgSpace(t);
  const out = eInOut(prog(t, 18.95, 19.3));
  const m = { x: 40, y: 290, w: 1000 };
  ctx.save(); ctx.globalAlpha = eOut5(prog(t, 16.95, 17.4)) * (1 - out * .75);
  ctx.translate(540, 960); const zs = 1 + out * .15; ctx.scale(zs, zs); ctx.translate(-540, -960);
  worldMap(t, m, 1); flightArc(t, m, 17.2, 18.6);
  ctx.restore();
  const ck = eOut5(prog(t, 17.05, 17.55));
  if (out < 1) {
    ctx.save(); ctx.globalAlpha = ck * (1 - out); ctx.translate(0, (1 - ck) * 60 + out * 40); if (out > 0) ctx.filter = `blur(${out * 14}px)`;
    glass(70, 760, 940, 690, 36);
    T('SUA VIAGEM', 120, 840, { font: 'mono', weight: 700, size: 22, tracking: 6, color: C.cyan });
    T('Roma, Itália', 120, 920, { size: 72, weight: 750, tracking: -2 });
    T('GRU → FCO  ·  7 NOITES  ·  2 ADULTOS', 120, 975, { font: 'mono', weight: 500, size: 22, tracking: 1, alpha: .6 });
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(120, 1010, 840, 1.5);
    ROWS6.forEach((lbl, i) => {
      const t0 = 17.45 + i * .25, rk = eOut5(prog(t, t0, t0 + .35)); if (rk <= 0) return; const y = 1085 + i * 92;
      ctx.save(); ctx.globalAlpha *= rk; ctx.translate((1 - rk) * 30, 0);
      T(lbl.toUpperCase(), 120, y + 12, { font: 'mono', weight: 600, size: 24, tracking: 3, alpha: .85 });
      T('confirmado', 900, y + 12, { size: 30, weight: 500, color: C.cyan, align: 'right', alpha: prog(t, t0 + .15, t0 + .35) });
      checkMark(945, y + 2, prog(t, t0 + .08, t0 + .5));
      if (i < 3) { ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(120, y + 50, 840, 1); }
      ctx.restore();
    });
    ctx.restore();
  }
  R('Menos preocupação.', 540, 940, t, 19.05, { size: 96, weight: 800, tracking: -3, align: 'center' }, 19.6, .4);
  if (t >= 19.75) {
    const k = prog(t, 19.75, 20.1);
    T('', 540, 1010, { size: 176, weight: 900, tracking: lerp(20, -6, eExpo(k)), align: 'center', scale: lerp(1.12, 1, eExpo(k)), blur: (1 - eExpo(k)) * 18, alpha: clamp(k * 5), parts: [['Mais ', '#fff'], ['mundo.', C.cyan]] });
    flare(540, 950, 900 * eOut(prog(t, 19.75, 19.95)), 1 - prog(t, 19.8, 20.4));
  }
}

// ============ S7 — END CARD (20.5 – 24.5) ============
function globe(cx, cy, r, t, a) {
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = 'rgba(120,180,255,1)'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
  for (let lat = -60; lat <= 60; lat += 30) { const y = cy - Math.sin(lat * Math.PI / 180) * r, rr = Math.cos(lat * Math.PI / 180) * r; ctx.beginPath(); ctx.ellipse(cx, y, rr, rr * .18, 0, 0, 7); ctx.stroke(); }
  for (let i = 0; i < 8; i++) { const ph = (i / 8 * Math.PI + t * .18) % Math.PI; const rx = Math.abs(Math.cos(ph)) * r; ctx.globalAlpha = a * (.35 + .65 * Math.sin(ph)); ctx.beginPath(); ctx.ellipse(cx, cy, rx, r, 0, 0, 7); ctx.stroke(); }
  ctx.restore();
}
function s7(t) {
  grgSpace(t);
  const ga = eOut(prog(t, 20.4, 21.4));
  globe(540, 800, 560, t, .1 * ga);
  ctx.save(); ctx.globalAlpha = ga; ctx.lineWidth = 1.4;
  for (const [rot, sp, rx, ry] of [[-.32, .5, 400, 120], [.38, -.35, 440, 140]]) {
    ctx.save(); ctx.translate(540, 800); ctx.rotate(rot); ctx.strokeStyle = 'rgba(62,232,255,.22)'; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.stroke();
    const a = t * sp; glow(Math.cos(a) * rx, Math.sin(a) * ry, 22, 'rgba(160,245,255,.9)'); ctx.restore(); }
  ctx.restore();
  const lk = eOut5(prog(t, 20.7, 21.5));
  glow(540, 800, 420, 'rgba(31,107,255,.35)', lk);
  drawLogo(540, 800, 250 * lerp(.92, 1, lk), lk, (1 - lk) * 18);
  const sw = prog(t, 21.5, 22.1); if (sw > 0 && sw < 1) { ctx.save(); ctx.beginPath(); ctx.arc(540, 800, 250, 0, 7); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; const x = lerp(200, 880, eInOut(sw));
    const g = ctx.createLinearGradient(x - 90, 0, x + 90, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.translate(540, 800); ctx.rotate(.35); ctx.translate(-540, -800); ctx.fillRect(0, 0, W, H); ctx.restore(); }
  R('Sua próxima história', 540, 1190, t, 21.45, { size: 64, weight: 650, tracking: -1.5, align: 'center' });
  R('começa aqui.', 540, 1268, t, 21.6, { size: 64, weight: 650, tracking: -1.5, align: 'center', color: C.cyan });
  const pk = eOut5(prog(t, 22.35, 22.85));
  if (pk > 0) { ctx.save(); ctx.globalAlpha = pk; ctx.translate(0, (1 - pk) * 24); glass(305, 1350, 470, 96, 48); T('Fale com a GRG', 505, 1411, { size: 40, weight: 700, tracking: -.5, align: 'center' });
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; ctx.lineCap = 'round'; const ax = 700 + Math.sin(t * 4) * 4; ctx.beginPath(); ctx.moveTo(ax - 18, 1398); ctx.lineTo(ax + 12, 1398); ctx.moveTo(ax + 2, 1388); ctx.lineTo(ax + 12, 1398); ctx.lineTo(ax + 2, 1408); ctx.stroke(); ctx.restore(); }
  T('grgviagens.com.br', 540, 1510, { font: 'mono', weight: 500, size: 28, tracking: 3, align: 'center', alpha: .6 * eOut(prog(t, 22.8, 23.3)) });
}

// ---------- slat transition (departure-board flip) ----------
function slats(t, t0, fromFn, toFn) {
  paint(bufA, () => fromFn(t)); paint(bufB, () => toFn(t));
  const n = 16, h = H / n;
  fill(C.deep);
  for (let i = 0; i < n; i++) { const p = prog(t, t0 + i * .012, t0 + i * .012 + .2), y = i * h;
    const src = p < .5 ? bufA : bufB, s = p < .5 ? 1 - eIn(p * 2) : eOut(p * 2 - 1);
    ctx.save(); ctx.translate(0, y + h / 2); ctx.scale(1, Math.max(.001, s)); ctx.drawImage(src, 0, y, W, h, 0, -h / 2, W, h); ctx.restore(); }
}

// ---------- shake ----------
const HITS = [[2.0, 9], [5.75, 4], [6.25, 4], [6.75, 4], [7.25, 4], [8.45, 5], [13.0, 9], [19.75, 5], [20.7, 3]];
function shake(t) { let x = 0, y = 0; for (const [ti, s] of HITS) { if (t < ti) continue; const d = t - ti, k = s * Math.exp(-d * 13); x += k * Math.sin(d * 67 + ti); y += k * Math.cos(d * 53 + ti * 2); } return [x, y]; }

function drawFrame(t) {
  const [sx, sy] = shake(t); ctx.save(); ctx.translate(sx, sy);
  if (t < 2.5) s1(t);
  else if (t < 2.85) slats(t, 2.5, s1, s2);
  else if (t < 5.5) s2(t);
  else if (t < 8.25) s3(t);
  else if (t < 8.45) fill(C.deep);
  else if (t < 9.75) heroViva(t);
  else if (t < 12.75) s4(t);
  else if (t < 13.75) s4b(t);
  else if (t < 17.0) { s5(t); if (t > 13.75 && t < 13.95) { ctx.save(); ctx.globalAlpha = 1 - eOut(prog(t, 13.75, 13.95)); ctx.filter = `blur(${prog(t, 13.75, 13.95) * 20}px)`; s4b(13.75); ctx.restore(); } if (t > 16.8) { const k = eInOut(prog(t, 16.8, 17.0)); s5(t, k); } }
  else if (t < 20.5) s6(t);
  else s7(t);
  // cross dissolve into the end card
  if (t >= 20.3 && t < 20.6) { ctx.save(); ctx.globalAlpha = 1 - prog(t, 20.3, 20.6); s6(t); ctx.restore(); }
  ctx.restore();
  // vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,3,12,.5)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const fo = prog(t, 24.1, 24.5); if (fo > 0) { ctx.fillStyle = `rgba(2,8,22,${fo})`; ctx.fillRect(0, 0, W, H); }
}

// ---------- film grain ----------
const GRAIN = [0, 1, 2, 3, 4, 5].map(i => { const c = document.createElement('canvas'); c.width = 540; c.height = 960; const g = c.getContext('2d'), d = g.createImageData(540, 960), r = rng(i + 70);
  for (let p = 0; p < d.data.length; p += 4) { const v = 128 + (r() - .5) * 255; d.data[p] = d.data[p + 1] = d.data[p + 2] = v; d.data[p + 3] = 255; } g.putImageData(d, 0, 0); return c; });

// final frame = motion-blurred accumulation of sub-frames + grain
function render(t, sub = 3) {
  mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.globalAlpha = 1; mctx.globalCompositeOperation = 'source-over'; mctx.filter = 'none';
  for (let s = 0; s < sub; s++) { paint(bufF, () => drawFrame(Math.max(0, t - s / (FPS * 2 * sub)))); mctx.globalAlpha = 1 / (s + 1); mctx.drawImage(bufF, 0, 0); }
  mctx.globalAlpha = .07; mctx.globalCompositeOperation = 'overlay'; mctx.drawImage(GRAIN[Math.floor(t * 24) % 6], 0, 0, W, H);
  mctx.globalAlpha = 1; mctx.globalCompositeOperation = 'source-over';
}

window.renderFrame = i => render(i / FPS);
window.META = { W, H, FPS, DUR };
window.ready = Promise.all([document.fonts.load(`900 100px "${SANS}"`), document.fonts.load(`500 100px "${SANS}"`), document.fonts.load(`700 30px "${MONO}"`), logo.decode()])
  .then(() => { render(0); return true; });
if (!CAPTURE) window.ready.then(() => {
  const audio = new Audio('assets/music.wav'); let start = null;
  main.addEventListener('click', () => { start = performance.now(); audio.currentTime = 0; audio.play().catch(() => {}); });
  const loop = now => { if (start === null) start = now; render(((now - start) / 1000) % DUR, 1); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
