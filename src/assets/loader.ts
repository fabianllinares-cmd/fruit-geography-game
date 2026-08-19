const cache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement>>();

function canLoadImages(): boolean {
  return typeof Image !== 'undefined';
}

export function loadArt(src: string): Promise<HTMLImageElement> {
  const hit = cache.get(src);
  if (hit) return Promise.resolve(hit);
  const inflight = pending.get(src);
  if (inflight) return inflight;
  if (!canLoadImages()) return Promise.reject(new Error('no Image'));

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      cache.set(src, img);
      pending.delete(src);
      resolve(img);
    };
    img.onerror = () => {
      pending.delete(src);
      reject(new Error(`Failed to load art: ${src}`));
    };
    img.src = src;
  });
  pending.set(src, promise);
  return promise;
}

export function getArt(src: string | undefined): HTMLImageElement | undefined {
  if (!src) return undefined;
  const hit = cache.get(src);
  if (hit) return hit;
  void loadArt(src).catch(() => undefined);
  return cache.get(src);
}

export function preloadUrls(urls: string[]): void {
  for (const url of urls) {
    if (url) void loadArt(url).catch(() => undefined);
  }
}
