import type { Theme } from '../themes/types';
import { drawObject } from './draw';
import { DANGER_Y, DROP_Y, MergeEngine, WALL, WORLD_HEIGHT, WORLD_WIDTH } from './engine';
import { FxLayer } from './fx';

export class GameRenderer {
  readonly fx = new FxLayer();
  targetMode = false;
  private dpr = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly engine: MergeEngine,
  ) {}

  resize(): void {
    const wrap = this.canvas.parentElement;
    if (!wrap) return;
    const cssW = wrap.clientWidth;
    const cssH = wrap.clientHeight;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.round(cssW * this.dpr));
    this.canvas.height = Math.max(1, Math.round(cssH * this.dpr));
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
  }

  clientToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * WORLD_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * WORLD_HEIGHT;
    return { x, y };
  }

  draw(theme: Theme, now: number): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const sx = w / WORLD_WIDTH;
    const sy = h / WORLD_HEIGHT;
    const shake = this.fx.offset();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(sx, 0, 0, sy, shake.x * sx, shake.y * sy);

    this._background(ctx, theme);
    this._danger(ctx);
    this._preview(ctx, theme, now);

    for (const body of this.engine.fruits()) {
      const def = theme.objects[body.gameLevel];
      if (!def) continue;
      const age = now - (body.bornAt || now);
      const pop = age < 180 ? 0.72 + (age / 180) * 0.28 : 1;
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      if (this.targetMode) {
        ctx.shadowColor = 'rgba(250, 250, 250, 0.9)';
        ctx.shadowBlur = 16;
      }
      drawObject(ctx, def, body.angle, pop);
      ctx.restore();
    }

    for (const p of this.fx.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.font = 'bold 13px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    for (const f of this.fx.floats) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 3;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  private _background(ctx: CanvasRenderingContext2D, theme: Theme): void {
    const stage = theme.cssVars['--stage'] ?? '#111';
    const g = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
    if (theme.id === 'classic') {
      g.addColorStop(0, '#fff7ed');
      g.addColorStop(0.55, '#fed7aa');
      g.addColorStop(1, '#fdba74');
    } else if (theme.id === 'night') {
      g.addColorStop(0, '#020617');
      g.addColorStop(0.5, '#1e1b4b');
      g.addColorStop(1, '#312e81');
    } else if (theme.id === 'tropical') {
      g.addColorStop(0, '#7dd3fc');
      g.addColorStop(0.4, '#fb923c');
      g.addColorStop(0.72, '#ea580c');
      g.addColorStop(1, '#fde68a');
    } else if (theme.id === 'sports') {
      g.addColorStop(0, '#14532d');
      g.addColorStop(1, '#3f6212');
    } else {
      g.addColorStop(0, '#2a151c');
      g.addColorStop(1, '#1c1016');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    if (theme.id === 'sports') {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      ctx.strokeRect(28, 130, WORLD_WIDTH - 56, WORLD_HEIGHT - 160);
      ctx.beginPath();
      ctx.arc(WORLD_WIDTH / 2, WORLD_HEIGHT * 0.62, 42, 0, Math.PI * 2);
      ctx.stroke();
    } else if (theme.id === 'tropical') {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(40 + i * 90, 36, 28, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme.id === 'drinks') {
      ctx.fillStyle = 'rgba(232,192,122,0.08)';
      for (let y = 40; y < WORLD_HEIGHT; y += 28) {
        ctx.fillRect(0, y, WORLD_WIDTH, 1);
      }
    }

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, WALL, WORLD_HEIGHT);
    ctx.fillRect(WORLD_WIDTH - WALL, 0, WALL, WORLD_HEIGHT);
    ctx.fillRect(0, WORLD_HEIGHT - WALL, WORLD_WIDTH, WALL);
    void stage;
  }

  private _danger(ctx: CanvasRenderingContext2D): void {
    const hot = this.engine.danger.inDanger;
    ctx.save();
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = hot ? 'rgba(248,113,113,0.95)' : 'rgba(255,255,255,0.45)';
    ctx.lineWidth = hot ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(WALL, DANGER_Y);
    ctx.lineTo(WORLD_WIDTH - WALL, DANGER_Y);
    ctx.stroke();
    ctx.restore();
    if (hot) {
      ctx.fillStyle = 'rgba(248,113,113,0.12)';
      ctx.fillRect(WALL, 0, WORLD_WIDTH - WALL * 2, DANGER_Y);
    }
  }

  private _preview(ctx: CanvasRenderingContext2D, theme: Theme, now: number): void {
    if (!this.engine.canDrop || this.engine.paused) return;
    const def = theme.objects[this.engine.currentLevel];
    if (!def) return;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(this.engine.dropX, DROP_Y);
    ctx.lineTo(this.engine.dropX, WORLD_HEIGHT - WALL);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(this.engine.dropX, DROP_Y);
    ctx.globalAlpha = 0.92;
    const bob = 1 + Math.sin(now / 220) * 0.03;
    drawObject(ctx, def, 0, bob);
    ctx.restore();
  }
}
