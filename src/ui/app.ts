import { assetUrl, buttonPath, effectPath } from '../assets/catalog';
import { setSprite, spriteImg } from '../assets/dom';
import { preloadAssets } from '../assets/loader';
import { audio } from '../audio';
import { DANGER_HOLD_MS } from '../game/danger';
import { MergeEngine } from '../game/engine';
import { GameRenderer } from '../game/render';
import {
  QuestionDeck,
  isCorrect,
  questionCount,
  questionById,
  questionsFor,
  difficultyFor,
  type PresentedQuestion,
} from '../questions';
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
  loadLanguage,
  saveLanguage,
} from '../persistence';
import { applyThemeVars, getTheme, themeLogoObject, THEMES, type Theme } from '../themes';
import {
  applyDomI18n,
  initLocale,
  objectName,
  quizSubject,
  quizSubjectKey,
  t,
  themeName,
  themeTagline,
  getLocale,
  setLocale,
  LOCALE_LABELS,
  LOCALES,
  type Locale,
  type MessageKey,
} from '../i18n';
import type { PowerUpId } from '../game/types';

const POWERUPS: Array<{
  id: PowerUpId;
  effect: 'globe' | 'bubbles' | 'target';
  nameKey: MessageKey;
  hintKey: MessageKey;
}> = [
  { id: 'earthquake', effect: 'globe', nameKey: 'powerup.shake', hintKey: 'powerup.shakeHint' },
  { id: 'remove-small', effect: 'bubbles', nameKey: 'powerup.sweep', hintKey: 'powerup.sweepHint' },
  { id: 'target-remove', effect: 'target', nameKey: 'powerup.target', hintKey: 'powerup.targetHint' },
];

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
  private overlayMode: 'theme' | 'menu' | 'continue' | 'help' | 'question' | 'gameover' | 'confirm-theme' | null =
    null;
  private overlayCancellable = false;
  private overlayQuestion: PresentedQuestion | null = null;
  private overlayGameOver: { score: number; highest: number; correct: number; asked: number } | null = null;
  private overlayContinue: { themeId: string; score: number } | null = null;
  private refreshingOverlay = false;

  constructor() {
    const canvas = document.getElementById('board') as HTMLCanvasElement;
    this.overlays = document.getElementById('overlays')!;
    initLocale(loadLanguage());
    this.theme = getTheme(loadLastTheme());
    this.engine = new MergeEngine();
    this.engine.setThemeId(this.theme.id);
    this.renderer = new GameRenderer(canvas, this.engine);
    audio.setEnabled(loadSoundEnabled());
    this._bindEngine();
    this._bindUi();
    applyThemeVars(this.theme);
    this._applyChrome();
    this.renderer.resize();
    void preloadAssets();
  }

  private _applyChrome(): void {
    applyDomI18n();
    document.title = t('app.title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('app.description'));
    this._mountChromeIcons();
    this._renderPowerups();
    this._syncHud();
  }

  /** Relocalize chrome/overlays only. Language must never restart or retarget music. */
  private _setLocale(locale: Locale): void {
    if (getLocale() === locale) return;
    setLocale(locale);
    saveLanguage(locale);
    this._applyChrome();
    this._refreshOverlay();
  }

  private _refreshOverlay(): void {
    this.refreshingOverlay = true;
    try {
      switch (this.overlayMode) {
        case 'menu':
          this._showMenu();
          break;
        case 'help':
          this._showHelp();
          break;
        case 'theme':
          this._showThemes(this.overlayCancellable);
          break;
        case 'confirm-theme':
          this._confirmThemeSwitch();
          break;
        case 'continue':
          if (this.overlayContinue) {
            this._showContinue(this.overlayContinue.themeId, this.overlayContinue.score);
          }
          break;
        case 'question':
          if (this.overlayQuestion) {
            const fresh = questionById(this.overlayQuestion.id, this.theme.id);
            this._showQuestion(fresh ? this.deck.present(fresh) : this.overlayQuestion);
          }
          break;
        case 'gameover':
          if (this.overlayGameOver) {
            this._showGameOver(
              this.overlayGameOver.score,
              this.overlayGameOver.highest,
              this.overlayGameOver.correct,
              this.overlayGameOver.asked,
            );
          }
          break;
        default:
          break;
      }
    } finally {
      this.refreshingOverlay = false;
    }
  }

  private _mountChromeIcons(): void {
    const menu = document.getElementById('menu-btn');
    if (menu && !menu.querySelector('img')) {
      menu.append(spriteImg(buttonPath('menu'), t('hud.menu'), 'ui-icon'));
    }
    setSprite(document.getElementById('energy-icon'), effectPath('energy'), '', 'ui-icon energy-bolt');
    const targetLabel = document.querySelector('#target-banner span');
    if (targetLabel && !targetLabel.querySelector('img')) {
      targetLabel.prepend(spriteImg(effectPath('target'), '', 'ui-icon target-icon'));
    }
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
        if (def) setSprite(document.getElementById('highest-emoji'), def.visual.sprite, objectName(def.id, def.name));
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
        audio.pauseMusic();
      } else {
        this.engine.removePause('hidden');
        this.lastTs = performance.now();
        audio.resumeMusicIfNeeded();
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
      const name = document.createElement('span');
      name.className = 'powerup-name';
      name.textContent = t(p.nameKey);
      btn.append(spriteImg(effectPath(p.effect), '', 'powerup-icon'), name);
      btn.title = t(p.hintKey);
      btn.addEventListener('click', () => this._requestPower(p.id));
      row.appendChild(btn);
    }
    this._syncEnergy(this.engine.charge.energy, this.engine.charge.isReady(this.engine.challengeThreshold));
  }

  private _requestPower(id: PowerUpId): void {
    if (this.targetMode || this.engine.gameOver) return;
    if (!this.engine.charge.isReady(this.engine.challengeThreshold)) return;
    if (!this.engine.tryConsumeChallenge()) return;
    this._syncEnergy(this.engine.charge.energy, false);
    this.pendingPower = id;
    this.engine.addPause('question');
    const tier = difficultyFor(this.engine.score, this.engine.highestLevel, this.engine.droppedCount);
    const question = this.deck.draw(this.theme.id, tier);
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
    const logo = themeLogoObject(this.theme);
    const themeLabel = themeName(this.theme.id);
    setSprite(document.getElementById('theme-emoji'), logo.visual.sprite, themeLabel);
    document.getElementById('theme-name')!.textContent = themeLabel;
    document.getElementById('score')!.textContent = String(this.engine.score);
    document.getElementById('best')!.textContent = String(getBest(this.theme.id));
    const top = this.theme.objects[this.engine.highestLevel] ?? this.theme.objects[0];
    setSprite(document.getElementById('highest-emoji'), top.visual.sprite, objectName(top.id, top.name));
    this._syncNext(this.engine.currentLevel, this.engine.nextLevel);
    this._syncEnergy(this.engine.charge.energy, this.engine.charge.isReady(this.engine.challengeThreshold));
  }

  private _syncNext(current: number, next: number): void {
    const now = this.theme.objects[current];
    const then = this.theme.objects[next];
    if (now) {
      setSprite(document.getElementById('now-emoji'), now.visual.sprite, objectName(now.id, now.name));
      document.getElementById('now-name')!.textContent = objectName(now.id, now.name);
    }
    if (then) setSprite(document.getElementById('then-emoji'), then.visual.sprite, objectName(then.id, then.name));
  }

  private _syncEnergy(energy: number, ready: boolean): void {
    const fill = document.getElementById('energy-fill')!;
    fill.style.width = `${energy}%`;
    const status = document.getElementById('energy-status')!;
    status.textContent = ready ? t('hud.challengeReady') : t('hud.mergesCharge');
    const subject = document.getElementById('energy-subject');
    if (subject) subject.textContent = t(`quiz.energy.${quizSubjectKey(this.theme.id)}`);
    const energyBar = document.querySelector('.energy-bar');
    if (energyBar) energyBar.setAttribute('aria-label', t(`quiz.energy.${quizSubjectKey(this.theme.id)}`));
    document.querySelector('.energy')!.classList.toggle('ready', ready);
    for (const btn of document.querySelectorAll<HTMLButtonElement>('.powerup')) {
      btn.classList.toggle('ready', ready);
      btn.disabled = !ready || this.engine.gameOver;
    }
  }

  private _clearOverlays(): void {
    this.overlays.innerHTML = '';
    this.overlayMode = null;
    this.overlayQuestion = null;
    this.overlayGameOver = null;
    this.overlayContinue = null;
    this.engine.removePause('theme');
    this.engine.removePause('menu');
    this.engine.removePause('continue');
    this.engine.removePause('help');
    this.engine.removePause('question');
    this.engine.removePause('gameover');
  }

  private _card(html: string, reason: 'theme' | 'menu' | 'continue' | 'help' | 'question' | 'gameover'): HTMLElement {
    this.overlays.innerHTML = '';
    this.overlayMode = reason;
    this.engine.addPause(reason);
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `<div class="card">${html}</div>`;
    this.overlays.appendChild(overlay);
    return overlay;
  }

  private _showThemes(cancellable: boolean): void {
    this.overlayCancellable = cancellable;
    if (!cancellable && !this.refreshingOverlay) audio.stopMusic();
    const overlay = this._card(
      `<h2 class="card-title"><img class="ui-icon title-icon" alt="" src="${assetUrl(effectPath('map'))}"> ${escapeHtml(t('theme.chooseTitle'))}</h2>
       <p>${escapeHtml(t('theme.chooseBlurb'))}</p>
       <div class="theme-grid" id="theme-grid"></div>
       ${cancellable ? `<button type="button" class="btn btn-ghost" data-act="close">${escapeHtml(t('theme.keepPlaying'))}</button>` : ''}`,
      'theme',
    );
    const grid = overlay.querySelector('#theme-grid')!;
    for (const theme of THEMES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-card';
      const logo = themeLogoObject(theme);
      const preview = spriteImg(logo.visual.sprite, objectName(logo.id, logo.name), 'te');
      if (theme.id === 'night') preview.classList.add('night-glow');
      const slot = document.createElement('span');
      slot.className = 'sprite-slot te-slot';
      slot.append(preview);
      const copy = document.createElement('div');
      const name = document.createElement('b');
      name.textContent = themeName(theme.id, true);
      const tag = document.createElement('span');
      tag.textContent = themeTagline(theme.id);
      copy.append(name, tag);
      btn.append(slot, copy);
      btn.addEventListener('click', () => this._selectTheme(theme, true));
      grid.appendChild(btn);
    }
    overlay.querySelector('[data-act="close"]')?.addEventListener('click', () => this._clearOverlays());
  }

  private _confirmThemeSwitch(): void {
    const overlay = this._card(
      `<h2>${escapeHtml(t('theme.switchTitle'))}</h2>
       <p>${escapeHtml(t('theme.switchBlurb'))}</p>
       <div class="btn-row">
         <button type="button" class="btn btn-primary" data-act="yes">${escapeHtml(t('theme.change'))}</button>
         <button type="button" class="btn btn-ghost" data-act="no">${escapeHtml(t('theme.cancel'))}</button>
       </div>`,
      'theme',
    );
    this.overlayMode = 'confirm-theme';
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
    audio.syncThemeMusic(theme.id, true, newGame);
  }

  private _showContinue(themeId: string, score: number): void {
    this.overlayContinue = { themeId, score };
    const theme = getTheme(themeId);
    const overlay = this._card(
      `<h2>${escapeHtml(t('game.welcomeBack'))}</h2>
       <p class="resume-line"><img class="sprite resume-sprite" alt="" src="${assetUrl(themeLogoObject(theme).visual.sprite)}"> ${escapeHtml(t('game.resumeAt', { theme: themeName(theme.id, true), score }))}</p>
       <div class="btn-row">
         <button type="button" class="btn btn-primary btn-with-icon" data-act="continue"><img class="ui-icon" alt="" src="${assetUrl(buttonPath('play'))}"> ${escapeHtml(t('game.continue'))}</button>
         <button type="button" class="btn btn-ghost" data-act="new">${escapeHtml(t('game.newGame'))}</button>
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
      audio.syncThemeMusic(this.theme.id, true);
    });
    overlay.querySelector('[data-act="new"]')?.addEventListener('click', () => {
      clearGame();
      this._showThemes(false);
    });
  }

  private _showQuestion(question: PresentedQuestion): void {
    this.overlayQuestion = question;
    const overlay = this._card(
      `<p class="muted quiz-kicker"><img class="ui-icon title-icon" alt="" src="${assetUrl(effectPath('quiz'))}"> ${escapeHtml(question.category)}</p>
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
      note.textContent = t('question.correct');
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
      note.textContent = t('question.wrong');
      audio.incorrect();
      const ans = document.createElement('p');
      ans.className = 'muted';
      ans.textContent = t('question.correctAnswer', { answer: question.correct });
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
    this.overlayGameOver = { score, highest, correct, asked };
    if (!this.refreshingOverlay) audio.pauseMusic();
    const def = this.theme.objects[highest];
    const accuracy = asked ? `${correct} / ${asked}` : '—';
    const overlay = this._card(
      `<h2>${escapeHtml(t('game.gameOver'))}</h2>
       <div class="stats-grid">
         <div><span class="muted">${escapeHtml(t('hud.score'))}</span><b>${score}</b></div>
         <div><span class="muted">${escapeHtml(t('hud.best'))}</span><b>${getBest(this.theme.id)}</b></div>
         <div><span class="muted">${escapeHtml(t('game.highest'))}</span><b class="highest-stat"><img class="sprite" alt="" src="${assetUrl(def?.visual.sprite ?? this.theme.objects[0].visual.sprite)}"> ${escapeHtml(def ? objectName(def.id, def.name) : '')}</b></div>
         <div><span class="muted">${escapeHtml(quizSubject(this.theme.id))}</span><b>${accuracy}</b></div>
       </div>
       <div class="btn-row">
         <button type="button" class="btn btn-primary btn-with-icon" data-act="again"><img class="ui-icon" alt="" src="${assetUrl(buttonPath('play'))}"> ${escapeHtml(t('game.playAgain'))}</button>
         <button type="button" class="btn btn-ghost" data-act="theme">${escapeHtml(t('game.changeTheme'))}</button>
       </div>`,
      'gameover',
    );
    overlay.querySelector('[data-act="again"]')?.addEventListener('click', () => {
      this.engine.removePause('gameover');
      this.engine.reset(this.theme.id);
      this._clearOverlays();
      this._syncHud();
      audio.syncThemeMusic(this.theme.id, true, true);
    });
    overlay.querySelector('[data-act="theme"]')?.addEventListener('click', () => this._showThemes(false));
  }

  private _showMenu(): void {
    const asked = this.engine.geoAsked;
    const locale = getLocale();
    const langButtons = LOCALES.map(
      (code) =>
        `<button type="button" class="lang-btn${code === locale ? ' active' : ''}" data-lang="${code}">${escapeHtml(LOCALE_LABELS[code])}</button>`,
    ).join('');
    const overlay = this._card(
      `<h2>${escapeHtml(t('menu.title'))}</h2>
       <p>${escapeHtml(t('menu.blurb'))}</p>
       <p class="muted">${escapeHtml(t('menu.questionsThisRun', { correct: this.engine.geoCorrect, asked: asked || 0, bank: questionCount(this.theme.id) }))}</p>
       <div class="sound-row">
         <span>${escapeHtml(t('menu.sound'))}</span>
         <button type="button" class="icon-btn sound-btn" data-act="sound" aria-label="${escapeHtml(audio.enabled ? t('menu.mute') : t('menu.unmute'))}">
           <img class="ui-icon" alt="" src="${assetUrl(buttonPath(audio.enabled ? 'sound_on' : 'sound_off'))}">
         </button>
       </div>
       <div class="lang-row">
         <span>${escapeHtml(t('menu.language'))}</span>
         <div class="lang-options">${langButtons}</div>
       </div>
       <div class="btn-row">
         <button type="button" class="btn btn-primary" data-act="close">${escapeHtml(t('menu.resume'))}</button>
         <button type="button" class="btn btn-ghost" data-act="help">${escapeHtml(t('menu.help'))}</button>
         <button type="button" class="btn btn-ghost" data-act="new">${escapeHtml(t('menu.restart'))}</button>
       </div>`,
      'menu',
    );
    overlay.querySelector('[data-act="sound"]')?.addEventListener('click', (e) => {
      this._toggleSound();
      const btn = e.currentTarget as HTMLButtonElement;
      btn.setAttribute('aria-label', audio.enabled ? t('menu.mute') : t('menu.unmute'));
      const img = btn.querySelector('img');
      if (img) img.src = assetUrl(buttonPath(audio.enabled ? 'sound_on' : 'sound_off'));
    });
    for (const btn of overlay.querySelectorAll<HTMLButtonElement>('[data-lang]')) {
      btn.addEventListener('click', () => this._setLocale(btn.dataset.lang as Locale));
    }
    overlay.querySelector('[data-act="close"]')?.addEventListener('click', () => this._clearOverlays());
    overlay.querySelector('[data-act="help"]')?.addEventListener('click', () => this._showHelp());
    overlay.querySelector('[data-act="new"]')?.addEventListener('click', () => {
      this.engine.removePause('gameover');
      this.engine.reset(this.theme.id);
      clearGame();
      this._clearOverlays();
      this._syncHud();
      audio.syncThemeMusic(this.theme.id, true, true);
    });
  }

  private _showHelp(): void {
    const overlay = this._card(
      `<h2>${escapeHtml(t('help.title'))}</h2>
       <p>${escapeHtml(t('help.body'))}</p>
       <div class="btn-row">
         <button type="button" class="btn btn-primary" data-act="back">${escapeHtml(t('menu.back'))}</button>
       </div>`,
      'help',
    );
    overlay.querySelector('[data-act="back"]')?.addEventListener('click', () => this._showMenu());
  }

  private _toggleSound(): void {
    audio.setEnabled(!audio.enabled);
    saveSoundEnabled(audio.enabled);
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
      syncHud: () => this._syncHud(),
      requestPower: (id: PowerUpId) => this._requestPower(id),
      fillEnergy: () => {
        this.engine.charge.set(100);
        this._syncEnergy(100, true);
      },
      deck: this.deck,
      questions: questionsFor(this.theme.id),
      dangerHoldMs: DANGER_HOLD_MS,
      locale: () => getLocale(),
      setLocale: (locale: Locale) => this._setLocale(locale),
    };
  }
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
