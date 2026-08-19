import { allAssetPaths, assetUrl } from './catalog';

const cache = new Map<string, HTMLImageElement>();
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
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  ).then(() => undefined);
  return preloadPromise;
}
