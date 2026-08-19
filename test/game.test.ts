import Matter from 'matter-js';
import { describe, expect, it } from 'vitest';
import { ChargeMeter, ENERGY_FOR_CHALLENGE, energyFromMerge } from '../src/game/charge';
import { DANGER_HOLD_MS, DangerTracker } from '../src/game/danger';
import { DANGER_Y, MergeEngine } from '../src/game/engine';
import { canMerge, MAX_LEVEL, nextLevel, scoreForMerge } from '../src/game/scoring';
import { pickDropLevel } from '../src/game/spawn';

function step(engine: MergeEngine, ms: number): void {
  const frames = Math.ceil(ms / 16);
  for (let i = 0; i < frames; i++) engine.update(16);
}

describe('merge rules', () => {
  it('merges identical objects into the next level', () => {
    expect(canMerge(0, 0)).toBe(true);
    expect(nextLevel(0)).toBe(1);
    expect(canMerge(3, 4)).toBe(false);
  });

  it('does not merge different levels or the highest level', () => {
    expect(canMerge(MAX_LEVEL, MAX_LEVEL)).toBe(false);
    expect(nextLevel(MAX_LEVEL)).toBeNull();
  });
});

describe('scoring', () => {
  it('uses a near-exponential table', () => {
    expect(scoreForMerge(1)).toBe(3);
    expect(scoreForMerge(5)).toBeGreaterThan(scoreForMerge(4) * 1.5);
    expect(scoreForMerge(10)).toBeGreaterThan(1000);
  });
});

describe('physics merges', () => {
  it('creates the next-level object near the collision and awards score', () => {
    const engine = new MergeEngine({ random: () => 0 });
    engine.spawn(0, 180, 470);
    engine.spawn(0, 184, 430);
    step(engine, 2500);
    const snap = engine.snapshot();
    expect(snap.levels.some((level) => level >= 1)).toBe(true);
    expect(snap.score).toBeGreaterThanOrEqual(scoreForMerge(1));
    expect(snap.bodyCount).toBeGreaterThan(0);
  });

  it('does not merge different objects', () => {
    const engine = new MergeEngine({ random: () => 0 });
    engine.spawn(0, 120, 470);
    engine.spawn(2, 240, 470);
    step(engine, 1800);
    expect(engine.snapshot().levels).toEqual([0, 2]);
    expect(engine.score).toBe(0);
  });

  it('does not merge two max-level objects', () => {
    const engine = new MergeEngine({ random: () => 0 });
    engine.spawn(MAX_LEVEL, 140, 430);
    engine.spawn(MAX_LEVEL, 230, 430);
    step(engine, 1800);
    expect(engine.snapshot().levels).toEqual([MAX_LEVEL, MAX_LEVEL]);
    expect(engine.score).toBe(0);
  });

  it('can chain merges when the new object touches another match', () => {
    const engine = new MergeEngine({ random: () => 0 });
    engine.spawn(1, 180, 470);
    engine.spawn(0, 176, 400);
    engine.spawn(0, 184, 360);
    step(engine, 2800);
    expect(engine.snapshot().levels.some((level) => level >= 2)).toBe(true);
    expect(engine.score).toBeGreaterThanOrEqual(scoreForMerge(1) + scoreForMerge(2));
  });
});

describe('geography charge', () => {
  it('fills from merges and consumes on attempt, success or fail', () => {
    const meter = new ChargeMeter();
    expect(meter.ready).toBe(false);
    expect(meter.consume()).toBe(false);
    meter.add(energyFromMerge(3));
    meter.add(80);
    expect(meter.energy).toBe(ENERGY_FOR_CHALLENGE);
    expect(meter.ready).toBe(true);
    expect(meter.consume()).toBe(true);
    expect(meter.ready).toBe(false);
    expect(meter.energy).toBe(0);
  });

  it('engine consumeChallenge spends energy even before the answer', () => {
    const engine = new MergeEngine();
    engine.charge.set(100);
    expect(engine.tryConsumeChallenge()).toBe(true);
    expect(engine.charge.ready).toBe(false);
    expect(engine.tryConsumeChallenge()).toBe(false);
  });
});

