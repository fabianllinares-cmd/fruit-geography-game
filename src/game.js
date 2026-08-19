import Matter from 'matter-js';
import { POWERUPS, DROP_TIERS, DROP_WEIGHTS } from './themes.js';
import { drawBackground, drawDangerLine, drawPiece } from './render.js';

const { Engine, World, Bodies, Body, Composite, Events } = Matter;

// Fixed logical play-field. The canvas backing store is scaled to the device,
// but all physics + layout math uses these units, so behaviour is identical on
// every screen and deterministic for tests.
export const BOARD = { W: 440, H: 660 };

const WALL = 16;
const DROP_Y = 54;
const DANGER_Y = Math.round(BOARD.H * 0.17);
const MAX_SPEED = 34; // clamp to prevent tunnelling through walls

export class Game {
  constructor(canvas, theme, callbacks = {}) {
    this.canvas = canvas;
    this.theme = theme;
    this.levels = theme.levels;
    this.on = callbacks;
    this.width = BOARD.W;
    this.height = BOARD.H;

    this._setupCanvas();

    this.engine = Engine.create();
    this.engine.gravity.y = 1.25;
    this.engine.positionIterations = 10;
    this.engine.velocityIterations = 8;
    this.world = this.engine.world;

    this.score = 0;
    this.charge = 0;
    this.maxCharge = 100;
    this.maxTierReached = 0;
    this.running = false;
    this.paused = false;
    this.gameOver = false;
    this.dropX = this.width / 2;
    this.canDrop = true;
    this.current = this._pickDropTier();
    this.next = this._pickDropTier();
    this.mergedThisTick = new Set();
    this.dangerTimer = 0;

    this._buildBounds();
    this._bindPhysics();
  }

