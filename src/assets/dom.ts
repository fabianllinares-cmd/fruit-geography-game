import { assetUrl } from './catalog';
import { getDisplayUrl, rememberVisibleBounds } from './loader';
import { trimInsets } from './visible';

export function spriteImg(relPath: string, alt: string, className = 'sprite'): HTMLImageElement {
  const img = document.createElement('img');
  img.src = getDisplayUrl(relPath) ?? assetUrl(relPath);
  img.alt = alt;
  img.draggable = false;
  img.className = className;
  img.dataset.sprite = relPath;
  bindAlphaFit(img, relPath);
  return img;
}

export function setSprite(el: HTMLElement | null, relPath: string, alt: string, className = 'sprite'): void {
  if (!el) return;
  const current = el.querySelector('img');
  const nextSrc = getDisplayUrl(relPath) ?? assetUrl(relPath);
  if (current && current.getAttribute('src') === nextSrc) {
    current.alt = alt;
    bindAlphaFit(current, relPath);
    return;
  }
  el.replaceChildren(spriteImg(relPath, alt, className));
}

function bindAlphaFit(img: HTMLImageElement, relPath: string): void {
  if (relPath.includes('/ui/')) return;
  const apply = () => applyAlphaFit(img, relPath);
  if (img.complete && img.naturalWidth > 0) apply();
  else img.addEventListener('load', apply, { once: true });
}

function applyAlphaFit(img: HTMLImageElement, relPath: string): void {
  const bounds = rememberVisibleBounds(relPath, img);
  const displayUrl = getDisplayUrl(relPath);
  if (displayUrl && img.getAttribute('src') !== displayUrl) {
    img.addEventListener('load', () => applyAlphaFit(img, relPath), { once: true });
    img.src = displayUrl;
    return;
  }
  if (!bounds || img.naturalWidth < 1) return;
  const inset = trimInsets(bounds, img.naturalWidth, img.naturalHeight);
  img.style.setProperty('--trim-top', `${inset.top * 100}%`);
  img.style.setProperty('--trim-right', `${inset.right * 100}%`);
  img.style.setProperty('--trim-bottom', `${inset.bottom * 100}%`);
  img.style.setProperty('--trim-left', `${inset.left * 100}%`);
  img.style.setProperty('--trim-scale', String(inset.scale));
  img.classList.add('alpha-fit');
}
