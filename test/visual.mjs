import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const TARGET = process.env.URL || 'http://localhost:5173/';
const OUT = process.env.OUT || path.join(process.cwd(), 'test', 'output');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 820 } });

const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.goto(TARGET, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const box = await page.locator('#board').boundingBox();
const cx = box.x + box.width * 0.5;

// Real mouse clicks at the SAME x to force stacking + merges.
async function realDrop(fracX = 0.5) {
  const x = box.x + box.width * fracX;
  await page.mouse.move(x, box.y + 20);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(650);
}

for (let i = 0; i < 12; i++) {
  await realDrop(0.5 + (Math.random() - 0.5) * 0.06);
}
await page.waitForTimeout(2500);

const mid = await page.evaluate(() => {
  const g = window.__fruitAtlas;
  const fruits = g.world.bodies.filter((b) => b.isFruit);
  const ys = fruits.map((f) => Math.round(f.position.y));
  return {
    scoreText: document.getElementById('score').textContent,
    scoreVisible: !!document.getElementById('score').offsetParent,
    topbarVisible: !!document.querySelector('.topbar')?.offsetParent,
    fruitCount: fruits.length,
    maxTier: fruits.reduce((m, f) => Math.max(m, f.tier), -1),
    distinctY: new Set(ys).size,
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    charge: g.charge,
  };
});
console.log('AFTER REAL CLICKS:', JSON.stringify(mid));
await page.screenshot({ path: `${OUT}/headless_after_clicks.png` });

// Give enough charge and click the actual Earthquake BUTTON in the DOM.
await page.evaluate(() => {
  window.__fruitAtlas.charge = 100;
  window.__fruitAtlas.on.onCharge?.(100);
});
await page.waitForTimeout(200);
const beforeQuake = await page.evaluate(() =>
  window.__fruitAtlas.world.bodies.filter((b) => b.isFruit).map((f) => Math.round(f.position.y))
);
await page.locator('.powerup[data-id="earthquake"]').click();
await page.waitForTimeout(120);
const afterQuake = await page.evaluate(() => {
  const g = window.__fruitAtlas;
  return {
    appPresent: !!document.getElementById('app'),
    canvasPresent: !!document.getElementById('board'),
    running: g.running,
    gameOver: g.gameOver,
    charge: g.charge,
    ys: g.world.bodies.filter((b) => b.isFruit).map((f) => Math.round(f.position.y)),
  };
});
const moved = afterQuake.ys.some((y, i) => Math.abs(y - (beforeQuake[i] ?? y)) > 2);
console.log('AFTER EARTHQUAKE:', JSON.stringify({ ...afterQuake, moved }));
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/headless_after_earthquake.png` });

console.log('CONSOLE ERRORS:', errors.length ? JSON.stringify(errors) : 'none');

const ok =
  mid.topbarVisible &&
  mid.scoreVisible &&
  Number(mid.scoreText) > 0 &&
  mid.maxTier > 0 &&
  mid.distinctY > 1 &&
  afterQuake.appPresent &&
  afterQuake.canvasPresent &&
  !afterQuake.gameOver &&
  afterQuake.charge === 60 &&
  moved &&
  errors.length === 0;
console.log('RESULT:', ok ? 'PASS' : 'FAIL');
await browser.close();
process.exit(ok ? 0 : 1);
