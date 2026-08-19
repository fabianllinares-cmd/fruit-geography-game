import { describe, expect, it } from 'vitest';
import {
  NIGHT_GLOW_FILTER,
  fitDestRect,
  keyBlackMatte,
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

  it('fits the longest visible side to the physics diameter', () => {
    const round = fitDestRect(100, 100, 20);
    expect(round).toEqual({ x: -20, y: -20, w: 40, h: 40 });
    const tall = fitDestRect(50, 100, 20);
    expect(tall.w).toBe(20);
    expect(tall.h).toBe(40);
    expect(tall.x).toBe(-10);
    expect(tall.y).toBe(-20);
    const wide = fitDestRect(100, 50, 20);
    expect(wide.w).toBe(40);
    expect(wide.h).toBe(20);
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
});
