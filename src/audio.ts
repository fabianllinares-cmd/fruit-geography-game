export class AudioBus {
  enabled = true;
  private ctx: AudioContext | null = null;

  setEnabled(on: boolean): void {
    this.enabled = on;
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
}

export const audio = new AudioBus();
