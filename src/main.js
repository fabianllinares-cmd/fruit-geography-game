import './style.css';
import { Game } from './game.js';
import { FRUITS, POWERUPS } from './data.js';

const canvas = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const chargeFill = document.getElementById('charge-fill');
const chargeValue = document.getElementById('charge-value');
const nextEmoji = document.getElementById('next-emoji');
const powerupsEl = document.getElementById('powerups');
const atlasEl = document.getElementById('atlas');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart');

const BEST_KEY = 'fruit-atlas-best';
let best = Number(localStorage.getItem(BEST_KEY) || 0);
bestEl.textContent = String(best);

const game = new Game(canvas, {
  onScore(score) {
    scoreEl.textContent = String(score);
    if (score > best) {
      best = score;
      bestEl.textContent = String(best);
      localStorage.setItem(BEST_KEY, String(best));
    }
  },
  onCharge(charge) {
    const pct = Math.round((charge / game.maxCharge) * 100);
    chargeFill.style.width = `${pct}%`;
    chargeValue.textContent = String(Math.round(charge));
    refreshPowerups();
  },
  onNext(def) {
    nextEmoji.textContent = def.emoji;
  },
  onGameOver(score) {
    finalScoreEl.textContent = `Score: ${score}`;
    gameOverEl.hidden = false;
  },
});

function buildPowerups() {
  powerupsEl.innerHTML = '';
  for (const p of POWERUPS) {
    const btn = document.createElement('button');
    btn.className = 'powerup';
    btn.dataset.id = p.id;
    btn.innerHTML = `
      <span class="powerup-emoji">${p.emoji}</span>
      <span class="powerup-body">
        <span class="powerup-name">${p.name} <kbd>${p.key}</kbd></span>
        <span class="powerup-hint">${p.hint}</span>
      </span>
      <span class="powerup-cost">${p.cost}</span>`;
    btn.addEventListener('click', () => triggerPowerup(p.id));
    powerupsEl.appendChild(btn);
  }
  refreshPowerups();
}

function refreshPowerups() {
  for (const btn of powerupsEl.querySelectorAll('.powerup')) {
    const p = POWERUPS.find((x) => x.id === btn.dataset.id);
    const ready = game.charge >= p.cost;
    btn.classList.toggle('ready', ready);
    btn.disabled = !ready;
  }
}

function triggerPowerup(id) {
  const ok = game.usePowerup(id);
  if (ok) {
    const btn = powerupsEl.querySelector(`.powerup[data-id="${id}"]`);
    btn?.classList.remove('flash');
    void btn?.offsetWidth;
    btn?.classList.add('flash');
  }
}

function buildAtlas() {
  atlasEl.innerHTML = '';
  for (const f of FRUITS) {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="atlas-fruit">${f.emoji}</span>
      <span class="atlas-name">${f.name}</span>
      <span class="atlas-country">${f.flag} ${f.country}</span>`;
    atlasEl.appendChild(li);
  }
}

function canvasX(clientX) {
  const rect = canvas.getBoundingClientRect();
  return ((clientX - rect.left) / rect.width) * canvas.width;
}

canvas.addEventListener('pointermove', (e) => game.setDropX(canvasX(e.clientX)));
canvas.addEventListener('pointerdown', (e) => {
  game.setDropX(canvasX(e.clientX));
  game.drop();
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    game.drop();
  }
  const power = POWERUPS.find((p) => p.key === e.key);
  if (power) triggerPowerup(power.id);
});

restartBtn.addEventListener('click', () => {
  gameOverEl.hidden = true;
  game.reset();
});

buildPowerups();
buildAtlas();
nextEmoji.textContent = FRUITS[game.next].emoji;
game.start();

// Expose for debugging / automated smoke checks.
window.__fruitAtlas = game;
