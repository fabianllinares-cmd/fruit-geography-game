/**
 * Collision silhouettes keyed by object id.
 * Dimensions are fractions of the theme level radius (object.radius / RADII[level]).
 * `fit` is also used when drawing: 'min' maps the shorter visible side to the
 * physics diameter (wide sprites). Keep `fit` stable so display size does not change.
 *
 * Circles intentionally ignore `aspect` — use `capsule` or `compound` when the
 * visible mass is elongated. `inset` shrinks the collider toward the opaque core
 * so sparse AABB padding (banana, starfruit, raspberry) does not create gaps.
 */
export type CollisionKind = 'circle' | 'rect' | 'capsule' | 'compound';

export type CollisionFit = 'max' | 'min';

export interface CollisionPart {
  /** Offset from body centre, in units of the level radius. */
  x: number;
  y: number;
  /** Circle radius, in units of the level radius. */
  r: number;
}

export interface CollisionSpec {
  kind: CollisionKind;
  /** Visible width / height of the artwork silhouette (drawing + elongated bodies). */
  aspect: number;
  fit: CollisionFit;
  /** Small inset so piles nest without visible overlap. */
  inset: number;
  /** Optional compound circles for curved / irregular silhouettes. */
  parts?: CollisionPart[];
  /**
   * Opaque-mass centre in dest-space, as a fraction of the level radius.
   * Drawing is shifted by this so the visible fruit sits on the collider
   * without changing dest width/height (display size).
   */
  alignX?: number;
  alignY?: number;
}

const DEFAULT_INSET = 0.94;

function circle(
  aspect = 1,
  inset = DEFAULT_INSET,
  fit: CollisionFit = 'max',
  alignX = 0,
  alignY = 0,
): CollisionSpec {
  return { kind: 'circle', aspect, fit, inset, alignX, alignY };
}

function wide(aspect: number, inset = DEFAULT_INSET): CollisionSpec {
  return { kind: 'rect', aspect, fit: 'min', inset };
}

function tall(aspect: number, inset = DEFAULT_INSET): CollisionSpec {
  return { kind: 'rect', aspect, fit: 'max', inset };
}

function capsule(
  aspect: number,
  fit: CollisionFit,
  inset = DEFAULT_INSET,
  alignX = 0,
  alignY = 0,
): CollisionSpec {
  return { kind: 'capsule', aspect, fit, inset, alignX, alignY };
}

function compound(
  aspect: number,
  fit: CollisionFit,
  parts: CollisionPart[],
  alignX = 0,
  alignY = 0,
): CollisionSpec {
  return { kind: 'compound', aspect, fit, inset: 1, parts: centerParts(parts), alignX, alignY };
}

/** Keep compound centres of mass on the sprite origin so drawing stays aligned. */
function centerParts(parts: CollisionPart[]): CollisionPart[] {
  let mass = 0;
  let cx = 0;
  let cy = 0;
  for (const part of parts) {
    const w = part.r * part.r;
    mass += w;
    cx += part.x * w;
    cy += part.y * w;
  }
  if (mass <= 0) return parts;
  cx /= mass;
  cy /= mass;
  return parts.map((part) => ({ x: part.x - cx, y: part.y - cy, r: part.r }));
}

