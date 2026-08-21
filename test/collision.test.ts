import { describe, expect, it } from 'vitest';
import { collisionFor, collisionSize } from '../src/game/collision';
import { RADII } from '../src/themes/types';
import { sportsTheme } from '../src/themes/sports';
import { drinksTheme } from '../src/themes/drinks';
import { classicTheme } from '../src/themes/classic';
import { tropicalTheme } from '../src/themes/tropical';

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

  it('uses an elongated capsule for american football and a diagonal compound for rugby', () => {
    const football = collisionSize('football', RADII[7]);
    const rugby = collisionSize('rugby', RADII[8]);
    expect(football.kind).toBe('capsule');
    expect(football.hw).toBeGreaterThan(football.hh);
    expect(rugby.kind).toBe('compound');
    expect(rugby.parts?.length).toBeGreaterThanOrEqual(3);
    expect(rugby.hw).toBeGreaterThan(rugby.hh);
  });

  it('keeps Tropical drawing fit while matching opaque fruit mass more closely', () => {
    expect(collisionFor('raspberry').fit).toBe('min');
    expect(collisionFor('starfruit').fit).toBe('min');
    expect(collisionFor('banana').fit).toBe('min');
    expect(collisionFor('dragonfruit').fit).toBe('min');
    expect(collisionFor('papaya').fit).toBe('min');
    expect(collisionFor('coconut').fit).toBe('min');
    expect(collisionFor('kiwi').fit).toBe('max');
    expect(collisionFor('passionfruit').fit).toBe('max');
    expect(collisionFor('mango').fit).toBe('max');

    const raspberry = collisionSize('raspberry', RADII[0]);
    expect(raspberry.kind).toBe('circle');
    expect(raspberry.bound).toBeGreaterThan(RADII[0] * 0.88);
    expect(raspberry.bound).toBeLessThan(RADII[0] * 1.02);

    const kiwi = collisionSize('kiwi', RADII[1]);
    expect(kiwi.kind).toBe('circle');
    expect(kiwi.bound).toBeGreaterThan(RADII[1] * 0.98);

    const starfruit = collisionSize('starfruit', RADII[2]);
    expect(starfruit.kind).toBe('compound');
    expect(starfruit.parts?.length).toBeGreaterThanOrEqual(4);
    expect(starfruit.bound).toBeGreaterThan(RADII[2] * 0.9);
    expect(starfruit.bound).toBeLessThan(RADII[2] * 1.35);

    const banana = collisionSize('banana', RADII[6]);
    expect(banana.kind).toBe('compound');
    expect(banana.parts?.length).toBeGreaterThanOrEqual(4);
    expect(banana.hw).toBeGreaterThan(RADII[6] * 0.9);
    expect(banana.hw).toBeLessThan(RADII[6] * 1.45);

    const coconut = collisionSize('coconut', RADII[7]);
    expect(coconut.kind).toBe('compound');
    expect(coconut.parts?.length).toBeGreaterThanOrEqual(3);

    const papaya = collisionSize('papaya', RADII[8]);
    expect(papaya.kind).toBe('compound');
    expect(papaya.parts?.length).toBeGreaterThanOrEqual(3);

    const dragonfruit = collisionSize('dragonfruit', RADII[4]);
    expect(dragonfruit.kind).toBe('compound');
    expect(dragonfruit.parts?.length).toBeGreaterThanOrEqual(3);

    const mango = collisionSize('mango', RADII[5]);
    expect(mango.kind).toBe('capsule');
    expect(mango.hh).toBeGreaterThan(mango.hw);
  });

  it('does not change Classic fruit radii', () => {
    classicTheme.objects.forEach((object, index) => {
      expect(object.radius).toBe(RADII[index]);
    });
    tropicalTheme.objects.forEach((object, index) => {
      expect(object.radius).toBe(RADII[index]);
    });
  });

  it('keeps Sports and Drinks size progression while using modest custom radii', () => {
    for (let i = 1; i < sportsTheme.objects.length; i++) {
      expect(sportsTheme.objects[i].radius).toBeGreaterThan(sportsTheme.objects[i - 1].radius);
    }
    expect(sportsTheme.objects[0].radius).toBeLessThan(sportsTheme.objects[1].radius);
    expect(sportsTheme.objects[5].radius).toBeGreaterThan(sportsTheme.objects[4].radius + 6);
    expect(sportsTheme.objects[9].radius).toBeGreaterThan(sportsTheme.objects[6].radius);
    expect(sportsTheme.objects[10].radius).toBeGreaterThan(sportsTheme.objects[9].radius);
    expect(drinksTheme.objects[3].id).toBe('champagne');
    expect(drinksTheme.objects[3].radius).toBeCloseTo(29 * 1.2);
    expect(drinksTheme.objects[3].radius).toBeGreaterThan(drinksTheme.objects[2].radius);
    expect(drinksTheme.objects[3].radius).toBeLessThan(drinksTheme.objects[4].radius);
    const champagne = collisionSize('champagne', drinksTheme.objects[3].radius);
    expect(champagne.kind).toBe('rect');
    expect(champagne.hw).toBeLessThan(champagne.hh * 0.4);
    for (let i = 1; i < drinksTheme.objects.length; i++) {
      expect(drinksTheme.objects[i].radius).toBeGreaterThan(drinksTheme.objects[i - 1].radius);
    }
  });

  it('scales every Drinks collider with the 20% display-radius increase', () => {
    const previous = [14, 16, 21, 29, 32, 38, 46, 54, 63, 73, 86];
    drinksTheme.objects.forEach((object, index) => {
      expect(object.radius).toBeCloseTo(previous[index] * 1.2);
      const before = collisionSize(object.id, previous[index]);
      const after = collisionSize(object.id, object.radius);
      expect(after.kind).toBe(before.kind);
      expect(after.hw / before.hw).toBeCloseTo(1.2);
      expect(after.hh / before.hh).toBeCloseTo(1.2);
      expect(after.bound / before.bound).toBeCloseTo(1.2);
    });
  });

  it('uses a tall trophy collider rather than a near-square envelope', () => {
    const trophy = collisionSize('trophy', RADII[10]);
    expect(trophy.kind).toBe('rect');
    expect(trophy.hw / trophy.hh).toBeLessThan(0.8);
  });

  it('does not change pineapple or watermelon colliders', () => {
    expect(collisionFor('pineapple')).toMatchObject({ kind: 'rect', aspect: 0.62, fit: 'max' });
    expect(collisionFor('watermelon')).toMatchObject({ kind: 'circle', inset: 0.94, fit: 'max' });
  });

  it('recentres offset Tropical sprites onto their colliders without changing fit', () => {
    expect(collisionFor('banana').kind).toBe('compound');
    expect(collisionFor('coconut').kind).toBe('compound');
    expect(collisionFor('dragonfruit').kind).toBe('compound');
    expect(collisionFor('papaya').kind).toBe('compound');
    expect(collisionFor('banana').fit).toBe('min');
    expect(collisionFor('coconut').fit).toBe('min');
    expect(collisionSize('banana', RADII[6]).parts?.length).toBeGreaterThanOrEqual(4);
    expect(collisionSize('coconut', RADII[7]).parts?.length).toBeGreaterThanOrEqual(3);
  });

  it('keeps the banana sprite origin on the compound COM without changing display size', () => {
    const spec = collisionFor('banana');
    expect(spec.fit).toBe('min');
    expect(spec.aspect).toBe(1.4);
    expect(spec.alignX).not.toBe(0);
    expect(spec.alignY).not.toBe(0);
    const parts = spec.parts ?? [];
    let mass = 0;
    let cx = 0;
    let cy = 0;
    for (const part of parts) {
      const w = part.r * part.r;
      mass += w;
      cx += part.x * w;
      cy += part.y * w;
    }
    expect(mass).toBeGreaterThan(0);
    expect(cx / mass).toBeCloseTo(0, 8);
    expect(cy / mass).toBeCloseTo(0, 8);
  });
});
