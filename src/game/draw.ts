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

function circle(ctx: CanvasRenderingContext2D, r: number, spec: VisualSpec): void {
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

function leaf(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  ctx.translate(r * 0.15, -r * 0.82);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#4d7c0f';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.28, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function emoji(ctx: CanvasRenderingContext2D, spec: VisualSpec, r: number): void {
  ctx.font = `${Math.round(r * 1.15)}px "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(spec.emoji, 0, r * 0.05);
}

export function drawFruit(ctx: CanvasRenderingContext2D, spec: VisualSpec, r: number, night = false): void {
  if (night && spec.glow) {
    ctx.save();
    ctx.shadowColor = spec.glow;
    ctx.shadowBlur = r * 0.55;
    circle(ctx, r, spec);
    ctx.restore();
  } else {
    circle(ctx, r, spec);
  }
  if (spec.leaf) leaf(ctx, r);
  emoji(ctx, spec, r * 0.92);
}

export function drawBall(ctx: CanvasRenderingContext2D, spec: VisualSpec, r: number): void {
  circle(ctx, r, spec);
  ctx.save();
  ctx.lineWidth = Math.max(1.2, r * 0.07);
  ctx.strokeStyle = spec.stroke;
  switch (spec.ball) {
    case 'pingpong':
      ctx.beginPath();
      ctx.arc(-r * 0.15, 0, r * 0.92, -0.6, 0.6);
      ctx.stroke();
      break;
    case 'golf':
      ctx.strokeStyle = 'rgba(100,116,139,0.45)';
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(i * r * 0.28, -r * 0.1, r * 0.16, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    case 'pool':
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.font = `bold ${Math.round(r * 0.42)}px Trebuchet MS, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(spec.number ?? '3', 0, 1);
      break;
    case 'tennis':
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-r * 0.85, 0, r * 0.95, -0.9, 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 0.85, 0, r * 0.95, Math.PI - 0.9, Math.PI + 0.9);
      ctx.stroke();
      break;
    case 'baseball':
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-r * 0.7, 0, r * 0.85, -0.8, 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 0.7, 0, r * 0.85, Math.PI - 0.8, Math.PI + 0.8);
      ctx.stroke();
      break;
    case 'handball':
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
      break;
    case 'volleyball':
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 0.7, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 0.4, 0, 0, r);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(-r * 0.4, 0, 0, r);
      ctx.stroke();
      break;
    case 'soccer':
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * r * 0.22;
        const y = Math.sin(a) * r * 0.22;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#111827';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'basketball':
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-r * 0.95, 0, r * 0.85, -0.7, 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 0.95, 0, r * 0.85, Math.PI - 0.7, Math.PI + 0.7);
      ctx.stroke();
      break;
    case 'bowling':
      ctx.fillStyle = '#0f172a';
      for (const [x, y] of [
        [-0.22, -0.28],
        [0.08, -0.38],
        [0.18, -0.12],
      ] as const) {
        ctx.beginPath();
        ctx.arc(r * x, r * y, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'championship':
      ctx.strokeStyle = '#854d0e';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#854d0e';
      ctx.font = `bold ${Math.round(r * 0.55)}px Trebuchet MS, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 2);
      break;
    default:
      break;
  }
  ctx.restore();
}

export function drawDrink(ctx: CanvasRenderingContext2D, spec: VisualSpec, r: number): void {
  // Collision body is a circle; illustration sits inside it.
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(28,16,22,0.35)';
  ctx.fill();

  const glass = 'rgba(250, 250, 250, 0.22)';
  const rim = spec.stroke;
  ctx.lineWidth = Math.max(1.4, r * 0.07);
  ctx.strokeStyle = rim;

  const liquid = spec.fill;
  switch (spec.drink) {
    case 'shot': {
      ctx.fillStyle = liquid;
      roundRect(ctx, -r * 0.32, -r * 0.1, r * 0.64, r * 0.55, r * 0.08);
      ctx.fill();
      ctx.strokeStyle = glass;
      roundRect(ctx, -r * 0.32, -r * 0.28, r * 0.64, r * 0.78, r * 0.08);
      ctx.stroke();
      break;
    }
    case 'beer-small':
    case 'pint': {
      ctx.fillStyle = liquid;
      roundRect(ctx, -r * 0.34, -r * 0.35, r * 0.68, r * 0.9, r * 0.1);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      roundRect(ctx, -r * 0.34, -r * 0.35, r * 0.68, r * 0.22, r * 0.1);
      ctx.fill();
      ctx.strokeStyle = glass;
      roundRect(ctx, -r * 0.34, -r * 0.35, r * 0.68, r * 0.9, r * 0.1);
      ctx.stroke();
      break;
    }
    case 'whiskey': {
      ctx.fillStyle = liquid;
      roundRect(ctx, -r * 0.4, -r * 0.05, r * 0.8, r * 0.55, r * 0.1);
      ctx.fill();
      ctx.strokeStyle = glass;
      roundRect(ctx, -r * 0.4, -r * 0.25, r * 0.8, r * 0.8, r * 0.12);
      ctx.stroke();
      break;
    }
    case 'wine-glass': {
      ctx.fillStyle = liquid;
      ctx.beginPath();
      ctx.moveTo(-r * 0.32, -r * 0.15);
      ctx.quadraticCurveTo(0, r * 0.35, r * 0.32, -r * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = glass;
      ctx.beginPath();
      ctx.moveTo(-r * 0.38, -r * 0.45);
      ctx.lineTo(-r * 0.18, r * 0.15);
      ctx.lineTo(r * 0.18, r * 0.15);
      ctx.lineTo(r * 0.38, -r * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, r * 0.15);
      ctx.lineTo(0, r * 0.55);
      ctx.moveTo(-r * 0.22, r * 0.55);
      ctx.lineTo(r * 0.22, r * 0.55);
      ctx.stroke();
      break;
    }
    case 'martini': {
      ctx.fillStyle = liquid;
      ctx.beginPath();
      ctx.moveTo(-r * 0.42, -r * 0.28);
      ctx.lineTo(0, r * 0.18);
      ctx.lineTo(r * 0.42, -r * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = glass;
      ctx.beginPath();
      ctx.moveTo(-r * 0.48, -r * 0.32);
      ctx.lineTo(0, r * 0.22);
      ctx.lineTo(r * 0.48, -r * 0.32);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, r * 0.22);
      ctx.lineTo(0, r * 0.55);
      ctx.moveTo(-r * 0.2, r * 0.55);
      ctx.lineTo(r * 0.2, r * 0.55);
      ctx.stroke();
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(r * 0.12, -r * 0.18, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'cocktail': {
      ctx.fillStyle = liquid;
      ctx.beginPath();
      ctx.moveTo(-r * 0.36, -r * 0.2);
      ctx.lineTo(0, r * 0.28);
      ctx.lineTo(r * 0.36, -r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(-r * 0.05, -r * 0.55, r * 0.08, r * 0.32);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.58, r * 0.16, r * 0.1, 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'wine-bottle':
    case 'champagne': {
      ctx.fillStyle = liquid;
      roundRect(ctx, -r * 0.22, -r * 0.15, r * 0.44, r * 0.7, r * 0.12);
      ctx.fill();
      roundRect(ctx, -r * 0.1, -r * 0.62, r * 0.2, r * 0.5, r * 0.08);
      ctx.fill();
      ctx.fillStyle = spec.drink === 'champagne' ? '#e8c07a' : '#111827';
      roundRect(ctx, -r * 0.1, -r * 0.7, r * 0.2, r * 0.16, r * 0.05);
      ctx.fill();
      break;
    }
    case 'pitcher': {
      ctx.fillStyle = liquid;
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.35);
      ctx.lineTo(-r * 0.3, r * 0.5);
      ctx.lineTo(r * 0.3, r * 0.5);
      ctx.lineTo(r * 0.4, -r * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = glass;
      ctx.beginPath();
      ctx.arc(r * 0.42, -r * 0.05, r * 0.18, -1.2, 1.2);
      ctx.stroke();
      break;
    }
    case 'punch': {
      ctx.fillStyle = liquid;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.15, r * 0.72, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rim;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.05, r * 0.72, r * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(-r * 0.2, 0, r * 0.1, 0, Math.PI * 2);
      ctx.arc(r * 0.15, r * 0.08, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default:
      circle(ctx, r * 0.85, spec);
  }
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number,
): void {
  const r = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawObject(ctx: CanvasRenderingContext2D, def: ObjectDef, angle: number, scale = 1): void {
  const r = def.radius * scale;
  ctx.save();
  ctx.rotate(angle);
  const spec = def.visual;
  if (spec.style === 'ball') drawBall(ctx, spec, r);
  else if (spec.style === 'drink') drawDrink(ctx, spec, r);
  else drawFruit(ctx, spec, r, spec.style === 'night-fruit');
  ctx.restore();
}
