import { getSprite } from '../assets/loader';
import type { ObjectDef } from '../themes/types';

/** Draw a production sprite inside the existing circular collision diameter. */
export function drawObject(ctx: CanvasRenderingContext2D, def: ObjectDef, angle: number, scale = 1): void {
  const r = def.radius * scale;
  const img = getSprite(def.visual.sprite);
  ctx.save();
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
    ctx.shadowBlur = Math.max(2, r * 0.16);
    ctx.shadowOffsetY = Math.max(1, r * 0.05);
    ctx.drawImage(img, -r, -r, r * 2, r * 2);
  }
  ctx.restore();
}
