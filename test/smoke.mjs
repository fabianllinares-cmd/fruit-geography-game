import { chromium } from 'playwright';

const URL = process.env.URL || 'http://localhost:5173/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const initial = await page.evaluate(() => {
  const g = window.__fruitAtlas;
  return {
    gameOverHidden: document.getElementById('game-over').hidden,
    running: g?.running,
    gameOver: g?.gameOver,
    score: g?.score,
    fruitCount: g?.world ? g.world.bodies.filter((b) => b.isFruit).length : null,
  };
});
console.log('INITIAL STATE:', JSON.stringify(initial));

// Force deterministic drops by overriding the RNG-based current tier to tier 0.
await page.evaluate(() => {
  const g = window.__fruitAtlas;
  g._pickDropTier = () => 0;
  g.current = 0;
  g.next = 0;
});

// 1) Verify real pointer input drops a fruit.
const box = await page.locator('#board').boundingBox();
const cx = box.x + box.width * 0.5;
await page.mouse.move(cx, box.y + 30);
await page.mouse.down();
await page.mouse.up();
await page.waitForTimeout(200);
const afterClick = await page.evaluate(
  () => window.__fruitAtlas.world.bodies.filter((b) => b.isFruit).length
);
console.log('FRUITS AFTER 1 POINTER CLICK:', afterClick);

// 2) Drop several same-tier fruits to force merges (drive core API directly).
for (let i = 0; i < 8; i++) {
  await page.evaluate((n) => {
    const g = window.__fruitAtlas;
    g.canDrop = true;
    g.current = 0;
    g.setDropX(g.width / 2 + ((n % 2) * 2 - 1) * 8);
    g.drop();
  }, i);
  await page.waitForTimeout(650);
}
await page.waitForTimeout(2500);

const afterDrops = await page.evaluate(() => {
  const g = window.__fruitAtlas;
  const fruits = g.world.bodies.filter((b) => b.isFruit);
  return {
    score: g.score,
    charge: g.charge,
    fruitCount: fruits.length,
    tiers: fruits.map((f) => f.tier).sort(),
    maxTier: fruits.reduce((m, f) => Math.max(m, f.tier), -1),
    gameOver: g.gameOver,
  };
});
console.log('AFTER DROPS:', JSON.stringify(afterDrops));

// Charge the meter directly and test a power-up.
await page.evaluate(() => {
  window.__fruitAtlas.charge = 100;
  window.__fruitAtlas.on.onCharge?.(100);
});
const usedEarthquake = await page.evaluate(() => window.__fruitAtlas.usePowerup('earthquake'));
await page.waitForTimeout(300);
const afterPower = await page.evaluate(() => ({
  charge: window.__fruitAtlas.charge,
}));
console.log('POWERUP earthquake used:', usedEarthquake, 'charge now:', afterPower.charge);

console.log('CONSOLE ERRORS:', consoleErrors.length ? JSON.stringify(consoleErrors) : 'none');

const merged = afterDrops.maxTier > 0;
const pointerDrops = afterClick >= 1;
const ok =
  initial.gameOverHidden === true &&
  initial.running === true &&
  initial.gameOver === false &&
  consoleErrors.length === 0 &&
  pointerDrops &&
  merged;

console.log(
  'RESULT:',
  ok ? 'PASS' : 'FAIL',
  '(pointer click dropped ' + afterClick + ', merged to tier ' + afterDrops.maxTier + ')'
);
await browser.close();
process.exit(ok ? 0 : 1);
