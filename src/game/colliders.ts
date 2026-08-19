import Matter from 'matter-js';
import { spritePath } from '../assets/catalog';
import { spriteAspect } from '../assets/sprite-frame';
import { RADII } from '../themes/types';

const { Bodies, Body } = Matter;

/** Visible art is drawn at 1.18× the collision body's maximum dimension. */
export const SPRITE_VISUAL_SCALE = 1.18;

export type ColliderKind = 'circle' | 'box' | 'rounded-box' | 'capsule' | 'stem-glass';

export interface ColliderDef {
  kind: ColliderKind;
  width: number;
  height: number;
  chamfer?: number;
  /** 1 = wine (gentler bowl), 2 = martini/margarita (wider rim). */
  flare?: 1 | 2;
}

function sizeFor(level: number): number {
  return RADII[Math.max(0, Math.min(RADII.length - 1, level))] * 2;
}

export function colliderFor(themeId: string, level: number): ColliderDef {
  const S = sizeFor(level);
  if (themeId === 'drinks') return drinkCollider(level, S, spriteAspect(spritePath('drinks', level)));
  if (themeId === 'sports') return sportsCollider(level, S, spriteAspect(spritePath('sports', level)));
  return { kind: 'circle', width: S, height: S };
}

function drinkCollider(level: number, S: number, aspect: number): ColliderDef {
  const tallWidth = Math.min(S, S * aspect);
  switch (level) {
    case 0:
      return { kind: 'box', width: S * 0.9, height: S * 0.86, chamfer: S * 0.1 };
    case 1:
      return { kind: 'circle', width: S, height: S };
    case 2:
      return { kind: 'rounded-box', width: tallWidth * 0.88, height: S, chamfer: tallWidth * 0.2 };
    case 3:
      return { kind: 'stem-glass', width: tallWidth * 0.9, height: S, flare: 1 };
    case 4:
      return { kind: 'stem-glass', width: tallWidth * 0.94, height: S, flare: 2 };
    case 5:
      return { kind: 'rounded-box', width: Math.min(S * 0.92, tallWidth), height: S * 0.88, chamfer: S * 0.14 };
    case 6:
      return { kind: 'rounded-box', width: tallWidth * 0.84, height: S, chamfer: tallWidth * 0.18 };
    case 7:
      return { kind: 'stem-glass', width: tallWidth * 0.94, height: S, flare: 2 };
    case 8:
      return { kind: 'rounded-box', width: tallWidth * 0.8, height: S, chamfer: tallWidth * 0.16 };
    case 9:
      return { kind: 'capsule', width: tallWidth * 0.7, height: S };
    case 10:
      return { kind: 'capsule', width: tallWidth * 0.74, height: S };
    default:
      return { kind: 'circle', width: S, height: S };
  }
}

function sportsCollider(level: number, S: number, aspect: number): ColliderDef {
  switch (level) {
    case 0:
      return { kind: 'capsule', width: S * Math.min(0.9, aspect), height: S };
    case 9:
      return { kind: 'capsule', width: S * 0.7, height: S };
    case 10:
      return { kind: 'rounded-box', width: S * Math.min(0.82, aspect), height: S, chamfer: S * 0.1 };
    default:
      return { kind: 'circle', width: S, height: S };
  }
}

export function colliderHalfWidth(def: ColliderDef): number {
  return def.width / 2;
}

export function colliderHalfHeight(def: ColliderDef): number {
  return def.height / 2;
}

function clampChamfer(width: number, height: number, wanted: number): number {
  return Math.max(0.5, Math.min(wanted, width / 2 - 0.4, height / 2 - 0.4));
}

export interface CreatedCollider {
  body: Matter.Body;
  spriteOffX: number;
  spriteOffY: number;
}

export function createColliderBody(
  x: number,
  y: number,
  def: ColliderDef,
  options: Matter.IChamferableBodyDefinition,
): CreatedCollider {
  if (def.kind === 'circle') {
    return { body: Bodies.circle(x, y, def.width / 2, options), spriteOffX: 0, spriteOffY: 0 };
  }

  if (def.kind === 'box' || def.kind === 'rounded-box') {
    const chamfer = def.chamfer ? { radius: clampChamfer(def.width, def.height, def.chamfer) } : undefined;
    return {
      body: Bodies.rectangle(x, y, def.width, def.height, { ...options, chamfer }),
      spriteOffX: 0,
      spriteOffY: 0,
    };
  }

  if (def.kind === 'capsule') {
    const radius = clampChamfer(def.width, def.height, def.width / 2);
    return {
      body: Bodies.rectangle(x, y, def.width, def.height, { ...options, chamfer: { radius } }),
      spriteOffX: 0,
      spriteOffY: 0,
    };
  }

  return createStemGlass(x, y, def, options);
}

function createStemGlass(
  x: number,
  y: number,
  def: ColliderDef,
  options: Matter.IChamferableBodyDefinition,
): CreatedCollider {
  const w = def.width;
  const h = def.height;
  const flare = def.flare === 2 ? 1 : 0.78;
  const bowlH = h * (def.flare === 2 ? 0.42 : 0.46);
  const stemW = w * 0.13;
  const stemH = h * 0.34;
  const baseW = w * (def.flare === 2 ? 0.48 : 0.56);
  const baseH = h * 0.1;
  const partOpts = { ...options, chamfer: undefined };

  const bowl = Bodies.trapezoid(0, -h / 2 + bowlH / 2, w * flare, bowlH, def.flare === 2 ? 0.62 : 0.42, partOpts);
  Body.rotate(bowl, Math.PI);
  const stem = Bodies.rectangle(0, h * 0.08, stemW, stemH, partOpts);
  const base = Bodies.rectangle(0, h / 2 - baseH / 2, baseW, baseH, {
    ...partOpts,
    chamfer: { radius: clampChamfer(baseW, baseH, baseH * 0.4) },
  });

  const body = Body.create({
    parts: [bowl, stem, base],
    restitution: options.restitution,
    friction: options.friction,
    frictionStatic: options.frictionStatic,
    frictionAir: options.frictionAir,
    density: options.density,
    slop: options.slop,
    sleepThreshold: options.sleepThreshold,
  });

  const spriteOffX = -body.position.x;
  const spriteOffY = -body.position.y;
  Body.setPosition(body, { x, y });
  return { body, spriteOffX, spriteOffY };
}