describe('power-ups', () => {
  it('earthquake applies velocities without deleting objects', () => {
    const engine = new MergeEngine({ random: () => 0.8 });
    engine.spawn(2, 180, 450);
    engine.spawn(3, 200, 400);
    const before = engine.fruits().length;
    engine.earthquake();
    expect(engine.fruits()).toHaveLength(before);
    const kicked = engine.fruits().filter((b) => Math.abs(b.velocity.x) + Math.abs(b.velocity.y) > 20);
    expect(kicked.length).toBeGreaterThan(0);
    expect(engine.fruits().every((b) => b.velocity.y < -20)).toBe(true);
  });

  it('remove-small deletes the lowest-level objects on the board', () => {
    const engine = new MergeEngine();
    engine.spawn(0, 120, 460);
    engine.spawn(0, 160, 460);
    engine.spawn(3, 220, 430);
    const removed = engine.removeSmall();
    expect(removed).toHaveLength(2);
    expect(engine.snapshot().levels).toEqual([3]);
  });

  it('target-remove deletes exactly one selected object', () => {
    const engine = new MergeEngine();
    const keep = engine.spawn(4, 200, 430);
    const gone = engine.spawn(1, 140, 460);
    expect(engine.removeBody(gone.id)?.id).toBe(gone.id);
    expect(engine.fruits().map((b) => b.id)).toEqual([keep.id]);
  });
});

describe('danger line', () => {
  it('only trips after a continuous hold, and resets if the stack drops', () => {
    const danger = new DangerTracker(DANGER_HOLD_MS);
    expect(danger.update(true, 400)).toBe(false);
    expect(danger.update(true, 400)).toBe(false);
    expect(danger.update(false, 16)).toBe(false);
    expect(danger.elapsed).toBe(0);
    expect(danger.update(true, DANGER_HOLD_MS)).toBe(true);
  });

  it('ends the game if a settled object stays above the line', () => {
    const engine = new MergeEngine({ dangerHoldMs: 400 });
    const body = engine.spawn(8, 180, DANGER_Y - 10);
    Matter.Body.setStatic(body, true);
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    step(engine, 200);
    expect(engine.gameOver).toBe(false);
    step(engine, 300);
    expect(engine.gameOver).toBe(true);
  });
});

describe('pause and reset', () => {
  it('does not advance physics while paused', () => {
    const engine = new MergeEngine();
    const body = engine.spawn(0, 180, 120);
    const y = body.position.y;
    engine.addPause('hidden');
    step(engine, 800);
    expect(body.position.y).toBeCloseTo(y, 5);
    engine.removePause('hidden');
    step(engine, 800);
    expect(body.position.y).toBeGreaterThan(y + 5);
  });

  it('restores serialized bodies and score', () => {
    const a = new MergeEngine();
    a.spawn(2, 180, 400);
    a.score = 50;
    a.charge.set(40);
    a.geoCorrect = 2;
    a.geoAsked = 3;
    const save = a.serialize();
    const b = new MergeEngine();
    b.restore(save);
    expect(b.score).toBe(50);
    expect(b.charge.energy).toBe(40);
    expect(b.geoCorrect).toBe(2);
    expect(b.snapshot().levels).toEqual([2]);
  });

  it('reset clears score, bodies, energy and game-over', () => {
    const engine = new MergeEngine();
    engine.spawn(2, 180, 450);
    engine.score = 40;
    engine.charge.set(100);
    engine.endGame();
    engine.reset('classic');
    const snap = engine.snapshot();
    expect(snap.score).toBe(0);
    expect(snap.bodyCount).toBe(0);
    expect(snap.energy).toBe(0);
    expect(snap.gameOver).toBe(false);
    expect(snap.paused).toBe(false);
  });
});

describe('drops', () => {
  it('does not randomly spawn the highest objects', () => {
    for (let i = 0; i < 80; i++) {
      expect(pickDropLevel(() => i / 80)).toBeLessThanOrEqual(4);
    }
  });
});
