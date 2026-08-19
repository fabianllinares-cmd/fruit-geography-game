import { audio } from '../audio';
import { DANGER_HOLD_MS } from '../game/danger';
import { MergeEngine } from '../game/engine';
import { GameRenderer } from '../game/render';
import { QuestionDeck, isCorrect, type PresentedQuestion } from '../geography/challenge';
import { QUESTIONS } from '../geography/questions';
import {
  clearGame,
  getBest,
  loadGame,
  loadLastTheme,
  loadSoundEnabled,
  saveBestScore,
  saveGame,
  saveLastTheme,
  saveSoundEnabled,
} from '../persistence';
import { artUrls, uiIcons } from '../assets';
import { preloadUrls } from '../assets/loader';
import { applyThemeVars, getTheme, THEMES, type Theme } from '../themes';
import type { PowerUpId } from '../game/types';

const POWERUPS: Array<{ id: PowerUpId; icon: string; name: string; hint: string }> = [
  { id: 'earthquake', icon: uiIcons.shake, name: 'Shake', hint: 'Jostle the pile' },
  { id: 'remove-small', icon: uiIcons.sweep, name: 'Sweep', hint: 'Clear small objects' },
  { id: 'target-remove', icon: uiIcons.target, name: 'Target', hint: 'Pick one to remove' },
];

function setArt(id: string, src: string | undefined, alt = ''): void {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLImageElement) || !src) return;
  el.src = src;
  el.alt = alt;
}

export class App {
  private theme: Theme;
  private engine: MergeEngine;
  private renderer: GameRenderer;
  private deck = new QuestionDeck();
  private overlays: HTMLElement;
  private pendingPower: PowerUpId | null = null;
  private targetMode = false;
  private aiming = false;
  private lastTs = 0;
  private persistTimer = 0;
  private started = false;

  constructor() {
    const canvas = document.getElementById('board') as HTMLCanvasElement;
    this.overlays = document.getElementById('overlays')!;
    this.theme = getTheme(loadLastTheme());
    this.engine = new MergeEngine();
    this.engine.setThemeId(this.theme.id);
    this.renderer = new GameRenderer(canvas, this.engine);
    audio.setEnabled(loadSoundEnabled());
    this._bindEngine();
    this._bindUi();
    this._renderPowerups();
    applyThemeVars(this.theme);
    this._bindStaticIcons();
    this._syncHud();
    this.renderer.resize();
    preloadUrls(
      artUrls(
        ...THEMES.map((theme) => {
          const urls: Record<string, string> = { icon: theme.icon, background: theme.background };
          for (const obj of theme.objects) urls[obj.id] = obj.visual.src;
          return urls;
        }),
        uiIcons,
      ),
    );
  }

  private _bindStaticIcons(): void {
    setArt('menu-icon', uiIcons.menu, 'Menu');
    setArt('geo-icon', uiIcons.geography, '');
    setArt('energy-icon', uiIcons.energy, '');
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.lastTs = performance.now();
    this.renderer.resize();
    requestAnimationFrame(this._loop);
    const save = loadGame();
    const lastTheme = loadLastTheme();
    if (save && (save.bodies.length > 0 || save.score > 0)) {
      this._showContinue(save.themeId, save.score);
    } else if (!lastTheme) {
      this._showThemes(false);
    }
  }

