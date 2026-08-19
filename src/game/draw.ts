import { getDisplaySprite, getVisibleBounds } from '../assets/loader';
import { NIGHT_GLOW_FILTER, fitDestRect, sourceSize, visualScaleForSprite } from '../assets/visible';
import type { ObjectDef } from '../themes/types';

/** Draw a production sprite inside the existing circular collision diameter. */
export function drawObject(ctx: CanvasRenderingContext2D, def: ObjectDef, angle: number, scale = 1): void {
  const r = def.radius * scale;
  const bounds = getVisibleBounds(def.visual.sprite);
  const img = getDisplaySprite(def.visual.sprite);
  ctx.save();
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (img) {
    const size = sourceSize(img);
    if (size.w > 0 && size.h > 0) {
      const visible = bounds ?? { x: 0, y: 0, w: size.w, h: size.h };
      const dest = fitDestRect(visible.w, visible.h, r * visualScaleForSprite(def.visual.sprite));
      if (def.visual.style === 'night-fruit') {
        ctx.filter = NIGHT_GLOW_FILTER;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
        ctx.shadowBlur = Math.max(2, r * 0.16);
        ctx.shadowOffsetY = Math.max(1, r * 0.05);
      }
      ctx.drawImage(img, visible.x, visible.y, visible.w, visible.h, dest.x, dest.y, dest.w, dest.h);
    }
  }
  ctx.restore();
}
