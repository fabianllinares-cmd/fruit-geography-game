import { getArt } from '../assets/loader';
import type { ObjectDef, VisualSpec } from '../themes/types';

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  if (Number.isNaN(n)) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) * (1 + amt));
  const g = clamp(((n >> 8) & 255) * (1 + amt));
  const b = clamp((n & 255) * (1 + amt));
  return `rgb(${r},${g},${b})`;
}

function fallbackDisc(ctx: CanvasRenderingContext2D, r: number, spec: VisualSpec): void {
  const grad = ctx.createRadialGradient(-r * 0.32, -r * 0.32, r * 0.12, 0, 0, r);
  grad.addColorStop(0, spec.highlight);
  grad.addColorStop(0.55, spec.fill);
  grad.addColorStop(1, shade(spec.fill, -0.28));
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.06);
  ctx.strokeStyle = spec.stroke;
  ctx.stroke();
}

/** Sprite size vs collision radius. Art may overhang slightly; physics stays circular. */
const ART_SIZE = 2.12;

export function popScale(ageMs: number): number {
  if (ageMs >= 220) return 1;
  const t = ageMs / 220;
  if (t < 0.72) return 0.7 + (1.1 - 0.7) * (t / 0.72);
  return 1.1 + (1 - 1.1) * ((t - 0.72) / 0.28);
}

export function drawObject(
  ctx: CanvasRenderingContext2D,
  def: ObjectDef,
  angle: number,
  scale = 1,
  glowBoost = 0,
): void {
  const r = def.radius * scale;
  const spec = def.visual;
  ctx.save();
  ctx.rotate(angle);
  const glow = spec.glow;
  if (glow || glowBoost > 0) {
    ctx.shadowColor = glow ?? spec.highlight;
    ctx.shadowBlur = r * (0.42 + glowBoost * 0.55);
  }
  const image = getArt(spec.src);
  if (image && image.complete && image.naturalWidth > 0) {
    const size = r * ART_SIZE;
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
  } else {
    fallbackDisc(ctx, r, spec);
  }
  ctx.restore();
}

export function drawGroundShadow(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.78, radius * 0.72, radius * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
