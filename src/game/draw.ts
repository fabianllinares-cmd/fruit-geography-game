import { getSprite } from '../assets/loader';
import { spriteFrame } from '../assets/sprite-frame';
import type { ObjectDef } from '../themes/types';
import { SPRITE_VISUAL_SCALE } from './colliders';

export function spriteDrawSize(def: ObjectDef, scale = 1): { width: number; height: number } {
  const r = def.radius * scale;
  const dest = r * 2 * SPRITE_VISUAL_SCALE;
  const frame = spriteFrame(def.visual.sprite);
  if (!frame) return { width: dest, height: dest };
  const k = dest / Math.max(frame.sw, frame.sh);
  return { width: frame.sw * k, height: frame.sh * k };
}

/** Draw a production sprite from visible artwork bounds, not the padded PNG canvas. */
export function drawObject(
  ctx: CanvasRenderingContext2D,
  def: ObjectDef,
  angle: number,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
): void {
  const img = getSprite(def.visual.sprite);
  ctx.save();
  ctx.rotate(angle);
  ctx.translate(offsetX, offsetY);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (img && img.complete && img.naturalWidth > 0) {
    const size = spriteDrawSize(def, scale);
    const frame = spriteFrame(def.visual.sprite);
    const r = def.radius * scale;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
    ctx.shadowBlur = Math.max(2, r * 0.16);
    ctx.shadowOffsetY = Math.max(1, r * 0.05);
    if (frame) {
      ctx.drawImage(img, frame.sx, frame.sy, frame.sw, frame.sh, -size.width / 2, -size.height / 2, size.width, size.height);
    } else {
      ctx.drawImage(img, -size.width / 2, -size.height / 2, size.width, size.height);
    }
  }
  ctx.restore();
}
