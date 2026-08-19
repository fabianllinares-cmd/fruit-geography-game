import './style.css';
import { Game, BOARD } from './game.js';
import { THEMES, getTheme, POWERUPS } from './themes.js';
import { pickQuestion } from './geography.js';
import { drawPiece } from './render.js';

const body = document.body;

// Menu
const themeGrid = document.getElementById('theme-grid');

// Game screen
const screenGame = document.getElementById('screen-game');
const canvas = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const chargeFill = document.getElementById('charge-fill');
const chargeValue = document.getElementById('charge-value');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const powerupsEl = document.getElementById('powerups');
const dangerFlash = document.getElementById('danger-flash');
const backBtn = document.getElementById('back-btn');

// Overlays
const overlayGameover = document.getElementById('overlay-gameover');
const finalScoreEl = document.getElementById('final-score');
const finalBestEl = document.getElementById('final-best');
const restartBtn = document.getElementById('restart');
const toMenuBtn = document.getElementById('to-menu');

const overlayGeo = document.getElementById('overlay-geo');
const geoBtn = document.getElementById('geo-btn');
const geoQuestionEl = document.getElementById('geo-question');
const geoOptionsEl = document.getElementById('geo-options');
const geoFeedbackEl = document.getElementById('geo-feedback');

const GEO_COOLDOWN_MS = 12000;

let game = null;
let theme = null;
let best = 0;

const bestKey = (id) => `fg-best-${id}`;
const getBest = (id) => Number(localStorage.getItem(bestKey(id)) || 0);
const setBest = (id, v) => localStorage.setItem(bestKey(id), String(v));

/* ---------------- Menu ---------------- */
function buildMenu() {
  themeGrid.innerHTML = '';
  for (const t of THEMES) {
    const card = document.createElement('button');
    card.className = 'theme-card';
    card.dataset.id = t.id;
    card.innerHTML = `
      <span class="theme-swatch" style="background:${t.style.bg}">${t.icon}</span>
      <span class="theme-info">
        <span class="theme-name">${t.name}</span>
        <span class="theme-tag">${t.tagline}</span>
      </span>
      <span class="theme-best">★ ${getBest(t.id)}</span>`;
    card.addEventListener('click', () => startTheme(t.id));
    themeGrid.appendChild(card);
  }
}

function showMenu() {
  if (game) game.paused = true;
  body.dataset.screen = 'menu';
  screenGame.hidden = true;
  document.getElementById('screen-menu').hidden = false;
  buildMenu();
}

/* ---------------- Theme + game start ---------------- */
function applyThemeVars(t) {
  const s = t.style;
  const root = document.documentElement.style;
  root.setProperty('--bg', s.bg);
  root.setProperty('--panel', s.panel);
  root.setProperty('--panel-border', s.panelBorder);
  root.setProperty('--text', s.text);
  root.setProperty('--sub', s.sub);
  root.setProperty('--accent', s.accent);
  root.setProperty('--accent2', s.accent2);
  root.setProperty('--frame', s.frame);
  root.setProperty('--danger', s.danger);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', s.mode === 'light' ? '#fde68a' : '#0f172a');
}

function startTheme(id) {
  theme = getTheme(id);
  localStorage.setItem('fg-last-theme', id);
  applyThemeVars(theme);

  document.getElementById('screen-menu').hidden = true;
  screenGame.hidden = false;
  body.dataset.screen = 'game';

  best = getBest(id);
  bestEl.textContent = String(best);

  game = new Game(canvas, theme, {
    onScore(score) {
      scoreEl.textContent = String(score);
      if (score > best) {
        best = score;
        bestEl.textContent = String(best);
        setBest(id, best);
      }
    },
    onCharge(charge) {
      const pct = Math.round((charge / game.maxCharge) * 100);
      chargeFill.style.width = `${pct}%`;
      chargeValue.textContent = String(Math.round(charge));
      refreshPowerups();
    },
    onNext(next) {
      drawNextPreview(next);
    },
    onDanger(level) {
      dangerFlash.classList.toggle('on', level > 0.55);
    },
    onGameOver(score) {
      showGameOver(score);
    },
  });

  window.__game = game;

  overlayGameover.hidden = true;
  overlayGeo.hidden = true;
  dangerFlash.classList.remove('on');
  buildPowerups();
  setGeoEnabled(true);
  scoreEl.textContent = '0';
  chargeFill.style.width = '0%';
  chargeValue.textContent = '0';
  drawNextPreview(theme.levels[game.next]);
  game.start();
}

function drawNextPreview(level) {
  const size = nextCanvas.width;
  nextCtx.clearRect(0, 0, size, size);
  const r = size * 0.42;
  drawPiece(nextCtx, level, size / 2, size / 2, r, 0, theme);
}

