import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AudioBus,
  THEME_MUSIC,
  THEME_MUSIC_LOOP,
  allThemeMusicPaths,
  themeMusicSrc,
} from '../src/audio';
import { setLocale } from '../src/i18n';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

class FakeAudio {
  static instances: FakeAudio[] = [];
  loop = false;
  preload = '';
  volume = 1;
  currentTime = 0;
  duration = 120;
  paused = true;
  ended = false;
  private _src = '';
  private listeners: Record<string, Array<() => void>> = {};

  constructor(src = '') {
    this._src = src;
    FakeAudio.instances.push(this);
  }

  get src(): string {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    this.currentTime = 0;
    this.ended = false;
    this.paused = true;
  }

  play(): Promise<void> {
    if (this.ended) {
      this.currentTime = 0;
      this.ended = false;
    }
    this.paused = false;
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
  }

  addEventListener(type: string, fn: () => void): void {
    (this.listeners[type] ??= []).push(fn);
  }

  /** Simulate the media element reaching the natural end of the track. */
  finish(): void {
    this.currentTime = this.duration;
    this.ended = true;
    this.paused = true;
    for (const fn of this.listeners.ended ?? []) fn();
  }
}

describe('theme music mapping', () => {
  it('maps Classic, Night, Tropical and Sports to their tracks and Drinks to silence', () => {
    expect(themeMusicSrc('classic')).toBe('assets/audio/fruit-merge.mp3');
    expect(themeMusicSrc('night')).toBe('assets/audio/fruitful-vibes.mp3');
    expect(themeMusicSrc('tropical')).toBe('assets/audio/bonsai-master.mp3');
    expect(themeMusicSrc('sports')).toBe('assets/audio/champions-are-made.mp3');
    expect(themeMusicSrc('drinks')).toBeNull();
    expect(THEME_MUSIC.drinks).toBeNull();
  });

  it('does not loop any theme track', () => {
    expect(THEME_MUSIC_LOOP).toBe(false);
  });

  it('keeps all four tracks under public/assets/audio with web-safe names', () => {
    for (const rel of allThemeMusicPaths()) {
      expect(rel.startsWith('assets/audio/')).toBe(true);
      expect(rel.endsWith('.mp3')).toBe(true);
      expect(rel).not.toMatch(/ /);
      expect(existsSync(path.join(root, 'public', rel)), rel).toBe(true);
    }
    expect(allThemeMusicPaths()).toEqual([
      'assets/audio/fruit-merge.mp3',
      'assets/audio/fruitful-vibes.mp3',
      'assets/audio/bonsai-master.mp3',
      'assets/audio/champions-are-made.mp3',
    ]);
    expect(existsSync(path.join(root, 'Champions Are Made.mp3'))).toBe(false);
    expect(existsSync(path.join(root, 'Fruitful Vibes.mp3'))).toBe(false);
    expect(existsSync(path.join(root, 'Fruit Merge.mp3'))).toBe(false);
  });
});

