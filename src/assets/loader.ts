import { allAssetPaths, assetUrl } from './catalog';
import { visibleBoundsFromRgba, type VisibleBounds } from './visible';

const cache = new Map<string, HTMLImageElement>();
const boundsCache = new Map<string, VisibleBounds | null>();
let preloadPromise: Promise<void> | null = null;

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

export function getVisibleBounds(relPath: string, img?: HTMLImageElement | null): VisibleBounds | null {
  if (boundsCache.has(relPath)) return boundsCache.get(relPath) ?? null;
  const sprite = img ?? getSprite(relPath);
  if (!sprite || !sprite.complete || sprite.naturalWidth < 1) return null;
  const bounds = measureImage(sprite);
  boundsCache.set(relPath, bounds);
  return bounds;
}

export function rememberVisibleBounds(relPath: string, img: HTMLImageElement): VisibleBounds | null {
  if (boundsCache.has(relPath)) return boundsCache.get(relPath) ?? null;
  if (!img.complete || img.naturalWidth < 1) return null;
  const bounds = measureImage(img);
  boundsCache.set(relPath, bounds);
  return bounds;
}

function measureImage(img: HTMLImageElement): VisibleBounds | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return visibleBoundsFromRgba(imageData.data, canvas.width, canvas.height);
  } catch {
    return {
      x: 0,
      y: 0,
      w: img.naturalWidth,
      h: img.naturalHeight,
    };
  }
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
