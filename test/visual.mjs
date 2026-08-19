import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const TARGET = process.env.URL || 'http://localhost:5173/';
const OUT = process.env.OUT || path.join(process.cwd(), 'test', 'output');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });

const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.goto(TARGET, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

await page.screenshot({ path: `${OUT}/menu.png` });
console.log('MENU screenshot saved');

const themes = await page.evaluate(() => window.__app.themes);
let allOk = true;

for (const id of themes) {
  await page.evaluate((tid) => window.__app.startTheme(tid), id);
  await page.waitForTimeout(250);
  // Drop a natural-looking mix across the board, forcing several merges.
  for (let i = 0; i < 16; i++) {
    await page.evaluate((n) => {
      const g = window.__game;
      g.canDrop = true;
      g.current = n % 3 === 0 ? 1 : 0;
      const frac = 0.3 + ((n * 0.17) % 0.4);
      g.setDropX(g.width * frac);
      g.drop();
    }, i);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(2200);
  const info = await page.evaluate(() => {
    const g = window.__game;
    return {
      score: Number(document.getElementById('score').textContent),
      scoreVisible: !!document.getElementById('score').offsetParent,
      maxTier: g.world.bodies.filter((b) => b.isPiece).reduce((m, f) => Math.max(m, f.tier), -1),
    };
  });
  await page.screenshot({ path: `${OUT}/theme-${id}.png` });
  const ok = info.score > 0 && info.scoreVisible && info.maxTier > 0;
  allOk = allOk && ok;
  console.log(`THEME ${id}: score=${info.score} maxTier=${info.maxTier} -> ${ok ? 'OK' : 'FAIL'}`);
  await page.evaluate(() => window.__app.showMenu());
  await page.waitForTimeout(120);
}

// Geo modal screenshot.
await page.evaluate(() => window.__app.startTheme('sports'));
await page.waitForTimeout(200);
await page.evaluate(() => window.__app.openGeo());
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/geo-modal.png` });
console.log('GEO modal screenshot saved');

console.log('CONSOLE ERRORS:', errors.length ? JSON.stringify(errors) : 'none');
console.log('RESULT:', allOk && errors.length === 0 ? 'PASS' : 'FAIL');
await browser.close();
process.exit(allOk && errors.length === 0 ? 0 : 1);
