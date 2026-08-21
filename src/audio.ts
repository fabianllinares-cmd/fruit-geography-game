import { assetUrl, type ThemeId } from './assets/catalog';

const MUSIC_VOLUME = 0.32;

/** Theme gameplay tracks. `null` means silence (no soundtrack). */
export const THEME_MUSIC = {
  classic: 'assets/audio/fruit-merge.mp3',
  night: 'assets/audio/fruitful-vibes.mp3',
  tropical: 'assets/audio/bonsai-master.mp3',
  sports: 'assets/audio/champions-are-made.mp3',
  drinks: null,
} as const satisfies Record<ThemeId, string | null>;

/** Theme BGM plays through once per run; it must not loop. */
export const THEME_MUSIC_LOOP = false;

export function themeMusicSrc(themeId: string): string | null {
  if (themeId in THEME_MUSIC) return THEME_MUSIC[themeId as ThemeId];
  return null;
}

export function allThemeMusicPaths(): string[] {
  return Object.values(THEME_MUSIC).filter((src): src is string => Boolean(src));
}

export class AudioBus {
  enabled = true;
  private ctx: AudioContext | null = null;
  private music: HTMLAudioElement | null = null;
  private musicTheme: string | null = null;
  private loadedSrc: string | null = null;
  private wantMusic = false;

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.pauseMusic();
    else this.resumeMusicIfNeeded();
  }

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    const Ctor = globalThis.AudioContext || (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!this.ctx) this.ctx = new Ctor();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType, gain = 0.08): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  drop(): void {
    this.tone(240, 0.07, 'sine', 0.06);
  }

  merge(chain: number): void {
    this.tone(340 + chain * 70, 0.12, 'triangle', 0.09);
    if (chain > 1) this.tone(520 + chain * 40, 0.16, 'sine', 0.05);
  }

  correct(): void {
    this.tone(523, 0.1, 'triangle', 0.08);
    setTimeout(() => this.tone(659, 0.12, 'triangle', 0.08), 90);
  }

  incorrect(): void {
    this.tone(180, 0.18, 'sawtooth', 0.05);
  }

  powerup(): void {
    this.tone(392, 0.08, 'square', 0.04);
    setTimeout(() => this.tone(523, 0.12, 'square', 0.04), 80);
  }

  gameOver(): void {
    this.tone(220, 0.2, 'sine', 0.07);
    setTimeout(() => this.tone(174, 0.28, 'sine', 0.06), 140);
  }

  haptic(ms = 14): void {
    if (!this.enabled) return;
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* ignore */
    }
  }

  /** Start or resume the single gameplay track for `themeId`. Call from a user gesture. */
  playThemeMusic(themeId: string, restart = false): void {
    const rel = themeMusicSrc(themeId);
    if (!rel) {
      this.stopMusic();
      return;
    }
    this.wantMusic = true;
    this.musicTheme = themeId;
    if (typeof Audio === 'undefined') return;
    const el = this._musicEl();
    el.loop = THEME_MUSIC_LOOP;
    const url = assetUrl(rel);
    const switched = this.loadedSrc !== url;
    if (switched) {
      el.pause();
      el.src = url;
      this.loadedSrc = url;
      el.loop = THEME_MUSIC_LOOP;
      el.currentTime = 0;
    } else if (restart) {
      el.currentTime = 0;
    }
    if (!this.enabled) return;
    if (this._trackEnded(el) && !restart && !switched) return;
    if (el.paused || restart || switched) {
      void el.play().catch(() => {
        /* autoplay may still be blocked; a later gesture retries */
      });
    }
  }

  stopMusic(): void {
    this.wantMusic = false;
    this.musicTheme = null;
    this.loadedSrc = null;
    if (!this.music) return;
    this.music.pause();
    this.music.currentTime = 0;
  }

  pauseMusic(): void {
    this.music?.pause();
  }

  resumeMusicIfNeeded(): void {
    if (!this.wantMusic || !this.enabled || !this.musicTheme) return;
    if (this.music && this._trackEnded(this.music)) return;
    this.playThemeMusic(this.musicTheme, false);
  }

  /**
   * Align the singleton player with the active theme.
   * `playing` is true once a game in that theme is actually starting/continuing.
   */
  syncThemeMusic(themeId: string, playing: boolean, restart = false): void {
    if (!playing) {
      this.stopMusic();
      return;
    }
    this.playThemeMusic(themeId, restart);
  }

  /** Test/debug snapshot of the one managed player. */
  musicState(): {
    theme: string | null;
    want: boolean;
    src: string | null;
    loop: boolean;
    paused: boolean;
    currentTime: number;
    ended: boolean;
    element: HTMLAudioElement | null;
  } {
    const el = this.music;
    return {
      theme: this.musicTheme,
      want: this.wantMusic,
      src: el?.src ?? this.loadedSrc,
      loop: el?.loop ?? THEME_MUSIC_LOOP,
      paused: el?.paused ?? true,
      currentTime: el?.currentTime ?? 0,
      ended: el ? this._trackEnded(el) : false,
      element: el,
    };
  }

  private _trackEnded(el: HTMLAudioElement): boolean {
    if (el.ended) return true;
    return el.duration > 0 && el.currentTime >= el.duration - 0.05;
  }

  private _musicEl(): HTMLAudioElement {
    if (this.music) return this.music;
    const el = new Audio();
    el.loop = THEME_MUSIC_LOOP;
    el.preload = 'auto';
    el.volume = MUSIC_VOLUME;
    el.addEventListener('ended', () => {
      if (!this.music) return;
      this.music.pause();
    });
    this.music = el;
    return el;
  }
}

export const audio = new AudioBus();
