import { allAssetPaths, assetUrl } from './catalog';
import { keyBlackMatte, keyBottomRimHighlight, keyContactShadow, keyNearWhiteFringe, visibleBoundsFromRgba, type VisibleBounds } from './visible';

const cache = new Map<string, HTMLImageElement>();
const boundsCache = new Map<string, VisibleBounds | null>();
const displayCache = new Map<string, HTMLCanvasElement>();
const displayUrlCache = new Map<string, string>();
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

export function getDisplaySprite(relPath: string): CanvasImageSource | null {
  return displayCache.get(relPath) ?? getSprite(relPath);
}

export function getDisplayUrl(relPath: string): string | null {
  return displayUrlCache.get(relPath) ?? null;
}

export function getVisibleBounds(relPath: string, img?: HTMLImageElement | null): VisibleBounds | null {
  if (boundsCache.has(relPath)) return boundsCache.get(relPath) ?? null;
  const sprite = img ?? getSprite(relPath);
  if (!sprite || !sprite.complete || sprite.naturalWidth < 1) return null;
  return prepareSprite(relPath, sprite);
}

export function rememberVisibleBounds(relPath: string, img: HTMLImageElement): VisibleBounds | null {
  if (boundsCache.has(relPath)) return boundsCache.get(relPath) ?? null;
  if (!img.complete || img.naturalWidth < 1) return null;
  return prepareSprite(relPath, img);
}

export function usesBlackMatteKey(relPath: string): boolean {
  return relPath.includes('/fruits/');
}

export function usesWhiteFringeKey(relPath: string): boolean {
  return relPath.endsWith('/fruits/strawberry.png');
}

export function usesContactShadowKey(relPath: string): boolean {
  return relPath.endsWith('/fruits/apple.png') || relPath.endsWith('/fruits/orange.png');
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
      if (usesWhiteFringeKey(relPath)) keyNearWhiteFringe(imageData.data);
      if (usesContactShadowKey(relPath)) {
        keyContactShadow(imageData.data, canvas.width, canvas.height);
        keyBottomRimHighlight(imageData.data, canvas.width, canvas.height);
      }
      ctx.putImageData(imageData, 0, 0);
      displayCache.set(relPath, canvas);
      displayUrlCache.set(relPath, canvas.toDataURL('image/png'));
    }
    bounds = visibleBoundsFromRgba(imageData.data, canvas.width, canvas.height) ?? bounds;
  } catch {
    // Tainted canvas: keep the original pixels and full-frame bounds.
  }
  boundsCache.set(relPath, bounds);
  return bounds;
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
