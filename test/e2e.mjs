import { chromium } from 'playwright';

const URL = process.env.URL || 'http://localhost:4173/';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

async function tapTheme(name) {
  await page.getByRole('button', { name: new RegExp(name, 'i') }).click();
  await page.waitForTimeout(200);
}

if (await page.locator('.theme-grid').count()) {
  await tapTheme('Fruit Classic');
}

const box = await page.locator('#board').boundingBox();
if (!box) throw new Error('board missing');

async function dropAt(fracX) {
  const x = box.x + box.width * fracX;
  const y = box.y + 40;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 8, y);
  await page.mouse.up();
  await page.waitForTimeout(500);
}

await page.evaluate(() => {
  const g = window.__game.engine;
  g.reset('classic');
  g.currentLevel = 0;
  g.nextLevel = 0;
});

for (let i = 0; i < 6; i++) {
  await dropAt(0.48 + (i % 2) * 0.04);
}
await page.waitForTimeout(1500);

const afterPlay = await page.evaluate(() => {
  const snap = window.__game.engine.snapshot();
  return {
    score: snap.score,
    bodies: snap.bodyCount,
    nextText: document.getElementById('now-name')?.textContent,
    hud: !!document.querySelector('.hud')?.offsetParent,
  };
});
console.log('AFTER PLAY', afterPlay);

await page.evaluate(() => window.__game.fillEnergy());
await page.locator('.powerup[data-id="earthquake"]').click();
await page.waitForTimeout(200);
const questionVisible = await page.locator('.answers .answer').count();
console.log('QUESTION CHOICES', questionVisible);
await page.locator('.answers .answer').first().click();
await page.waitForTimeout(1400);

const afterQuestion = await page.evaluate(() => ({
  asked: window.__game.engine.geoAsked,
  energy: window.__game.engine.charge.energy,
  overlay: document.querySelector('.overlay') !== null,
}));
console.log('AFTER QUESTION', afterQuestion);

await page.locator('#theme-btn').click();
if (await page.getByRole('button', { name: /Change theme/i }).count()) {
  await page.getByRole('button', { name: /Change theme/i }).click();
}
await tapTheme('Sports');
const sports = await page.evaluate(() => window.__game.theme().id);
console.log('THEME', sports);

const overflow = await page.evaluate(() => ({
  scroll: document.documentElement.scrollHeight > document.documentElement.clientHeight + 2,
  appH: document.getElementById('app')?.getBoundingClientRect().height,
  viewH: window.innerHeight,
}));
console.log('LAYOUT', overflow);
console.log('CONSOLE ERRORS', errors.length ? errors : 'none');

const ok =
  afterPlay.hud &&
  afterPlay.score >= 0 &&
  afterPlay.bodies >= 1 &&
  questionVisible === 4 &&
  afterQuestion.asked >= 1 &&
  sports === 'sports' &&
  !overflow.scroll &&
  errors.length === 0;

console.log('RESULT', ok ? 'PASS' : 'FAIL');
await browser.close();
process.exit(ok ? 0 : 1);
