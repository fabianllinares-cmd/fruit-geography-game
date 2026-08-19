import { chromium } from 'playwright';

const URL = process.env.URL || 'http://localhost:5173/';

const browser = await chromium.launch();
// Portrait phone viewport (Pixel-class Android).
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });

const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

const themes = await page.evaluate(() => window.__app.themes);
console.log('THEMES:', JSON.stringify(themes));
let allThemesMerged = true;

async function forceMerges(count = 10) {
  for (let i = 0; i < count; i++) {
    await page.evaluate((n) => {
      const g = window.__game;
      g.canDrop = true;
      g.current = 0;
      g.setDropX(g.width / 2 + ((n % 2) * 2 - 1) * 6);
      g.drop();
    }, i);
    await page.waitForTimeout(520);
  }
  await page.waitForTimeout(2200);
}

for (const id of themes) {
  await page.evaluate((tid) => window.__app.startTheme(tid), id);
  await page.waitForTimeout(250);
  await forceMerges(10);
  const res = await page.evaluate(() => {
    const g = window.__game;
    const pieces = g.world.bodies.filter((b) => b.isPiece);
    return { theme: g.theme.id, score: g.score, maxTier: pieces.reduce((m, f) => Math.max(m, f.tier), -1) };
  });
  const merged = res.maxTier > 0;
  allThemesMerged = allThemesMerged && merged;
  console.log(`THEME ${id}: score=${res.score} maxTier=${res.maxTier} merged=${merged}`);
  await page.evaluate(() => window.__app.showMenu());
  await page.waitForTimeout(150);
}

// Detailed checks on one theme with real pointer input.
await page.evaluate(() => window.__app.startTheme('fruit-classic'));
await page.waitForTimeout(250);

const initial = await page.evaluate(() => ({
  running: window.__game.running,
  gameOver: window.__game.gameOver,
  gameoverHidden: document.getElementById('overlay-gameover').hidden,
}));
console.log('INITIAL:', JSON.stringify(initial));

const box = await page.locator('#board').boundingBox();
await page.evaluate(() => {
  window.__game.current = 0;
});
await page.mouse.move(box.x + box.width * 0.5, box.y + 40);
await page.mouse.down();
await page.mouse.up();
await page.waitForTimeout(250);
const afterClick = await page.evaluate(() => window.__game.world.bodies.filter((b) => b.isPiece).length);
console.log('PIECES AFTER 1 POINTER TAP:', afterClick);

// Power-up.
await page.evaluate(() => {
  window.__game.charge = 100;
  window.__game.on.onCharge?.(100);
});
const usedPower = await page.evaluate(() => window.__game.usePowerup('earthquake'));
const chargeAfter = await page.evaluate(() => window.__game.charge);
console.log('EARTHQUAKE used:', usedPower, 'charge:', chargeAfter);

// Geography challenge: open, answer correctly via the DOM.
const geoResult = await page.evaluate(() => {
  const g = window.__game;
  const scoreBefore = g.score;
  const chargeBefore = g.charge;
  window.__app.openGeo();
  const paused = g.paused;
  return { scoreBefore, chargeBefore, paused };
});
await page.waitForTimeout(150);
// Click the correct option (marked by app state): find via pickQuestion answer.
const geoAnswered = await page.evaluate(() => {
  // The correct button is unknown to the DOM until clicked; click each and read.
  // Instead, brute force: click the first option, then inspect.
  return document.getElementById('overlay-geo').hidden === false;
});
console.log('GEO modal open:', geoAnswered, 'paused:', geoResult.paused);
// Click first option and verify feedback + resume.
await page.locator('.geo-option').first().click();
await page.waitForTimeout(1400);
const geoDone = await page.evaluate(() => ({
  modalHidden: document.getElementById('overlay-geo').hidden,
  resumed: !window.__game.paused,
}));
console.log('GEO after answer:', JSON.stringify(geoDone));

console.log('CONSOLE ERRORS:', consoleErrors.length ? JSON.stringify(consoleErrors) : 'none');

const ok =
  themes.length === 5 &&
  allThemesMerged &&
  initial.running === true &&
  initial.gameOver === false &&
  initial.gameoverHidden === true &&
  afterClick >= 1 &&
  usedPower === true &&
  chargeAfter === 65 &&
  geoResult.paused === true &&
  geoDone.modalHidden === true &&
  geoDone.resumed === true &&
  consoleErrors.length === 0;

console.log('RESULT:', ok ? 'PASS' : 'FAIL');
await browser.close();
process.exit(ok ? 0 : 1);
