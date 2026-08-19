export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  r: number;
}

export interface ScoreFloat {
  x: number;
  y: number;
  text: string;
  life: number;
}

export class FxLayer {
  particles: Particle[] = [];
  floats: ScoreFloat[] = [];
  shake = 0;

  burst(x: number, y: number, color: string, count = 10): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 0.8 + Math.random() * 2.4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.6,
        life: 1,
        max: 1,
        color,
        r: 2 + Math.random() * 3,
      });
    }
  }

  floatScore(x: number, y: number, text: string): void {
    this.floats.push({ x, y, text, life: 1 });
  }

  bump(amount = 5): void {
    this.shake = Math.max(this.shake, amount);
  }

  update(dt: number): void {
    const t = dt / 16;
    this.shake *= 0.86;
    if (this.shake < 0.2) this.shake = 0;
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * t;
      p.y += p.vy * t;
      p.vy += 0.05 * t;
      p.life -= 0.03 * t;
      return p.life > 0;
    });
    this.floats = this.floats.filter((f) => {
      f.y -= 0.45 * t;
      f.life -= 0.018 * t;
      return f.life > 0;
    });
  }

  offset(): { x: number; y: number } {
    if (!this.shake) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.shake,
      y: (Math.random() - 0.5) * this.shake,
    };
  }
}