  private _bindEngine(): void {
    this.engine.setCallbacks({
      onScore: (score, gained, level) => {
        document.getElementById('score')!.textContent = String(score);
        const best = saveBestScore(this.theme.id, score);
        document.getElementById('best')!.textContent = String(best[this.theme.id] ?? score);
        if (gained > 0) {
          document.getElementById('score')!.classList.remove('pop');
          void document.getElementById('score')!.offsetWidth;
        }
        const def = this.theme.objects[this.engine.highestLevel];
        if (def) setArt('highest-art', def.visual.src, def.name);
        void level;
      },
      onMerge: (level, x, y, chain) => {
        const def = this.theme.objects[level];
        this.renderer.fx.burst(x, y, def?.visual.fill ?? '#fff', 8 + chain * 3);
        this.renderer.fx.floatScore(x, y - 8, `+${this.theme.objects[level]?.score ?? 0}`);
        if (chain > 1 || level >= 4) this.renderer.fx.bump(4 + chain);
        audio.merge(chain);
        audio.haptic(chain > 1 ? 22 : 12);
      },
      onCharge: (energy, ready) => this._syncEnergy(energy, ready),
      onQueue: (current, next) => this._syncNext(current, next),
      onDanger: (inDanger) => {
        const tag = document.getElementById('danger-tag')!;
        tag.hidden = !inDanger;
      },
      onGameOver: (stats) => {
        audio.gameOver();
        clearGame();
        this._showGameOver(stats.score, stats.highestLevel, stats.geoCorrect, stats.geoAsked);
      },
      onDrop: () => audio.drop(),
    });
  }

  private _bindUi(): void {
    const canvas = document.getElementById('board') as HTMLCanvasElement;
    canvas.addEventListener('pointerdown', (e) => {
      if (this.engine.paused && !this.targetMode) return;
      const { x, y } = this.renderer.clientToWorld(e.clientX, e.clientY);
      if (this.targetMode) {
        const hit = this.engine.objectAt(x, y);
        if (hit) {
          this.engine.removeBody(hit.id);
          audio.powerup();
          this._leaveTarget();
        }
        return;
      }
      this.aiming = true;
      canvas.setPointerCapture(e.pointerId);
      this.engine.setDropX(x);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.aiming || this.targetMode) return;
      this.engine.setDropX(this.renderer.clientToWorld(e.clientX, e.clientY).x);
    });
    const endAim = (e: PointerEvent) => {
      if (!this.aiming) return;
      this.aiming = false;
      this.engine.setDropX(this.renderer.clientToWorld(e.clientX, e.clientY).x);
      this.engine.drop();
    };
    canvas.addEventListener('pointerup', endAim);
    canvas.addEventListener('pointercancel', () => {
      this.aiming = false;
    });