  _setupCanvas() {
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    this.dpr = dpr;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _pickDropTier() {
    const weights = DROP_WEIGHTS.slice(0, DROP_TIERS);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return 0;
  }

  _buildBounds() {
    const opts = { isStatic: true, restitution: 0.1, friction: 0.6 };
    const floor = Bodies.rectangle(this.width / 2, this.height + WALL / 2 - 2, this.width * 2, WALL, opts);
    const left = Bodies.rectangle(-WALL / 2 + 2, this.height / 2, WALL, this.height * 2, opts);
    const right = Bodies.rectangle(this.width + WALL / 2 - 2, this.height / 2, WALL, this.height * 2, opts);
    for (const b of [floor, left, right]) b.label = 'wall';
    World.add(this.world, [floor, left, right]);
  }

  _bindPhysics() {
    Events.on(this.engine, 'collisionStart', (evt) => {
      for (const pair of evt.pairs) this._tryMerge(pair.bodyA, pair.bodyB);
    });
  }

  _tryMerge(a, b) {
    if (!a.isPiece || !b.isPiece) return;
    if (this.mergedThisTick.has(a.id) || this.mergedThisTick.has(b.id)) return;
    if (a.tier !== b.tier) return;
    const level = this.levels[a.tier];
    if (level.next == null) return;

    this.mergedThisTick.add(a.id);
    this.mergedThisTick.add(b.id);

    const nextTier = level.next;
    const x = (a.position.x + b.position.x) / 2;
    const y = (a.position.y + b.position.y) / 2;

    World.remove(this.world, a);
    World.remove(this.world, b);

    const merged = this._makePiece(nextTier, x, y);
    World.add(this.world, merged);
    Body.setVelocity(merged, { x: 0, y: -1.6 });

    const gained = this.levels[nextTier].score;
    this.score += gained;
    this.maxTierReached = Math.max(this.maxTierReached, nextTier);
    this.charge = Math.min(this.maxCharge, this.charge + 5 + nextTier * 2);
    this.on.onMerge?.(nextTier, this.levels[nextTier], { x, y });
    this.on.onScore?.(this.score, gained, this.levels[nextTier]);
    this.on.onCharge?.(this.charge);
  }

  _makePiece(tier, x, y) {
    const level = this.levels[tier];
    const body = Bodies.circle(x, y, level.radius, {
      restitution: 0.12,
      friction: 0.4,
      frictionStatic: 0.6,
      density: 0.001,
      slop: 0.02,
    });
    body.isPiece = true;
    body.tier = tier;
    body.label = 'piece';
    return body;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.gameOver = false;
    this._last = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  reset() {
    Composite.allBodies(this.world)
      .filter((b) => b.isPiece)
      .forEach((b) => World.remove(this.world, b));
    this.score = 0;
    this.charge = 0;
    this.maxTierReached = 0;
    this.gameOver = false;
    this.paused = false;
    this.canDrop = true;
    this.dangerTimer = 0;
    this.current = this._pickDropTier();
    this.next = this._pickDropTier();
    this.on.onScore?.(this.score, 0, null);
    this.on.onCharge?.(this.charge);
    this.on.onNext?.(this.levels[this.next], this.levels[this.current]);
    if (!this.running) this.start();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this._last = performance.now();
  }

  setDropX(x) {
    const level = this.levels[this.current];
    const min = WALL + level.radius;
    const max = this.width - WALL - level.radius;
    this.dropX = Math.max(min, Math.min(max, x));
  }

  drop() {
    if (!this.canDrop || this.gameOver || this.paused) return;
    const body = this._makePiece(this.current, this.dropX, DROP_Y);
    World.add(this.world, body);
    this.canDrop = false;
    this.current = this.next;
    this.next = this._pickDropTier();
    this.on.onNext?.(this.levels[this.next], this.levels[this.current]);
    setTimeout(() => {
      this.canDrop = true;
    }, 420);
  }

  usePowerup(id) {
    const power = POWERUPS.find((p) => p.id === id);
    if (!power || this.gameOver || this.paused) return false;
    if (this.charge < power.cost) return false;

    const pieces = Composite.allBodies(this.world).filter((b) => b.isPiece);
    if (id === 'earthquake') {
      for (const f of pieces) {
        Body.setVelocity(f, { x: (Math.random() - 0.5) * 20, y: -Math.random() * 12 });
      }
    } else if (id === 'volcano') {
      if (pieces.length) {
        const biggest = pieces.reduce((m, f) => (f.tier > m.tier ? f : m), pieces[0]);
        const bonus = this.levels[biggest.tier].score * 2;
        this.score += bonus;
        World.remove(this.world, biggest);
        this.on.onScore?.(this.score, bonus, this.levels[biggest.tier]);
      }
    } else if (id === 'drift') {
      const cx = this.width / 2;
      for (const f of pieces) {
        const dir = f.position.x < cx ? 1 : -1;
        Body.applyForce(f, f.position, { x: dir * 0.05 * f.mass, y: -0.008 * f.mass });
      }
    }

    this.charge -= power.cost;
    this.on.onCharge?.(this.charge);
    return true;
  }

  // Reward for answering a geography question. Correct answers grant score and
  // power-up charge; wrong answers give nothing.
  applyGeoResult(correct) {
    if (correct) {
      const bonus = 25 + this.maxTierReached * 5;
      this.score += bonus;
      this.charge = Math.min(this.maxCharge, this.charge + 30);
      this.on.onScore?.(this.score, bonus, null);
      this.on.onCharge?.(this.charge);
      return bonus;
    }
    return 0;
  }

  _clampSpeeds() {
    for (const b of Composite.allBodies(this.world)) {
      if (!b.isPiece) continue;
      const v = b.velocity;
      const sp = Math.hypot(v.x, v.y);
      if (sp > MAX_SPEED) {
        const s = MAX_SPEED / sp;
        Body.setVelocity(b, { x: v.x * s, y: v.y * s });
      }
    }
  }

  _checkGameOver(dt) {
    const pieces = Composite.allBodies(this.world).filter((b) => b.isPiece);
    const overLine = pieces.some(
      (f) => f.position.y - this.levels[f.tier].radius < DANGER_Y && Math.abs(f.velocity.y) < 0.45
    );
    if (overLine) {
      this.dangerTimer += dt;
      this.on.onDanger?.(Math.min(1, this.dangerTimer / 2200));
      if (this.dangerTimer > 2200) this._endGame();
    } else if (this.dangerTimer > 0) {
      this.dangerTimer = Math.max(0, this.dangerTimer - dt * 1.5);
      this.on.onDanger?.(Math.min(1, this.dangerTimer / 2200));
    }
  }

  _endGame() {
    this.gameOver = true;
    this.on.onGameOver?.(this.score);
  }

  _loop(now) {
    const dt = Math.min(32, now - this._last);
    this._last = now;
    this.mergedThisTick.clear();
    if (!this.gameOver && !this.paused) {
      this._clampSpeeds();
      Engine.update(this.engine, dt);
      this._checkGameOver(dt);
    }
    this._render();
    requestAnimationFrame(this._loop);
  }

  _render() {
    const ctx = this.ctx;
    drawBackground(ctx, this.theme, this.width, this.height);
    drawDangerLine(ctx, this.theme, WALL, this.width - WALL, DANGER_Y, this.dangerTimer > 0);

    if (this.canDrop && !this.gameOver && !this.paused) {
      const level = this.levels[this.current];
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = this.theme.canvas.danger;
      ctx.setLineDash([4, 7]);
      ctx.beginPath();
      ctx.moveTo(this.dropX, DROP_Y);
      ctx.lineTo(this.dropX, this.height - WALL);
      ctx.stroke();
      ctx.restore();
      drawPiece(ctx, level, this.dropX, DROP_Y, level.radius, 0, this.theme);
    }

    for (const body of Composite.allBodies(this.world)) {
      if (body.isPiece) {
        drawPiece(ctx, this.levels[body.tier], body.position.x, body.position.y, this.levels[body.tier].radius, body.angle, this.theme);
      }
    }
  }
}
