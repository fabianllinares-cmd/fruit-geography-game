import Matter from 'matter-js';
import { FRUITS, MAX_DROP_TIER, POWERUPS } from './data.js';

const { Engine, World, Bodies, Body, Composite, Events } = Matter;

const WALL = 12;
const DROP_Y = 60;
const DANGER_Y = 110;

export class Game {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.on = callbacks;

    this.engine = Engine.create();
    this.engine.gravity.y = 1.2;
    this.world = this.engine.world;

    this.score = 0;
    this.charge = 0;
    this.maxCharge = 100;
    this.running = false;
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

  _pickDropTier() {
    return Math.floor(Math.random() * MAX_DROP_TIER);
  }

  _buildBounds() {
    const opts = { isStatic: true, restitution: 0.2, friction: 0.6, render: {} };
    const floor = Bodies.rectangle(this.width / 2, this.height - WALL / 2, this.width, WALL, opts);
    const left = Bodies.rectangle(WALL / 2, this.height / 2, WALL, this.height, opts);
    const right = Bodies.rectangle(this.width - WALL / 2, this.height / 2, WALL, this.height, opts);
    floor.label = 'wall';
    left.label = 'wall';
    right.label = 'wall';
    World.add(this.world, [floor, left, right]);
  }

  _bindPhysics() {
    Events.on(this.engine, 'collisionStart', (evt) => {
      for (const pair of evt.pairs) {
        this._tryMerge(pair.bodyA, pair.bodyB);
      }
    });
  }

  _tryMerge(a, b) {
    if (!a.isFruit || !b.isFruit) return;
    if (this.mergedThisTick.has(a.id) || this.mergedThisTick.has(b.id)) return;
    if (a.tier !== b.tier) return;
    if (a.tier >= FRUITS.length - 1) return;

    this.mergedThisTick.add(a.id);
    this.mergedThisTick.add(b.id);

    const nextTier = a.tier + 1;
    const x = (a.position.x + b.position.x) / 2;
    const y = (a.position.y + b.position.y) / 2;

    World.remove(this.world, a);
    World.remove(this.world, b);

    const merged = this._makeFruit(nextTier, x, y);
    World.add(this.world, merged);
    Body.setVelocity(merged, { x: 0, y: -2 });

    const gained = FRUITS[nextTier].score;
    this.score += gained;
    this.charge = Math.min(this.maxCharge, this.charge + 6 + nextTier * 2);
    this.on.onScore?.(this.score, gained, FRUITS[nextTier]);
    this.on.onCharge?.(this.charge);
  }

  _makeFruit(tier, x, y) {
    const def = FRUITS[tier];
    const body = Bodies.circle(x, y, def.radius, {
      restitution: 0.18,
      friction: 0.45,
      frictionStatic: 0.6,
      density: 0.001,
    });
    body.isFruit = true;
    body.tier = tier;
    body.label = 'fruit';
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
      .filter((b) => b.isFruit)
      .forEach((b) => World.remove(this.world, b));
    this.score = 0;
    this.charge = 0;
    this.gameOver = false;
    this.canDrop = true;
    this.dangerTimer = 0;
    this.current = this._pickDropTier();
    this.next = this._pickDropTier();
    this.on.onScore?.(this.score, 0, null);
    this.on.onCharge?.(this.charge);
    this.on.onNext?.(FRUITS[this.next]);
    if (!this.running) this.start();
  }

  setDropX(x) {
    const def = FRUITS[this.current];
    const min = WALL + def.radius;
    const max = this.width - WALL - def.radius;
    this.dropX = Math.max(min, Math.min(max, x));
  }

  drop() {
    if (!this.canDrop || this.gameOver) return;
    const tier = this.current;
    const def = FRUITS[tier];
    const body = this._makeFruit(tier, this.dropX, DROP_Y);
    World.add(this.world, body);
    this.canDrop = false;
    this.current = this.next;
    this.next = this._pickDropTier();
    this.on.onNext?.(FRUITS[this.next]);
    setTimeout(() => {
      this.canDrop = true;
    }, 450);
  }

  usePowerup(id) {
    const power = POWERUPS.find((p) => p.id === id);
    if (!power || this.gameOver) return false;
    if (this.charge < power.cost) return false;

    const fruits = Composite.allBodies(this.world).filter((b) => b.isFruit);
    if (id === 'earthquake') {
      for (const f of fruits) {
        Body.setVelocity(f, {
          x: (Math.random() - 0.5) * 22,
          y: -Math.random() * 14,
        });
      }
    } else if (id === 'volcano') {
      if (fruits.length) {
        const biggest = fruits.reduce((m, f) => (f.tier > m.tier ? f : m), fruits[0]);
        this.score += FRUITS[biggest.tier].score * 2;
        World.remove(this.world, biggest);
        this.on.onScore?.(this.score, FRUITS[biggest.tier].score * 2, FRUITS[biggest.tier]);
      }
    } else if (id === 'drift') {
      const cx = this.width / 2;
      for (const f of fruits) {
        const dir = f.position.x < cx ? 1 : -1;
        Body.applyForce(f, f.position, { x: dir * 0.06 * f.mass, y: -0.01 * f.mass });
      }
    }

    this.charge -= power.cost;
    this.on.onCharge?.(this.charge);
    return true;
  }

  _checkGameOver(dt) {
    const fruits = Composite.allBodies(this.world).filter((b) => b.isFruit);
    const overLine = fruits.some(
      (f) => f.position.y - FRUITS[f.tier].radius < DANGER_Y && Math.abs(f.velocity.y) < 0.4
    );
    if (overLine) {
      this.dangerTimer += dt;
      if (this.dangerTimer > 1600) this._endGame();
    } else {
      this.dangerTimer = Math.max(0, this.dangerTimer - dt);
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
    if (!this.gameOver) {
      Engine.update(this.engine, dt);
      this._checkGameOver(dt);
    }
    this._render();
    requestAnimationFrame(this._loop);
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // danger line
    ctx.save();
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = this.dangerTimer > 0 ? 'rgba(255,80,80,0.9)' : 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(WALL, DANGER_Y);
    ctx.lineTo(this.width - WALL, DANGER_Y);
    ctx.stroke();
    ctx.restore();

    // drop preview
    if (this.canDrop && !this.gameOver) {
      const def = FRUITS[this.current];
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(this.dropX, DROP_Y);
      ctx.lineTo(this.dropX, this.height - WALL);
      ctx.stroke();
      ctx.restore();
      this._drawFruit(this.dropX, DROP_Y, def, 0);
    }

    for (const body of Composite.allBodies(this.world)) {
      if (body.isFruit) {
        this._drawFruit(body.position.x, body.position.y, FRUITS[body.tier], body.angle);
      }
    }
  }

  _drawFruit(x, y, def, angle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.arc(0, 0, def.radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(-def.radius * 0.3, -def.radius * 0.3, def.radius * 0.2, 0, 0, def.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, def.color);
    grad.addColorStop(1, this._shade(def.color, -0.25));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.stroke();

    ctx.rotate(angle);
    ctx.font = `${Math.round(def.radius * 1.15)}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.emoji, 0, def.radius * 0.06);
    ctx.restore();
  }

  _shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255;
    let g = (n >> 8) & 255;
    let b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r + r * amt)));
    g = Math.max(0, Math.min(255, Math.round(g + g * amt)));
    b = Math.max(0, Math.min(255, Math.round(b + b * amt)));
    return `rgb(${r},${g},${b})`;
  }
}