/* ---------------- Power-ups ---------------- */
function buildPowerups() {
  powerupsEl.innerHTML = '';
  for (const p of POWERUPS) {
    const btn = document.createElement('button');
    btn.className = 'powerup';
    btn.dataset.id = p.id;
    btn.innerHTML = `
      <span class="powerup-emoji">${p.emoji}</span>
      <span class="powerup-name">${p.name}</span>
      <span class="powerup-cost">${p.cost}</span>`;
    btn.addEventListener('click', () => triggerPowerup(p.id));
    powerupsEl.appendChild(btn);
  }
  refreshPowerups();
}

function refreshPowerups() {
  for (const btn of powerupsEl.querySelectorAll('.powerup')) {
    const p = POWERUPS.find((x) => x.id === btn.dataset.id);
    const ready = game && game.charge >= p.cost && !game.gameOver;
    btn.classList.toggle('ready', ready);
    btn.disabled = !ready;
  }
}

function triggerPowerup(id) {
  if (!game) return;
  const ok = game.usePowerup(id);
  if (ok) {
    const btn = powerupsEl.querySelector(`.powerup[data-id="${id}"]`);
    btn?.classList.remove('flash');
    void btn?.offsetWidth;
    btn?.classList.add('flash');
  }
}

/* ---------------- Geography challenge ---------------- */
let geoReady = true;

function setGeoEnabled(v) {
  geoReady = v;
  geoBtn.disabled = !v;
}

function openGeo() {
  if (!game || !geoReady || game.gameOver) return;
  game.pause();
  const q = pickQuestion();
  geoQuestionEl.textContent = q.q;
  geoFeedbackEl.hidden = true;
  geoFeedbackEl.className = 'geo-feedback';
  geoOptionsEl.innerHTML = '';

  q.options.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'geo-option';
    b.textContent = opt;
    b.addEventListener('click', () => answerGeo(i, q));
    geoOptionsEl.appendChild(b);
  });

  overlayGeo.hidden = false;
}

function answerGeo(choice, q) {
  const buttons = [...geoOptionsEl.querySelectorAll('.geo-option')];
  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === q.answer) b.classList.add('correct');
    else if (i === choice) b.classList.add('wrong');
  });

  const correct = choice === q.answer;
  const bonus = game.applyGeoResult(correct);
  geoFeedbackEl.hidden = false;
  if (correct) {
    geoFeedbackEl.textContent = `Correct! +${bonus} pts · +30 charge`;
    geoFeedbackEl.classList.add('good');
  } else {
    geoFeedbackEl.textContent = `Answer: ${q.options[q.answer]}`;
    geoFeedbackEl.classList.add('bad');
  }

  setGeoEnabled(false);
  setTimeout(() => {
    overlayGeo.hidden = true;
    if (game && !game.gameOver) game.resume();
    setTimeout(() => {
      if (game && !game.gameOver) setGeoEnabled(true);
    }, GEO_COOLDOWN_MS);
  }, 1100);
}

/* ---------------- Game over ---------------- */
function showGameOver(score) {
  finalScoreEl.textContent = `Score: ${score}`;
  finalBestEl.textContent = score >= best ? '🎉 New best!' : `Best: ${best}`;
  overlayGameover.hidden = false;
  refreshPowerups();
  setGeoEnabled(false);
}

restartBtn.addEventListener('click', () => {
  overlayGameover.hidden = true;
  dangerFlash.classList.remove('on');
  game.reset();
  setGeoEnabled(true);
});

toMenuBtn.addEventListener('click', showMenu);
backBtn.addEventListener('click', showMenu);
geoBtn.addEventListener('click', openGeo);

/* ---------------- Input ---------------- */
function toBoardX(clientX) {
  const rect = canvas.getBoundingClientRect();
  return ((clientX - rect.left) / rect.width) * BOARD.W;
}

let pressing = false;
canvas.addEventListener('pointerdown', (e) => {
  if (!game) return;
  pressing = true;
  canvas.setPointerCapture?.(e.pointerId);
  game.setDropX(toBoardX(e.clientX));
});
canvas.addEventListener('pointermove', (e) => {
  if (!game) return;
  game.setDropX(toBoardX(e.clientX));
});
canvas.addEventListener('pointerup', (e) => {
  if (!game || !pressing) return;
  pressing = false;
  game.setDropX(toBoardX(e.clientX));
  game.drop();
});
canvas.addEventListener('pointercancel', () => {
  pressing = false;
});

window.addEventListener('keydown', (e) => {
  if (!game || body.dataset.screen !== 'game') return;
  if (e.code === 'Space') {
    e.preventDefault();
    game.drop();
  } else if (e.key === 'g' || e.key === 'G') {
    openGeo();
  } else {
    const p = POWERUPS.find((x) => x.key === e.key);
    if (p) triggerPowerup(p.id);
  }
});

/* ---------------- Boot ---------------- */
buildMenu();

// Test / debug hooks.
window.__app = {
  startTheme,
  showMenu,
  openGeo,
  get game() {
    return game;
  },
  get theme() {
    return theme;
  },
  themes: THEMES.map((t) => t.id),
};
