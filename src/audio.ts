import { assetUrl } from './assets/catalog';

const TROPICAL_MUSIC_SRC = 'assets/audio/bonsai-master.mp3';
const MUSIC_VOLUME = 0.32;
/** Tropical BGM plays through once per run; it must not loop. */
export const TROPICAL_MUSIC_LOOP = false;

export class AudioBus {
  enabled = true;
  private ctx: AudioContext | null = null;
  private music: HTMLAudioElement | null = null;
  private musicTheme: string | null = null;
  private wantTropical = false;

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.pauseMusic();
    else if (this.wantTropical) this.playTropicalMusic();
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

  /** Start or resume the single Tropical gameplay track. Call from a user gesture. */
  playTropicalMusic(restart = false): void {
    this.wantTropical = true;
    if (!this.enabled || typeof Audio === 'undefined') return;
    const el = this._musicEl();
    this.musicTheme = 'tropical';
    if (restart) el.currentTime = 0;
    if (this._trackEnded(el) && !restart) return;
    if (el.paused || restart) {
      void el.play().catch(() => {
        /* autoplay may still be blocked; a later gesture retries */
      });
    }
  }

  stopMusic(): void {
    this.wantTropical = false;
    this.musicTheme = null;
    if (!this.music) return;
    this.music.pause();
    this.music.currentTime = 0;
  }

  pauseMusic(): void {
    this.music?.pause();
  }

  resumeMusicIfNeeded(): void {
    if (!this.wantTropical || !this.enabled) return;
    if (this.music && this._trackEnded(this.music)) return;
    this.playTropicalMusic(false);
  }

  syncThemeMusic(themeId: string, playing: boolean, restart = false): void {
    if (themeId === 'tropical' && playing) this.playTropicalMusic(restart);
    else this.stopMusic();
  }

  private _trackEnded(el: HTMLAudioElement): boolean {
    if (el.ended) return true;
    return el.duration > 0 && el.currentTime >= el.duration - 0.05;
  }

  private _musicEl(): HTMLAudioElement {
    if (this.music) return this.music;
    const el = new Audio(assetUrl(TROPICAL_MUSIC_SRC));
    el.loop = TROPICAL_MUSIC_LOOP;
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
