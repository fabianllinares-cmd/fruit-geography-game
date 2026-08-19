import Matter from 'matter-js';
import { ChargeMeter, energyFromMerge } from './charge';
import { DangerTracker, DANGER_HOLD_MS } from './danger';
import { RADII } from '../themes/types';
import { canMerge, MAX_LEVEL, nextLevel, scoreForMerge } from './scoring';
import { pickDropLevel } from './spawn';
import type { EngineCallbacks, GameSnapshot, PauseReason, SavedGame } from './types';

const { Engine, World, Bodies, Body, Composite, Events, Query } = Matter;

export const WORLD_WIDTH = 360;
export const WORLD_HEIGHT = 520;
export const WALL = 14;
export const DROP_Y = 54;
export const DANGER_Y = 102;
const DROP_COOLDOWN_MS = 420;

export interface MergeEngineOptions {
  width?: number;
  height?: number;
  dangerHoldMs?: number;
  random?: () => number;
  now?: () => number;
}

export interface FruitBody extends Matter.Body {
  isFruit: true;
  gameLevel: number;
  bornAt: number;
}

function isFruit(body: Matter.Body): body is FruitBody {
  return Boolean((body as FruitBody).isFruit);
}

export class MergeEngine {
  readonly width: number;
  readonly height: number;
  readonly engine: Matter.Engine;
  readonly world: Matter.World;
  readonly charge = new ChargeMeter();
  readonly danger: DangerTracker;

  score = 0;
  highestLevel = 0;
  currentLevel = 0;
  nextLevel = 0;
  dropX: number;
  canDrop = true;
  gameOver = false;
  geoCorrect = 0;
  geoAsked = 0;
  droppedCount = 0;
  chain = 0;

  private readonly random: () => number;
  private readonly now: () => number;
  private readonly pauseReasons = new Set<PauseReason>();
  private pendingMerges: Array<[FruitBody, FruitBody]> = [];
  private usedThisTick = new Set<number>();
  private dropCooldown = 0;
  private themeId = 'classic';
  private on: EngineCallbacks = {};

  constructor(options: MergeEngineOptions = {}) {
    this.width = options.width ?? WORLD_WIDTH;
    this.height = options.height ?? WORLD_HEIGHT;
    this.danger = new DangerTracker(options.dangerHoldMs ?? DANGER_HOLD_MS);
    this.random = options.random ?? Math.random;
    this.now = options.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    this.dropX = this.width / 2;

    this.engine = Engine.create({
      gravity: { x: 0, y: 1.15 },
      enableSleeping: true,
    });
    this.engine.positionIterations = 12;
    this.engine.velocityIterations = 8;
    this.world = this.engine.world;
    this._buildBounds();
    this._bindPhysics();
    this._rollQueue();
  }

  setCallbacks(callbacks: EngineCallbacks): void {
    this.on = callbacks;
  }

  setThemeId(themeId: string): void {
    this.themeId = themeId;
  }

  get paused(): boolean {
    return this.pauseReasons.size > 0 || this.gameOver;
  }

  addPause(reason: PauseReason): void {
    this.pauseReasons.add(reason);
  }

  removePause(reason: PauseReason): void {
    this.pauseReasons.delete(reason);
  }

  setPaused(paused: boolean, reason: PauseReason = 'menu'): void {
    if (paused) this.addPause(reason);
    else this.removePause(reason);
  }

  fruits(): FruitBody[] {
    return Composite.allBodies(this.world).filter(isFruit);
  }

  objectAt(x: number, y: number): FruitBody | null {
    const hits = Query.point(this.fruits(), { x, y });
    return hits[0] && isFruit(hits[0]) ? hits[0] : null;
  }

  setDropX(x: number): void {
    const radius = this._radius(this.currentLevel);
    const min = WALL + radius;
    const max = this.width - WALL - radius;
    this.dropX = Math.max(min, Math.min(max, x));
  }

  drop(): boolean {
    if (!this.canDrop || this.paused) return false;
    const level = this.currentLevel;
    const body = this._makeFruit(level, this.dropX, DROP_Y);
    World.add(this.world, body);
    this.canDrop = false;
    this.dropCooldown = DROP_COOLDOWN_MS;
    this.droppedCount += 1;
    this.currentLevel = this.nextLevel;
    this.nextLevel = pickDropLevel(this.random);
    this._clampDropX();
    this.on.onDrop?.(level);
    this.on.onQueue?.(this.currentLevel, this.nextLevel);
    return true;
  }

