import { getSprite, getVisibleBounds } from '../assets/loader';
import { NIGHT_GLOW_FILTER, fitDestRect } from '../assets/visible';
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
    const bounds = getVisibleBounds(def.visual.sprite, img) ?? {
      x: 0,
      y: 0,
      w: img.naturalWidth,
      h: img.naturalHeight,
    };
    const dest = fitDestRect(bounds.w, bounds.h, r);
    if (def.visual.style === 'night-fruit') {
      ctx.filter = NIGHT_GLOW_FILTER;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = Math.max(2, r * 0.16);
      ctx.shadowOffsetY = Math.max(1, r * 0.05);
    }
    ctx.drawImage(img, bounds.x, bounds.y, bounds.w, bounds.h, dest.x, dest.y, dest.w, dest.h);
  }
  ctx.restore();
}
