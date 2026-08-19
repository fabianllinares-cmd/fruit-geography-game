import { assetUrl } from './catalog';

export function spriteImg(relPath: string, alt: string, className = 'sprite'): HTMLImageElement {
  const img = document.createElement('img');
  img.src = assetUrl(relPath);
  img.alt = alt;
  img.draggable = false;
  img.className = className;
  return img;
}

export function setSprite(el: HTMLElement | null, relPath: string, alt: string, className = 'sprite'): void {
  if (!el) return;
  const current = el.querySelector('img');
  if (current && current.getAttribute('src') === assetUrl(relPath)) {
    current.alt = alt;
    return;
  }
  el.replaceChildren(spriteImg(relPath, alt, className));
}