  /** Test helper: spawn a resting object at a world position. */
  spawn(level: number, x: number, y: number): FruitBody {
    const body = this._makeFruit(level, x, y);
    World.add(this.world, body);
    return body;
  }

  reset(themeId = this.themeId): void {
    for (const fruit of this.fruits()) World.remove(this.world, fruit);
    this.score = 0;
    this.highestLevel = 0;
    this.droppedCount = 0;
    this.geoCorrect = 0;
    this.geoAsked = 0;
    this.gameOver = false;
    this.removePause('gameover');
    this.removePause('question');
    this.canDrop = true;
    this.dropCooldown = 0;
    this.chain = 0;
    this.charge.reset();
    this.danger.reset();
    this.themeId = themeId;
    this._rollQueue();
    this.on.onScore?.(0, 0, 0);
    this.on.onCharge?.(this.charge.energy, this.charge.ready);
    this.on.onQueue?.(this.currentLevel, this.nextLevel);
    this.on.onDanger?.(false, 0);
  }

  snapshot(): GameSnapshot {
    const fruits = this.fruits();
    return {
      score: this.score,
      energy: this.charge.energy,
      challengeReady: this.charge.ready,
      currentLevel: this.currentLevel,
      nextLevel: this.nextLevel,
      highestLevel: this.highestLevel,
      gameOver: this.gameOver,
      paused: this.paused,
      dangerMs: this.danger.elapsed,
      inDanger: this.danger.inDanger,
      bodyCount: fruits.length,
      levels: fruits.map((f) => f.gameLevel).sort((a, b) => a - b),
      geoCorrect: this.geoCorrect,
      geoAsked: this.geoAsked,
    };
  }

  serialize(): SavedGame {
    return {
      version: 1,
      themeId: this.themeId,
      score: this.score,
      energy: this.charge.energy,
      currentLevel: this.currentLevel,
      nextLevel: this.nextLevel,
      highestLevel: this.highestLevel,
      geoCorrect: this.geoCorrect,
      geoAsked: this.geoAsked,
      droppedCount: this.droppedCount,
      bodies: this.fruits().map((body) => ({
        level: body.gameLevel,
        x: body.position.x,
        y: body.position.y,
        angle: body.angle,
        vx: body.velocity.x,
        vy: body.velocity.y,
        angularVelocity: body.angularVelocity,
      })),
    };
  }

  restore(save: SavedGame): void {
    this.reset(save.themeId);
    this.score = save.score;
    this.charge.set(save.energy);
    this.currentLevel = save.currentLevel;
    this.nextLevel = save.nextLevel;
    this.highestLevel = save.highestLevel;
    this.geoCorrect = save.geoCorrect;
    this.geoAsked = save.geoAsked;
    this.droppedCount = save.droppedCount ?? 0;
    this._clampDropX();
    for (const item of save.bodies) {
      const body = this.spawn(item.level, item.x, item.y);
      Body.setAngle(body, item.angle);
      Body.setVelocity(body, { x: item.vx, y: item.vy });
      Body.setAngularVelocity(body, item.angularVelocity);
    }
    this.on.onScore?.(this.score, 0, this.highestLevel);
    this.on.onCharge?.(this.charge.energy, this.charge.ready);
    this.on.onQueue?.(this.currentLevel, this.nextLevel);
  }

  /**
   * Step physics. dtMs should be ~16. Call even when paused so the
   * renderer can keep drawing; physics is skipped while paused.
   */
  update(dtMs: number): void {
    const dt = Math.min(32, Math.max(0, dtMs));
    if (this.paused) return;

    this.usedThisTick.clear();
    this.pendingMerges = [];
    this.chain = 0;
    Engine.update(this.engine, dt);
    this._resolveMerges();

    if (this.dropCooldown > 0) {
      this.dropCooldown -= dt;
      if (this.dropCooldown <= 0) this.canDrop = true;
    }

    const occupied = this.fruits().some((fruit) => {
      const top = fruit.position.y - this._radius(fruit.gameLevel);
      const settled = Math.abs(fruit.velocity.y) < 0.45 && Math.abs(fruit.velocity.x) < 0.45;
      return top < DANGER_Y && settled;
    });
    const over = this.danger.update(occupied, dt);
    this.on.onDanger?.(this.danger.inDanger, this.danger.elapsed);
    if (over) this.endGame();
  }

  endGame(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.addPause('gameover');
    this.on.onGameOver?.(this.snapshot());
  }

  tryConsumeChallenge(): boolean {
    if (this.gameOver) return false;
    return this.charge.consume();
  }

