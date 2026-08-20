import { allAssetPaths, assetUrl } from './catalog';
import {
  keyBlackMatte,
  visibleBoundsFromRgba,
  opaqueBoundsFromRgba,
  NIGHT_GLOW_FILTER,
  type VisibleBounds,
} from './visible';

const cache = new Map<string, HTMLImageElement>();
const boundsCache = new Map<string, VisibleBounds | null>();
const opaqueBoundsCache = new Map<string, VisibleBounds | null>();
const displayCache = new Map<string, HTMLCanvasElement>();
const displayUrlCache = new Map<string, string>();
const hudUrlCache = new Map<string, string>();
const nightGlowCache = new Map<string, NightGlowSprite>();
let preloadPromise: Promise<void> | null = null;

export interface NightGlowSprite {
  canvas: HTMLCanvasElement;
  pad: number;
  w: number;
  h: number;
}

export function getSprite(relPath: string): HTMLImageElement | null {
  const cached = cache.get(relPath);
  if (cached) return cached;
  if (typeof Image === 'undefined') return null;
  const img = new Image();
  img.decoding = 'async';
  img.src = assetUrl(relPath);
  cache.set(relPath, img);
  return img;
}

export function isSpriteReady(relPath: string): boolean {
  const img = getSprite(relPath);
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

export function getDisplaySprite(relPath: string): CanvasImageSource | null {
  return displayCache.get(relPath) ?? getSprite(relPath);
}

export function getDisplayUrl(relPath: string): string | null {
  return displayUrlCache.get(relPath) ?? null;
}

export function getHudUrl(relPath: string): string | null {
  return hudUrlCache.get(relPath) ?? null;
}

export function getVisibleBounds(relPath: string, img?: HTMLImageElement | null): VisibleBounds | null {
  if (boundsCache.has(relPath)) return boundsCache.get(relPath) ?? null;
  const sprite = img ?? getSprite(relPath);
  if (!sprite || !sprite.complete || sprite.naturalWidth < 1) return null;
  return prepareSprite(relPath, sprite);
}

export function getOpaqueBounds(relPath: string): VisibleBounds | null {
  if (opaqueBoundsCache.has(relPath)) return opaqueBoundsCache.get(relPath) ?? null;
  getVisibleBounds(relPath);
  return opaqueBoundsCache.get(relPath) ?? boundsCache.get(relPath) ?? null;
}

export function rememberVisibleBounds(relPath: string, img: HTMLImageElement): VisibleBounds | null {
  if (boundsCache.has(relPath)) return boundsCache.get(relPath) ?? null;
  if (!img.complete || img.naturalWidth < 1) return null;
  return prepareSprite(relPath, img);
}

export function usesBlackMatteKey(relPath: string): boolean {
  return relPath.includes('/fruits/');
}

function prepareSprite(relPath: string, img: HTMLImageElement): VisibleBounds | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  let bounds: VisibleBounds | null = {
    x: 0,
    y: 0,
    w: img.naturalWidth,
    h: img.naturalHeight,
  };
  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (usesBlackMatteKey(relPath)) {
      keyBlackMatte(imageData.data);
      ctx.putImageData(imageData, 0, 0);
      displayCache.set(relPath, canvas);
      displayUrlCache.set(relPath, canvas.toDataURL('image/png'));
    }
    bounds = visibleBoundsFromRgba(imageData.data, canvas.width, canvas.height) ?? bounds;
    const opaque = opaqueBoundsFromRgba(imageData.data, canvas.width, canvas.height) ?? bounds;
    opaqueBoundsCache.set(relPath, opaque);
    bakeHudCrop(relPath, displayCache.get(relPath) ?? canvas, opaque);
  } catch {
    // Tainted canvas: keep the original pixels and full-frame bounds.
  }
  boundsCache.set(relPath, bounds);
  if (!opaqueBoundsCache.has(relPath)) opaqueBoundsCache.set(relPath, bounds);
  if (bounds && usesBlackMatteKey(relPath)) {
    bakeNightGlow(relPath, displayCache.get(relPath) ?? img, bounds);
  }
  return bounds;
}

function bakeHudCrop(relPath: string, src: CanvasImageSource, bounds: VisibleBounds): void {
  if (typeof document === 'undefined' || bounds.w < 1 || bounds.h < 1) return;
  const crop = document.createElement('canvas');
  crop.width = bounds.w;
  crop.height = bounds.h;
  const ctx = crop.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(src, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);
  hudUrlCache.set(relPath, crop.toDataURL('image/png'));
}

/** Pre-render the Night neon glow once per fruit sprite so gameplay never uses ctx.filter. */
export function getNightSprite(relPath: string): NightGlowSprite | null {
  const cached = nightGlowCache.get(relPath);
  if (cached) return cached;
  const bounds = boundsCache.get(relPath);
  const src = displayCache.get(relPath) ?? getSprite(relPath);
  if (!bounds || !src) return null;
  if ('complete' in src && src instanceof HTMLImageElement && (!src.complete || src.naturalWidth < 1)) {
    return null;
  }
  return bakeNightGlow(relPath, src, bounds);
}

function bakeNightGlow(
  relPath: string,
  src: CanvasImageSource,
  bounds: VisibleBounds,
): NightGlowSprite | null {
  if (typeof document === 'undefined') return null;
  const pad = 14;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, bounds.w + pad * 2);
  canvas.height = Math.max(1, bounds.h + pad * 2);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  try {
    ctx.filter = NIGHT_GLOW_FILTER;
    ctx.drawImage(src, bounds.x, bounds.y, bounds.w, bounds.h, pad, pad, bounds.w, bounds.h);
    ctx.filter = 'none';
  } catch {
    ctx.filter = 'none';
    ctx.drawImage(src, bounds.x, bounds.y, bounds.w, bounds.h, pad, pad, bounds.w, bounds.h);
  }
  const sprite: NightGlowSprite = { canvas, pad, w: bounds.w, h: bounds.h };
  nightGlowCache.set(relPath, sprite);
  return sprite;
}

export function preloadAssets(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  if (typeof Image === 'undefined') {
    preloadPromise = Promise.resolve();
    return preloadPromise;
  }
  preloadPromise = Promise.all(
    allAssetPaths().map(
      (file) =>
        new Promise<void>((resolve) => {
          const img = getSprite(file)!;
          const done = () => {
            if (img.naturalWidth > 0) rememberVisibleBounds(file, img);
            resolve();
          };
          if (img.complete && img.naturalWidth > 0) {
            done();
            return;
          }
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  ).then(() => undefined);
  return preloadPromise;
}
