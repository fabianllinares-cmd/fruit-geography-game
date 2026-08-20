import { getDisplaySprite, getNightSprite, getOpaqueBounds, getVisibleBounds } from '../assets/loader';
import { fitDestRect, sourceSize } from '../assets/visible';
import { collisionFor } from './collision';
import type { ObjectDef } from '../themes/types';

/** Draw a production sprite fitted to its silhouette-aware collision bounds. */
export function drawObject(ctx: CanvasRenderingContext2D, def: ObjectDef, angle: number, scale = 1): void {
  const r = def.radius * scale;
  const img = getDisplaySprite(def.visual.sprite);
  ctx.save();
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (img) {
    const size = sourceSize(img);
    if (size.w > 0 && size.h > 0) {
      const spec = collisionFor(def.id);
      const vis = getVisibleBounds(def.visual.sprite) ?? { x: 0, y: 0, w: size.w, h: size.h };
      const dest = fitDestRect(vis.w, vis.h, r, spec.fit);
      const opaque = getOpaqueBounds(def.visual.sprite) ?? vis;
      const sx = dest.w / vis.w;
      const sy = dest.h / vis.h;
      const fw = opaque.w * sx;
      const fh = opaque.h * sy;
      const dx = -fw / 2;
      const dy = -fh / 2;
      const night = def.visual.style === 'night-fruit' ? getNightSprite(def.visual.sprite) : null;
      if (night) {
        const nx = dest.w / night.w;
        const ny = dest.h / night.h;
        ctx.drawImage(
          night.canvas,
          dest.x - night.pad * nx,
          dest.y - night.pad * ny,
          dest.w + night.pad * 2 * nx,
          dest.h + night.pad * 2 * ny,
        );
      } else {
        if (def.visual.style === 'night-fruit') {
          // Fallback while the baked glow is still loading: one cheap shadow, not 3 filters.
          ctx.shadowColor = 'rgba(103, 232, 255, 0.85)';
          ctx.shadowBlur = Math.max(4, r * 0.22);
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        } else {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
          ctx.shadowBlur = Math.max(2, r * 0.16);
          ctx.shadowOffsetY = Math.max(1, r * 0.05);
        }
        ctx.drawImage(img, opaque.x, opaque.y, opaque.w, opaque.h, dx, dy, fw, fh);
      }
    }
  }
  ctx.restore();
}
