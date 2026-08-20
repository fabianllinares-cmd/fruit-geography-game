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

    this._danger(ctx);
    this._preview(ctx, theme, now);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT - WALL);
    ctx.clip();
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
    ctx.restore();
    this._walls(ctx);

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

  private _walls(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, WALL, WORLD_HEIGHT);
    ctx.fillRect(WORLD_WIDTH - WALL, 0, WALL, WORLD_HEIGHT);
    ctx.fillRect(0, WORLD_HEIGHT - WALL, WORLD_WIDTH, WALL);
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