/** Shared collision specs for every object id used across themes. */
export const COLLISION: Record<string, CollisionSpec> = {
  // Classic / Night — preserve existing packing.
  blueberry: circle(0.99),
  gooseberry: circle(0.83),
  strawberry: wide(1.65, 0.95),
  grapes: tall(0.73),
  lemon: circle(1.0),
  orange: circle(1.0),
  apple: circle(1.0),
  pear: tall(0.72),
  peach: circle(1.0),
  pineapple: tall(0.62),
  watermelon: circle(1.0),

  // Tropical — opaque-mass silhouettes. `fit` is unchanged so display size stays put.
  // Several Tropical PNGs have opaque fringe that inflates visible AABB/`fit: min`
  // dest rects; `alignX/Y` re-centres the fruit on the body without resizing dest.
  raspberry: circle(1.68, 0.96, 'min', 0.001, -0.079),
  kiwi: circle(1.0, 0.995, 'max', -0.009, 0.007),
  starfruit: compound(
    1.56,
    'min',
    [
      { x: -0.38, y: -0.18, r: 0.52 },
      { x: -0.49, y: 0.42, r: 0.46 },
      { x: 0.28, y: -0.65, r: 0.5 },
      { x: 0.15, y: 0.51, r: 0.46 },
      { x: 0.43, y: -0.02, r: 0.46 },
    ],
    -0.018,
    -0.025,
  ),
  passionfruit: circle(0.96, 0.995, 'max', 0.018, 0.005),
  dragonfruit: compound(
    1.35,
    'min',
    [
      { x: -0.27, y: -0.2, r: 0.52 },
      { x: -0.39, y: 0.45, r: 0.54 },
      { x: 0.25, y: 0.24, r: 0.53 },
      { x: 0.45, y: -0.56, r: 0.55 },
    ],
    -0.54,
    0.041,
  ),
  mango: capsule(0.87, 'max', 0.99, -0.017, 0.032),
  banana: compound(
    1.4,
    'min',
    [
      { x: -0.73, y: 0.38, r: 0.42 },
      { x: -0.29, y: 0.32, r: 0.46 },
      { x: 0.12, y: 0.11, r: 0.45 },
      { x: 0.42, y: -0.26, r: 0.4 },
    ],
    -0.353,
    0.285,
  ),
  coconut: compound(
    1.33,
    'min',
    [
      { x: -0.43, y: 0.03, r: 0.6 },
      { x: -0.07, y: 0.6, r: 0.7 },
      { x: 0.38, y: -0.42, r: 0.66 },
    ],
    -0.469,
    -0.007,
  ),
  papaya: compound(
    1.38,
    'min',
    [
      { x: -0.7, y: 0.24, r: 0.6 },
      { x: 0.02, y: -0.4, r: 0.6 },
      { x: 0.01, y: 0.38, r: 0.56 },
      { x: 0.74, y: -0.26, r: 0.64 },
    ],
    -0.328,
    0.062,
  ),

  // Sports — balls stay circular; elongated objects use capsules.
  pingpong: circle(0.98, 0.95),
  golf: circle(0.97, 0.95),
  '8ball': circle(0.99, 0.95),
  tennis: circle(1.02, 0.95),
  baseball: circle(1.0, 0.95),
  volleyball: circle(0.97, 0.95),
  soccer: circle(1.0, 0.95),
  football: capsule(1.72, 'min', 0.96),
  // Artwork is a diagonal elongated oval; compound circles follow that axis.
  rugby: compound(1.55, 'min', [
    { x: -0.418, y: 0.313, r: 0.78 },
    { x: -0.139, y: 0.104, r: 0.78 },
    { x: 0.139, y: -0.104, r: 0.78 },
    { x: 0.418, y: -0.313, r: 0.78 },
  ]),
  basketball: circle(0.95, 0.95),
  trophy: tall(0.62, 0.92),

  // Drinks — keep tall/narrow packing, modestly tighter silhouettes.
  ice: circle(1.02),
  shot: tall(0.62, 0.93),
  whiskey: tall(0.86, 0.94),
  champagne: tall(0.28, 0.93),
  wine_white: tall(0.42, 0.92),
  wine_red: tall(0.46, 0.92),
  martini: tall(0.7, 0.9),
  long: tall(0.38, 0.92),
  beer: tall(0.78, 0.94),
  cocktail: tall(0.66, 0.93),
  bottle: tall(0.4, 0.92),
};

export function collisionFor(id: string): CollisionSpec {
  return COLLISION[id] ?? circle(1);
}

export interface CollisionSize {
  kind: CollisionKind;
  hw: number;
  hh: number;
  bound: number;
  parts?: CollisionPart[];
}

function elongatedSize(
  kind: 'rect' | 'capsule',
  radius: number,
  spec: CollisionSpec,
  doubleInsetWidth: boolean,
): CollisionSize {
  const inset = spec.inset;
  const aspect = Math.max(0.2, spec.aspect);
  if (spec.fit === 'min') {
    const hh = radius * inset;
    const hw = doubleInsetWidth ? hh * aspect * inset : hh * aspect;
    return { kind, hw, hh, bound: doubleInsetWidth ? hh : Math.max(hw, hh) };
  }
  const long = radius * inset;
  if (aspect >= 1) {
    return { kind, hw: long, hh: long / aspect, bound: long };
  }
  const hh = long;
  const hw = long * aspect;
  return { kind, hw, hh, bound: long };
}

/** Half extents in world units for a level radius and object id. */
export function collisionSize(id: string, radius: number): CollisionSize {
  const spec = collisionFor(id);
  const inset = spec.inset;
  if (spec.kind === 'circle') {
    // Aspect is used for drawing (`fit`) but round bodies stay circular.
    const r = radius * inset;
    return { kind: 'circle', hw: r, hh: r, bound: r };
  }
  if (spec.kind === 'compound' && spec.parts?.length) {
    let hw = 0;
    let hh = 0;
    for (const part of spec.parts) {
      hw = Math.max(hw, Math.abs(part.x) + part.r);
      hh = Math.max(hh, Math.abs(part.y) + part.r);
    }
    hw *= radius;
    hh *= radius;
    return { kind: 'compound', hw, hh, bound: Math.max(hw, hh), parts: spec.parts };
  }
  if (spec.kind === 'capsule') {
    return elongatedSize('capsule', radius, spec, false);
  }
  // Legacy rounded-rect path (Classic strawberry / tall fruits). Keep the original
  // `fit: 'min'` double-inset so Classic packing does not change.
  return elongatedSize('rect', radius, spec, true);
}
