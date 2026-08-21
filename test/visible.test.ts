import { describe, expect, it } from 'vitest';
import {
  NIGHT_GLOW_FILTER,
  containPreviewRect,
  fitDestRect,
  keyBlackMatte,
  opaqueBoundsFromRgba,
  PREVIEW_SAFETY,
  trimInsets,
  visibleBoundsFromRgba,
} from '../src/assets/visible';

describe('visible sprite bounds', () => {
  it('finds the opaque silhouette instead of the canvas padding', () => {
    const width = 8;
    const height = 8;
    const data = new Uint8ClampedArray(width * height * 4);
    const paint = (x: number, y: number) => {
      const i = (y * width + x) * 4;
      data[i] = 200;
      data[i + 1] = 10;
      data[i + 2] = 10;
      data[i + 3] = 255;
    };
    paint(2, 3);
    paint(3, 3);
    paint(3, 4);
    const bounds = visibleBoundsFromRgba(data, width, height);
    expect(bounds).toEqual({ x: 2, y: 3, w: 2, h: 2 });
  });

  it('fits the shorter visible side when requested', () => {
    const wide = fitDestRect(100, 50, 20, 'min');
    expect(wide.h).toBe(40);
    expect(wide.w).toBe(80);
    expect(wide.x).toBe(-40);
    expect(wide.y).toBe(-20);
  });

  it('keeps Night glow as alpha drop-shadows rather than a box glow', () => {
    expect(NIGHT_GLOW_FILTER).toContain('drop-shadow');
    expect(NIGHT_GLOW_FILTER.toLowerCase()).not.toContain('box-shadow');
    const inset = trimInsets({ x: 10, y: 20, w: 80, h: 60 }, 100, 100);
    expect(inset.left).toBeCloseTo(0.1);
    expect(inset.top).toBeCloseTo(0.2);
    expect(inset.right).toBeCloseTo(0.1);
    expect(inset.bottom).toBeCloseTo(0.2);
    expect(inset.scale).toBeCloseTo(100 / 80);
  });

  it('keys opaque black matte pixels out of the visible silhouette', () => {
    const width = 6;
    const height = 6;
    const data = new Uint8ClampedArray(width * height * 4);
    const setPx = (x: number, y: number, r: number, g: number, b: number, a: number) => {
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    };
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) setPx(x, y, 0, 0, 0, 255);
    }
    setPx(2, 2, 40, 90, 220, 255);
    setPx(3, 2, 40, 90, 220, 255);
    setPx(2, 3, 40, 90, 220, 255);
    setPx(3, 3, 40, 90, 220, 255);
    keyBlackMatte(data);
    const bounds = visibleBoundsFromRgba(data, width, height);
    expect(bounds).toEqual({ x: 2, y: 2, w: 2, h: 2 });
    expect(data[3]).toBe(0);
  });

  it('ignores near-white fringe when measuring the opaque fruit body', () => {
    const width = 8;
    const height = 8;
    const data = new Uint8ClampedArray(width * height * 4);
    const setPx = (x: number, y: number, r: number, g: number, b: number, a: number) => {
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    };
    for (let x = 0; x < width; x++) setPx(x, 7, 220, 220, 220, 255);
    setPx(3, 3, 200, 40, 40, 255);
    setPx(4, 3, 200, 40, 40, 255);
    setPx(3, 4, 200, 40, 40, 255);
    setPx(4, 4, 200, 40, 40, 255);
    const visible = visibleBoundsFromRgba(data, width, height);
    const opaque = opaqueBoundsFromRgba(data, width, height);
    expect(visible).toEqual({ x: 0, y: 3, w: 8, h: 5 });
    expect(opaque).toEqual({ x: 3, y: 3, w: 2, h: 2 });
  });

  it('contains tall, wide and round previews in each slot without using gameplay radius', () => {
    expect(PREVIEW_SAFETY).toBeGreaterThanOrEqual(0.88);
    expect(PREVIEW_SAFETY).toBeLessThanOrEqual(0.93);

    const champagne = containPreviewRect(32, 32, 80, 400);
    expect(champagne.h).toBeCloseTo(32 * PREVIEW_SAFETY);
    expect(champagne.w).toBeCloseTo((80 / 400) * 32 * PREVIEW_SAFETY);
    expect(champagne.w).toBeLessThan(champagne.h);
    expect(champagne.x + champagne.w).toBeLessThanOrEqual(32);
    expect(champagne.y + champagne.h).toBeLessThanOrEqual(32);

    const football = containPreviewRect(34, 34, 400, 180);
    expect(football.w).toBeCloseTo(34 * PREVIEW_SAFETY);
    expect(football.h).toBeCloseTo((180 / 400) * 34 * PREVIEW_SAFETY);
    expect(football.h).toBeLessThan(football.w);

    const round = containPreviewRect(26, 26, 100, 100);
    expect(round.w).toBeCloseTo(26 * PREVIEW_SAFETY);
    expect(round.h).toBeCloseTo(26 * PREVIEW_SAFETY);

    const top = containPreviewRect(32, 32, 90, 420);
    const next = containPreviewRect(34, 34, 90, 420);
    const then = containPreviewRect(26, 26, 90, 420);
    expect(next.h).toBeGreaterThan(top.h);
    expect(then.h).toBeLessThan(top.h);
    expect(then.w).toBeLessThan(next.w);
  });
});