    document.getElementById('theme-btn')!.addEventListener('click', () => {
      if (this.engine.fruits().length || this.engine.score > 0) {
        this._confirmThemeSwitch();
      } else {
        this._showThemes(true);
      }
    });
    document.getElementById('menu-btn')!.addEventListener('click', () => this._showMenu());
    document.getElementById('target-cancel')!.addEventListener('click', () => this._leaveTarget());

    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Space' || this.engine.paused) return;
      e.preventDefault();
      this.engine.drop();
    });
    window.addEventListener('resize', () => this.renderer.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.engine.addPause('hidden');
        this._persist();
      } else {
        this.engine.removePause('hidden');
        this.lastTs = performance.now();
      }
    });
    window.addEventListener('pagehide', () => this._persist());
  }

  private _renderPowerups(): void {
    const row = document.getElementById('powerups')!;
    row.innerHTML = '';
    for (const p of POWERUPS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'powerup';
      btn.dataset.id = p.id;
      btn.innerHTML = `<img class="powerup-art" src="${p.icon}" alt="" draggable="false"><span class="powerup-name">${p.name}</span>`;
      btn.title = p.hint;
      btn.addEventListener('click', () => this._requestPower(p.id));
      row.appendChild(btn);
    }
    this._syncEnergy(this.engine.charge.energy, this.engine.charge.ready);
  }

  private _requestPower(id: PowerUpId): void {
    if (this.targetMode || this.engine.gameOver) return;
    if (!this.engine.charge.ready) return;
    if (!this.engine.tryConsumeChallenge()) return;
    this._syncEnergy(this.engine.charge.energy, false);
    this.pendingPower = id;
    this.engine.addPause('question');
    const question = this.deck.draw();
    this._showQuestion(question);
  }

  private _applyPower(id: PowerUpId): void {
    if (id === 'earthquake') {
      this.engine.earthquake();
      this.renderer.fx.bump(10);
      audio.powerup();
      audio.haptic(30);
    } else if (id === 'remove-small') {
      const removed = this.engine.removeSmall();
      for (const body of removed) {
        this.renderer.fx.burst(body.position.x, body.position.y, '#fff', 8);
      }
      audio.powerup();
      audio.haptic(18);
    } else {
      this._enterTarget();
      return;
    }
    this._flashPower(id);
  }

  private _enterTarget(): void {
    this.targetMode = true;
    this.renderer.targetMode = true;
    document.getElementById('target-banner')!.hidden = false;
    this.engine.addPause('question');
  }

  private _leaveTarget(): void {
    this.targetMode = false;
    this.renderer.targetMode = false;
    document.getElementById('target-banner')!.hidden = true;
    this.engine.removePause('question');
    this.pendingPower = null;
  }

  private _flashPower(id: PowerUpId): void {
    const btn = document.querySelector(`.powerup[data-id="${id}"]`);
    btn?.classList.remove('flash');
    void (btn as HTMLElement | null)?.offsetWidth;
    btn?.classList.add('flash');
  }

  private _syncHud(): void {
    setArt('theme-icon', this.theme.icon, this.theme.shortName);
    document.getElementById('theme-name')!.textContent = this.theme.shortName;
    document.getElementById('score')!.textContent = String(this.engine.score);
    document.getElementById('best')!.textContent = String(getBest(this.theme.id));
    const top = this.theme.objects[this.engine.highestLevel] ?? this.theme.objects[0];
    setArt('highest-art', top.visual.src, top.name);
    this._syncNext(this.engine.currentLevel, this.engine.nextLevel);
    this._syncEnergy(this.engine.charge.energy, this.engine.charge.ready);
  }

  private _syncNext(current: number, next: number): void {
    const now = this.theme.objects[current];
    const then = this.theme.objects[next];
    if (now) {
      setArt('now-art', now.visual.src, now.name);
      document.getElementById('now-name')!.textContent = now.name;
    }
    if (then) setArt('then-art', then.visual.src, then.name);
  }

  private _syncEnergy(energy: number, ready: boolean): void {
    const fill = document.getElementById('energy-fill')!;
    fill.style.width = `${energy}%`;
    const status = document.getElementById('energy-status')!;
    status.textContent = ready ? 'Challenge ready!' : 'Merges charge a quiz';
    document.querySelector('.energy')!.classList.toggle('ready', ready);
    for (const btn of document.querySelectorAll<HTMLButtonElement>('.powerup')) {
      btn.classList.toggle('ready', ready);
      btn.disabled = !ready || this.engine.gameOver;
    }
  }

  private _clearOverlays(): void {
    this.overlays.innerHTML = '';
    this.engine.removePause('theme');
    this.engine.removePause('menu');
    this.engine.removePause('continue');
    this.engine.removePause('help');
    this.engine.removePause('question');
    this.engine.removePause('gameover');
  }

  private _card(html: string, reason: 'theme' | 'menu' | 'continue' | 'help' | 'question' | 'gameover'): HTMLElement {
    this.overlays.innerHTML = '';
    this.engine.addPause(reason);
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `<div class="card">${html}</div>`;
    this.overlays.appendChild(overlay);
    return overlay;
  }

  private _showThemes(cancellable: boolean): void {
    const overlay = this._card(
      `<h2>Choose your game</h2>
       <p>Same physics. New look. Geography still unlocks the power-ups.</p>
       <div class="theme-grid" id="theme-grid"></div>
       ${cancellable ? '<button type="button" class="btn btn-ghost" data-act="close">Keep playing</button>' : ''}`,
      'theme',
    );
    const grid = overlay.querySelector('#theme-grid')!;
    for (const theme of THEMES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-card';
      btn.innerHTML = `<img class="te" src="${theme.icon}" alt="" draggable="false"><div><b>${theme.name}</b><span>${theme.tagline}</span></div>`;
      btn.addEventListener('click', () => this._selectTheme(theme, true));
      grid.appendChild(btn);
    }
    overlay.querySelector('[data-act="close"]')?.addEventListener('click', () => this._clearOverlays());
  }

  private _confirmThemeSwitch(): void {
    const overlay = this._card(
      `<h2>Switch theme?</h2>
       <p>This ends the current run. Best scores are kept per theme.</p>
       <div class="btn-row">
         <button type="button" class="btn btn-primary" data-act="yes">Change theme</button>
         <button type="button" class="btn btn-ghost" data-act="no">Cancel</button>
       </div>`,
      'theme',
    );
    overlay.querySelector('[data-act="yes"]')?.addEventListener('click', () => this._showThemes(true));
    overlay.querySelector('[data-act="no"]')?.addEventListener('click', () => this._clearOverlays());
  }

  private _selectTheme(theme: Theme, newGame: boolean): void {
    this.theme = theme;
    applyThemeVars(theme);
    saveLastTheme(theme.id);
    this.engine.setThemeId(theme.id);
    if (newGame) {
      this.engine.removePause('gameover');
      this.engine.reset(theme.id);
      clearGame();
    }
    this._clearOverlays();
    this._syncHud();
  }

  private _showContinue(themeId: string, score: number): void {
    const theme = getTheme(themeId);
    const overlay = this._card(
      `<h2>Welcome back</h2>
       <p>Resume ${theme.name} at ${score} points?</p>
       <div class="btn-row">
         <button type="button" class="btn btn-primary" data-act="continue">Continue game</button>
         <button type="button" class="btn btn-ghost" data-act="new">New game</button>
       </div>`,
      'continue',
    );
    overlay.querySelector('[data-act="continue"]')?.addEventListener('click', () => {
      const save = loadGame();
      if (save) {
        this.theme = getTheme(save.themeId);
        applyThemeVars(this.theme);
        this.engine.restore(save);
      }
      this._clearOverlays();
      this._syncHud();
    });
    overlay.querySelector('[data-act="new"]')?.addEventListener('click', () => {
      clearGame();
      this._showThemes(false);
    });
  }

  private _showQuestion(question: PresentedQuestion): void {
    const overlay = this._card(
      `<p class="muted"><img class="inline-icon" src="${uiIcons.quiz}" alt=""> ${question.category}</p>
       <h2>${escapeHtml(question.prompt)}</h2>
       <div class="answers"></div>`,
      'question',
    );
    const answers = overlay.querySelector('.answers')!;
    for (const choice of question.shuffled) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer';
      btn.textContent = choice;
      btn.addEventListener('click', () => this._answer(question, choice, overlay));
      answers.appendChild(btn);
    }
  }

  private _answer(question: PresentedQuestion, choice: string, overlay: HTMLElement): void {
    const correct = isCorrect(question, choice);
    this.engine.recordAnswer(correct);
    for (const btn of overlay.querySelectorAll<HTMLButtonElement>('.answer')) {
      btn.disabled = true;
      if (btn.textContent === question.correct) btn.classList.add('good');
      else if (btn.textContent === choice) btn.classList.add('bad');
    }
    const card = overlay.querySelector('.card')!;
    const note = document.createElement('div');
    note.className = 'feedback';
    if (correct) {
      note.textContent = '✓ Correct!';
      audio.correct();
      if (question.fact) {
        const fact = document.createElement('p');
        fact.className = 'muted';
        fact.textContent = question.fact;
        card.appendChild(note);
        card.appendChild(fact);
      } else {
        card.appendChild(note);
      }
    } else {
      note.textContent = '✗ Not quite.';
      audio.incorrect();
      const ans = document.createElement('p');
      ans.className = 'muted';
      ans.textContent = `Correct answer: ${question.correct}`;
      card.appendChild(note);
      card.appendChild(ans);
    }

    window.setTimeout(() => {
      this.overlays.innerHTML = '';
      this.engine.removePause('question');
      const power = this.pendingPower;
      this.pendingPower = null;
      if (correct && power) this._applyPower(power);
    }, correct ? 900 : 1200);
  }

  private _showGameOver(score: number, highest: number, correct: number, asked: number): void {
    const def = this.theme.objects[highest];
    const accuracy = asked ? `${correct} / ${asked}` : '—';
    const overlay = this._card(
      `<h2>Game over</h2>
       <div class="stats-grid">
         <div><span class="muted">Score</span><b>${score}</b></div>
         <div><span class="muted">Best</span><b>${getBest(this.theme.id)}</b></div>
         <div><span class="muted">Highest</span><b class="highest-stat">${def ? `<img class="inline-icon" src="${def.visual.src}" alt=""> ${def.name}` : ''}</b></div>
         <div><span class="muted">Geography</span><b>${accuracy}</b></div>
       </div>
       <div class="btn-row">
         <button type="button" class="btn btn-primary" data-act="again">Play again</button>
         <button type="button" class="btn btn-ghost" data-act="theme">Change theme</button>
       </div>`,
      'gameover',
    );
    overlay.querySelector('[data-act="again"]')?.addEventListener('click', () => {
      this.engine.removePause('gameover');
      this.engine.reset(this.theme.id);
      this._clearOverlays();
      this._syncHud();
    });
    overlay.querySelector('[data-act="theme"]')?.addEventListener('click', () => this._showThemes(false));
  }

  private _showMenu(): void {
    const asked = this.engine.geoAsked;
    const overlay = this._card(
      `<h2>Fruit Geography</h2>
       <p>Drag to aim, release to drop. Match two of the same to merge. Fill geography energy, then answer a question to use a power-up.</p>
       <p class="muted">Questions this run: ${this.engine.geoCorrect} / ${asked || 0} · Bank: ${QUESTIONS.length}</p>
       <div class="sound-row">
         <span>Sound</span>
         <button type="button" class="btn sound-btn" data-act="sound">${soundLabel(audio.enabled)}</button>
       </div>
       <div class="btn-row">
         <button type="button" class="btn btn-primary" data-act="close">Back</button>
         <button type="button" class="btn btn-ghost" data-act="new">New game</button>
       </div>`,
      'menu',
    );
    overlay.querySelector('[data-act="sound"]')?.addEventListener('click', (e) => {
      audio.setEnabled(!audio.enabled);
      saveSoundEnabled(audio.enabled);
      (e.currentTarget as HTMLButtonElement).innerHTML = soundLabel(audio.enabled);
    });
    overlay.querySelector('[data-act="close"]')?.addEventListener('click', () => this._clearOverlays());
    overlay.querySelector('[data-act="new"]')?.addEventListener('click', () => {
      this.engine.removePause('gameover');
      this.engine.reset(this.theme.id);
      clearGame();
      this._clearOverlays();
      this._syncHud();
    });
  }

  private _persist(): void {
    if (this.engine.gameOver) {
      clearGame();
      return;
    }
    if (this.engine.fruits().length === 0 && this.engine.score === 0) {
      clearGame();
      return;
    }
    saveGame(this.engine.serialize());
  }

  private _loop = (now: number): void => {
    const dt = Math.min(32, now - this.lastTs);
    this.lastTs = now;
    this.engine.update(dt);
    this.renderer.fx.update(dt);
    this.renderer.draw(this.theme, now);
    this.persistTimer += dt;
    if (this.persistTimer > 1500) {
      this.persistTimer = 0;
      this._persist();
    }
    requestAnimationFrame(this._loop);
  };

  /** Debug handle for automated tests. */
  get debug() {
    return {
      engine: this.engine,
      theme: () => this.theme,
      selectTheme: (id: string) => this._selectTheme(getTheme(id), true),
      requestPower: (id: PowerUpId) => this._requestPower(id),
      fillEnergy: () => {
        this.engine.charge.set(100);
        this._syncEnergy(100, true);
      },
      deck: this.deck,
      questions: QUESTIONS,
      dangerHoldMs: DANGER_HOLD_MS,
    };
  }
}

function soundLabel(enabled: boolean): string {
  const src = enabled ? uiIcons['sound-on'] : uiIcons['sound-off'];
  return `<img class="inline-icon" src="${src}" alt=""> ${enabled ? 'On' : 'Off'}`;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
