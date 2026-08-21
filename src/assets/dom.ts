import { assetUrl } from './catalog';
import { getDisplayUrl, getHudUrl, getOpaqueBounds, rememberVisibleBounds } from './loader';
import { containPreviewRect } from './visible';

export function spriteImg(relPath: string, alt: string, className = 'sprite'): HTMLImageElement {
  const img = document.createElement('img');
  img.src = getHudUrl(relPath) ?? getDisplayUrl(relPath) ?? assetUrl(relPath);
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
  const nextSrc = getHudUrl(relPath) ?? getDisplayUrl(relPath) ?? assetUrl(relPath);
  if (current && current.getAttribute('src') === nextSrc) {
    current.alt = alt;
    bindAlphaFit(current, relPath);
    return;
  }
  el.replaceChildren(spriteImg(relPath, alt, className));
  const img = el.querySelector('img');
  if (img) schedulePreviewFit(img, relPath);
}

function bindAlphaFit(img: HTMLImageElement, relPath: string): void {
  if (relPath.includes('/ui/')) return;
  const apply = () => applyAlphaFit(img, relPath);
  if (img.complete && img.naturalWidth > 0) apply();
  else img.addEventListener('load', apply, { once: true });
}

function applyAlphaFit(img: HTMLImageElement, relPath: string): void {
  rememberVisibleBounds(relPath, img);
  const hudUrl = getHudUrl(relPath);
  if (hudUrl) {
    if (img.getAttribute('src') !== hudUrl) {
      img.addEventListener('load', () => applyAlphaFit(img, relPath), { once: true });
      img.src = hudUrl;
      return;
    }
    img.dataset.trimmed = '1';
  }
  img.classList.remove('alpha-fit');
  schedulePreviewFit(img, relPath);
}

function visibleSizeForPreview(img: HTMLImageElement, relPath: string): { w: number; h: number } {
  const opaque = getOpaqueBounds(relPath);
  if (img.dataset.trimmed === '1' && img.naturalWidth > 0 && img.naturalHeight > 0) {
    return { w: img.naturalWidth, h: img.naturalHeight };
  }
  if (opaque && opaque.w > 0 && opaque.h > 0) return { w: opaque.w, h: opaque.h };
  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
    return { w: img.naturalWidth, h: img.naturalHeight };
  }
  return { w: 1, h: 1 };
}

/** Size a HUD sprite with contain-fit against its actual slot, not gameplay radius. */
export function fitPreviewImage(img: HTMLImageElement, relPath: string): void {
  const slot = img.parentElement;
  if (!slot) return;
  const availableWidth = slot.clientWidth;
  const availableHeight = slot.clientHeight;
  if (availableWidth < 1 || availableHeight < 1) return;
  const visible = visibleSizeForPreview(img, relPath);
  const dest = containPreviewRect(availableWidth, availableHeight, visible.w, visible.h);
  img.style.width = `${dest.w}px`;
  img.style.height = `${dest.h}px`;
  img.style.maxWidth = 'none';
  img.style.maxHeight = 'none';
}

function schedulePreviewFit(img: HTMLImageElement, relPath: string): void {
  const run = () => fitPreviewImage(img, relPath);
  if (img.parentElement) {
    run();
    observePreviewSlot(img.parentElement, img, relPath);
  } else if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      run();
      if (img.parentElement) observePreviewSlot(img.parentElement, img, relPath);
    });
  }
}

let previewObserver: ResizeObserver | null = null;
const observedSlots = new WeakMap<Element, { img: HTMLImageElement; relPath: string }>();

function observePreviewSlot(slot: HTMLElement, img: HTMLImageElement, relPath: string): void {
  if (typeof ResizeObserver === 'undefined') return;
  observedSlots.set(slot, { img, relPath });
  if (!previewObserver) {
    previewObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const tracked = observedSlots.get(entry.target);
        if (!tracked) continue;
        fitPreviewImage(tracked.img, tracked.relPath);
      }
    });
  }
  previewObserver.observe(slot);
}
