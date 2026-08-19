export interface VisibleBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DestRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Subtle arcade neon that follows the sprite alpha silhouette. */
export const NIGHT_GLOW_FILTER =
  'drop-shadow(0 0 1.4px rgba(103,232,255,0.95)) drop-shadow(0 0 4px rgba(59,130,246,0.62)) drop-shadow(0 0 7px rgba(168,85,247,0.32))';

const ALPHA_MIN = 10;

/** Opaque black backing used as a matte in some supplied fruit PNGs. */
export const BLACK_MATTE_MAX = 8;

export function isBlackMatte(r: number, g: number, b: number): boolean {
  return r <= BLACK_MATTE_MAX && g <= BLACK_MATTE_MAX && b <= BLACK_MATTE_MAX;
}

/** Zero alpha on near-black pixels so a black canvas backing is not drawn. */
export function keyBlackMatte(data: Uint8ClampedArray | Uint8Array): void {
  for (let i = 0; i < data.length; i += 4) {
    if (isBlackMatte(data[i], data[i + 1], data[i + 2])) data[i + 3] = 0;
  }
}

function saturationAndLuma(r: number, g: number, b: number): { sat: number; lum: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = (r + g + b) / 3;
  const sat = max === 0 ? 0 : ((max - min) / max) * 255;
  return { sat, lum };
}

function isContactShadowPixel(r: number, g: number, b: number, a: number): boolean {
  if (a <= 8) return false;
  const { sat, lum } = saturationAndLuma(r, g, b);
  // Apple/orange rims sit around sat 70-105, not fully grey.
  return sat < 108 && lum > 118;
}

function isNearWhiteFringe(r: number, g: number, b: number, a: number): boolean {
  if (a <= 8) return false;
  const { sat, lum } = saturationAndLuma(r, g, b);
  return sat < 55 && lum > 155;
}

/**
 * Remove the baked-in pale oval under apple/orange without editing source PNGs.
 * Floods desaturated bright pixels upward from the bottom of the silhouette.
 */
export function keyContactShadow(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
): void {
  const bounds = visibleBoundsFromRgba(data, width, height);
  if (!bounds) return;
  const x0 = bounds.x;
  const y0 = bounds.y;
  const x1 = bounds.x + bounds.w;
  const y1 = bounds.y + bounds.h;
  const ySeed = y0 + Math.floor(bounds.h * 0.72);
  const yLimit = y0 + Math.floor(bounds.h * 0.42);
  const seen = new Uint8Array(width * height);
  const stack: number[] = [];

  const index = (x: number, y: number) => (y * width + x) * 4;
  const mark = (x: number, y: number) => {
    const pixel = y * width + x;
    if (seen[pixel]) return;
    const i = index(x, y);
    if (!isContactShadowPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) return;
    seen[pixel] = 1;
    stack.push(x, y);
  };

  for (let y = ySeed; y < y1; y++) {
    for (let x = x0; x < x1; x++) mark(x, y);
  }

  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    if (x + 1 < x1) mark(x + 1, y);
    if (x - 1 >= x0) mark(x - 1, y);
    if (y + 1 < y1) mark(x, y + 1);
    if (y - 1 >= yLimit) mark(x, y - 1);
    if (x + 1 < x1 && y + 1 < y1) mark(x + 1, y + 1);
    if (x - 1 >= x0 && y + 1 < y1) mark(x - 1, y + 1);
    if (x + 1 < x1 && y - 1 >= yLimit) mark(x + 1, y - 1);
    if (x - 1 >= x0 && y - 1 >= yLimit) mark(x - 1, y - 1);
  }

  for (let p = 0; p < seen.length; p++) {
    if (seen[p]) data[p * 4 + 3] = 0;
  }
}

/** Drop pale fringe pixels that inflate bounds (strawberry canvas bar, etc.). */
export function keyNearWhiteFringe(data: Uint8ClampedArray | Uint8Array): void {
  for (let i = 0; i < data.length; i += 4) {
    if (isNearWhiteFringe(data[i], data[i + 1], data[i + 2], data[i + 3])) data[i + 3] = 0;
  }
}