  recordAnswer(correct: boolean): void {
    this.geoAsked += 1;
    if (correct) this.geoCorrect += 1;
  }

  earthquake(): void {
    for (const fruit of this.fruits()) {
      Matter.Sleeping.set(fruit, false);
      const kickX = (this.random() - 0.5) * 14;
      const kickY = -2 - this.random() * 5;
      Body.setVelocity(fruit, { x: kickX, y: kickY });
    }
  }

  removeSmall(): FruitBody[] {
    const fruits = this.fruits();
    if (!fruits.length) return [];
    const minLevel = fruits.reduce((min, f) => Math.min(min, f.gameLevel), MAX_LEVEL);
    const targets = fruits.filter((f) => f.gameLevel === minLevel);
    for (const body of targets) {
      this.on.onRemoved?.(body.gameLevel, body.position.x, body.position.y);
      World.remove(this.world, body);
    }
    return targets;
  }

  removeBody(id: number): FruitBody | null {
    const body = this.fruits().find((f) => f.id === id);
    if (!body) return null;
    this.on.onRemoved?.(body.gameLevel, body.position.x, body.position.y);
    World.remove(this.world, body);
    return body;
  }

  private _rollQueue(): void {
    this.currentLevel = pickDropLevel(this.random);
    this.nextLevel = pickDropLevel(this.random);
    this._clampDropX();
    this.on.onQueue?.(this.currentLevel, this.nextLevel);
  }

  private _clampDropX(): void {
    this.setDropX(this.dropX);
  }

  private _radius(level: number): number {
    return RADII[Math.max(0, Math.min(RADII.length - 1, level))];
  }

  private _buildBounds(): void {
    const opts = { isStatic: true, restitution: 0.08, friction: 0.85, slop: 0.05 };
    const floor = Bodies.rectangle(this.width / 2, this.height - WALL / 2, this.width, WALL, opts);
    const left = Bodies.rectangle(WALL / 2, this.height / 2, WALL, this.height, opts);
    const right = Bodies.rectangle(this.width - WALL / 2, this.height / 2, WALL, this.height, opts);
    floor.label = 'wall';
    left.label = 'wall';
    right.label = 'wall';
    World.add(this.world, [floor, left, right]);
  }

  private _bindPhysics(): void {
    // Queue merges instead of mutating the world inside the collision callback.
    // Matter.js can miss follow-up contacts if bodies are removed mid-event.
    Events.on(this.engine, 'collisionStart', (evt) => {
      for (const pair of evt.pairs) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        if (isFruit(a) && isFruit(b) && canMerge(a.gameLevel, b.gameLevel)) {
          this.pendingMerges.push([a, b]);
        }
      }
    });
  }

  private _makeFruit(level: number, x: number, y: number): FruitBody {
    const radius = this._radius(level);
    const body = Bodies.circle(x, y, radius, {
      restitution: 0.12,
      friction: 0.5,
      frictionStatic: 0.7,
      frictionAir: 0.01,
      density: 0.0012 + level * 0.00012,
      slop: 0.04,
      sleepThreshold: 40,
    }) as FruitBody;
    body.isFruit = true;
    body.gameLevel = level;
    body.bornAt = this.now();
    body.label = 'fruit';
    this.highestLevel = Math.max(this.highestLevel, level);
    return body;
  }

  private _resolveMerges(): void {
    for (const [a, b] of this.pendingMerges) {
      if (this.usedThisTick.has(a.id) || this.usedThisTick.has(b.id)) continue;
      if (!isFruit(a) || !isFruit(b)) continue;
      if (!canMerge(a.gameLevel, b.gameLevel)) continue;
      const result = nextLevel(a.gameLevel);
      if (result == null) continue;

      this.usedThisTick.add(a.id);
      this.usedThisTick.add(b.id);
      const x = (a.position.x + b.position.x) / 2;
      const y = (a.position.y + b.position.y) / 2;
      World.remove(this.world, a);
      World.remove(this.world, b);

      const merged = this._makeFruit(result, x, y);
      World.add(this.world, merged);
      Body.setVelocity(merged, { x: (a.velocity.x + b.velocity.x) * 0.25, y: -1.6 });

      this.chain += 1;
      const gained = scoreForMerge(result);
      this.score += gained;
      this.charge.add(energyFromMerge(result));
      this.on.onMerge?.(result, x, y, this.chain);
      this.on.onScore?.(this.score, gained, result);
      this.on.onCharge?.(this.charge.energy, this.charge.ready);
    }
  }
}
