// Renders index.html frame-by-frame with headless Chromium and encodes an MP4.
// Usage:
//   node render.js                 -> out/grg-viagens-v3.mp4 (with assets/music.wav)
//   node render.js --stills 1.6,5  -> out/still-<t>.png for quick checks
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?capture');
  await page.evaluate(() => window.ready);
  const { FPS, DUR } = await page.evaluate(() => window.META);
  const grab = async i => Buffer.from(await page.evaluate(i => {
    window.renderFrame(i);
    return document.getElementById('c').toDataURL('image/png').split(',')[1];
  }, i), 'base64');

  const si = process.argv.indexOf('--stills');
  if (si > 0) {
    for (const s of process.argv[si + 1].split(',')) {
      fs.writeFileSync(path.join(OUT, `still-${s}.png`), await grab(Math.round(parseFloat(s) * FPS)));
    }
    await browser.close(); return;
  }

  const file = path.join(OUT, 'grg-viagens-v3.mp4');
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-i', path.join(__dirname, 'assets', 'music.wav'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(FPS * DUR);
  for (let i = 0; i < total; i++) {
    const buf = await grab(i);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`frame ${i}/${total}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('wrote', file);
})();