/** Remove the remaining bright crescent and muddy grey-brown blend at the bottom. */
export function keyBottomRimHighlight(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
): void {
  const bounds = visibleBoundsFromRgba(data, width, height);
  if (!bounds) return;
  const x1 = bounds.x + bounds.w;
  const y1 = bounds.y + bounds.h;
  const yPaleFrom = bounds.y + Math.floor(bounds.h * 0.76);
  const yMudFrom = bounds.y + Math.floor(bounds.h * 0.88);
  for (let y = yPaleFrom; y < y1; y++) {
    for (let x = bounds.x; x < x1; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] <= 8) continue;
      const { sat, lum } = saturationAndLuma(data[i], data[i + 1], data[i + 2]);
      const pale = sat < 115 && lum > 120;
      const mud = y >= yMudFrom && sat < 125 && lum > 88;
      if (pale || mud) data[i + 3] = 0;
    }
  }
}

/**
 * Shave the desaturated brown/grey outline at the bottom of apple/orange.
 * That outline reads as a white crescent once the sprite is scaled down.
 */
export function keyBottomDesatOutline(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
): void {
  const bounds = visibleBoundsFromRgba(data, width, height);
  if (!bounds) return;
  const yMin = bounds.y + Math.floor(bounds.h * 0.82);
  const y1 = bounds.y + bounds.h;
  const x1 = bounds.x + bounds.w;
  for (let x = bounds.x; x < x1; x++) {
    let cleared = 0;
    for (let y = y1 - 1; y >= yMin; y--) {
      const i = (y * width + x) * 4;
      if (data[i + 3] <= 12) continue;
      const { sat, lum } = saturationAndLuma(data[i], data[i + 1], data[i + 2]);
      if (sat < 175 && lum > 42 && cleared < 12) {
        data[i + 3] = 0;
        cleared += 1;
        continue;
      }
      break;
    }
  }
}

/** Tight AABB of pixels whose alpha is above the cutoff. */
export function visibleBoundsFromRgba(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  alphaMin = ALPHA_MIN,
): VisibleBounds | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (data[row + x * 4 + 3] > alphaMin) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Draw fruits larger than their collision circles so piles nest with less air gap. */
export const VISUAL_RADIUS_SCALE = 1.4;

const SPRITE_VISUAL_BOOST: Record<string, number> = {
  'assets/images/fruits/strawberry.png': 1.22,
};

/** Extra visual scale for sprites that otherwise read smaller than the next-smaller fruit. */
export function visualScaleForSprite(relPath: string): number {
  return VISUAL_RADIUS_SCALE * (SPRITE_VISUAL_BOOST[relPath] ?? 1);
}

/**
 * Map visible artwork onto the physics circle.
 * The shorter visible side fills the diameter so wide fruits (strawberry)
 * stay larger than the previous level instead of shrinking to their width.
 */
export function fitDestRect(boundsW: number, boundsH: number, radius: number): DestRect {
  const diameter = radius * 2;
  if (boundsW <= 0 || boundsH <= 0) {
    return { x: -radius, y: -radius, w: diameter, h: diameter };
  }
  const scale = diameter / Math.min(boundsW, boundsH);
  const w = boundsW * scale;
  const h = boundsH * scale;
  return { x: -w / 2, y: -h / 2, w, h };
}

export function trimInsets(bounds: VisibleBounds, canvasW: number, canvasH: number): {
  top: number;
  right: number;
  bottom: number;
  left: number;
  scale: number;
} {
  const top = bounds.y / canvasH;
  const left = bounds.x / canvasW;
  const right = (canvasW - bounds.x - bounds.w) / canvasW;
  const bottom = (canvasH - bounds.y - bounds.h) / canvasH;
  const scale = Math.max(canvasW, canvasH) / Math.max(bounds.w, bounds.h);
  return { top, right, bottom, left, scale };
}

export function sourceSize(img: CanvasImageSource): { w: number; h: number } {
  if ('naturalWidth' in img && typeof img.naturalWidth === 'number' && img.naturalWidth > 0) {
    return { w: img.naturalWidth, h: img.naturalHeight };
  }
  if ('width' in img && typeof img.width === 'number') {
    return { w: img.width, h: img.height };
  }
  return { w: 0, h: 0 };
}
