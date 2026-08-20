import { describe, expect, it } from 'vitest';
import { collisionFor, collisionSize } from '../src/game/collision';
import { RADII } from '../src/themes/types';

describe('collision silhouettes', () => {
  it('uses tighter circles for round sports balls', () => {
    const size = collisionSize('tennis', RADII[3]);
    expect(size.kind).toBe('circle');
    expect(size.hw).toBeLessThan(RADII[3]);
  });

  it('uses narrow rectangles for tall drink glasses', () => {
    const size = collisionSize('champagne', RADII[3]);
    expect(size.kind).toBe('rect');
    expect(size.hw).toBeLessThan(size.hh);
  });

  it('makes strawberry visibly and physically larger than gooseberry but smaller than grapes', () => {
    const gooseberry = collisionSize('gooseberry', RADII[1]);
    const strawberry = collisionSize('strawberry', RADII[2]);
    const grapes = collisionSize('grapes', RADII[3]);
    expect(strawberry.hh).toBeGreaterThan(gooseberry.hh);
    expect(strawberry.bound).toBeGreaterThan(gooseberry.bound);
    expect(strawberry.bound).toBeLessThan(grapes.bound);
    expect(collisionFor('strawberry').fit).toBe('min');
  });

  it('uses elongated rectangles for american football and rugby', () => {
    const football = collisionSize('football', RADII[7]);
    const rugby = collisionSize('rugby', RADII[8]);
    expect(football.kind).toBe('rect');
    expect(rugby.kind).toBe('rect');
    expect(football.hw).toBeGreaterThan(football.hh);
    expect(rugby.hw).toBeGreaterThan(rugby.hh);
  });
});