describe('theme music player', () => {
  let bus: AudioBus;

  beforeEach(() => {
    FakeAudio.instances = [];
    vi.stubGlobal('Audio', FakeAudio);
    bus = new AudioBus();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function player(): FakeAudio {
    expect(FakeAudio.instances).toHaveLength(1);
    return FakeAudio.instances[0];
  }

  it('plays the mapped track from the start on a new game and sets loop=false', () => {
    bus.syncThemeMusic('classic', true, true);
    const el = player();
    expect(el.src).toContain('fruit-merge.mp3');
    expect(el.loop).toBe(false);
    expect(el.paused).toBe(false);
    expect(el.currentTime).toBe(0);
  });

  it('plays Night, Tropical and Sports tracks on their new games', () => {
    bus.syncThemeMusic('night', true, true);
    expect(player().src).toContain('fruitful-vibes.mp3');
    bus.syncThemeMusic('tropical', true, true);
    expect(player().src).toContain('bonsai-master.mp3');
    bus.syncThemeMusic('sports', true, true);
    expect(player().src).toContain('champions-are-made.mp3');
    expect(player().loop).toBe(false);
    expect(FakeAudio.instances).toHaveLength(1);
  });

  it('stops the previous track when switching themes and never creates a second Audio', () => {
    bus.syncThemeMusic('classic', true, true);
    const el = player();
    el.currentTime = 40;
    bus.syncThemeMusic('night', true, true);
    expect(FakeAudio.instances).toHaveLength(1);
    expect(el.src).toContain('fruitful-vibes.mp3');
    expect(el.currentTime).toBe(0);
    expect(el.paused).toBe(false);
    expect(bus.musicState().theme).toBe('night');
  });

  it('silences Drinks and stops any previous theme track', () => {
    bus.syncThemeMusic('sports', true, true);
    const el = player();
    el.currentTime = 18;
    bus.syncThemeMusic('drinks', true, true);
    expect(FakeAudio.instances).toHaveLength(1);
    expect(el.paused).toBe(true);
    expect(el.currentTime).toBe(0);
    expect(bus.musicState().want).toBe(false);
    expect(bus.musicState().theme).toBeNull();
  });

  it('does not automatically restart a completed track', () => {
    bus.syncThemeMusic('classic', true, true);
    const el = player();
    el.finish();
    expect(el.paused).toBe(true);
    expect(el.ended).toBe(true);
    bus.resumeMusicIfNeeded();
    bus.syncThemeMusic('classic', true, false);
    expect(el.ended).toBe(true);
    expect(el.paused).toBe(true);
    expect(el.currentTime).toBe(el.duration);
    expect(FakeAudio.instances).toHaveLength(1);
  });

  it('restarts the selected theme from the beginning on a new game', () => {
    bus.syncThemeMusic('tropical', true, true);
    const el = player();
    el.finish();
    bus.syncThemeMusic('tropical', true, true);
    expect(el.currentTime).toBe(0);
    expect(el.paused).toBe(false);
    expect(el.ended).toBe(false);
    expect(el.src).toContain('bonsai-master.mp3');
  });

  it('pauses immediately on mute and resumes the same instance on unmute', () => {
    bus.syncThemeMusic('night', true, true);
    const el = player();
    el.currentTime = 22;
    bus.setEnabled(false);
    expect(el.paused).toBe(true);
    expect(el.currentTime).toBe(22);
    bus.setEnabled(true);
    expect(el.paused).toBe(false);
    expect(el.currentTime).toBe(22);
    expect(el.src).toContain('fruitful-vibes.mp3');
    expect(FakeAudio.instances).toHaveLength(1);
  });

  it('does not restart a finished track when unmuting', () => {
    bus.syncThemeMusic('sports', true, true);
    const el = player();
    el.finish();
    bus.setEnabled(false);
    bus.setEnabled(true);
    expect(el.ended).toBe(true);
    expect(el.paused).toBe(true);
    expect(FakeAudio.instances).toHaveLength(1);
  });

  it('keeps the intended track while muted so unmute does not spawn another Audio', () => {
    bus.syncThemeMusic('classic', true, true);
    bus.setEnabled(false);
    bus.syncThemeMusic('sports', true, true);
    expect(FakeAudio.instances).toHaveLength(1);
    const el = player();
    expect(el.src).toContain('champions-are-made.mp3');
    expect(el.paused).toBe(true);
    bus.setEnabled(true);
    expect(el.paused).toBe(false);
    expect(FakeAudio.instances).toHaveLength(1);
  });

  it('does not restart, rewind, or retarget music when the language changes', () => {
    bus.syncThemeMusic('classic', true, true);
    const el = player();
    el.currentTime = 51;
    setLocale('es');
    setLocale('de');
    bus.resumeMusicIfNeeded();
    expect(FakeAudio.instances).toHaveLength(1);
    expect(el.src).toContain('fruit-merge.mp3');
    expect(el.currentTime).toBe(51);
    expect(el.paused).toBe(false);
    expect(bus.musicState().theme).toBe('classic');
  });

  it('keeps locale switching in the UI from touching the music player', () => {
    const src = readFileSync(path.join(root, 'src/ui/app.ts'), 'utf8');
    const localeFn = src.match(/private _setLocale\([\s\S]*?\n  \}/)?.[0];
    expect(localeFn).toBeTruthy();
    expect(localeFn).not.toMatch(/\baudio\./);
    expect(src).toMatch(/Language must never restart or retarget music/);
  });
});
