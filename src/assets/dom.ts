import { assetUrl } from './catalog';
import { spriteFrame } from './sprite-frame';

function applyVisibleCrop(img: HTMLImageElement, relPath: string): void {
  const frame = spriteFrame(relPath);
  if (!frame) return;
  const max = Math.max(frame.sw, frame.sh);
  img.classList.add('sprite-cropped');
  img.style.setProperty('--sx', String(frame.sx));
  img.style.setProperty('--sy', String(frame.sy));
  img.style.setProperty('--max', String(max));
  img.style.setProperty('--canvas', '1024');
}

export function spriteImg(relPath: string, alt: string, className = 'sprite'): HTMLImageElement {
  const img = document.createElement('img');
  img.src = assetUrl(relPath);
  img.alt = alt;
  img.draggable = false;
  img.className = className;
  applyVisibleCrop(img, relPath);
  return img;
}

export function setSprite(el: HTMLElement | null, relPath: string, alt: string, className = 'sprite'): void {
  if (!el) return;
  const current = el.querySelector('img');
  if (current && current.getAttribute('src') === assetUrl(relPath)) {
    current.alt = alt;
    applyVisibleCrop(current, relPath);
    return;
  }
  el.replaceChildren(spriteImg(relPath, alt, className));
}
