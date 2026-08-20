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
}

const DEFAULT_INSET = 0.94;

function circle(aspect = 1, inset = DEFAULT_INSET, fit: CollisionFit = 'max'): CollisionSpec {
  return { kind: 'circle', aspect, fit, inset };
}

function wide(aspect: number, inset = DEFAULT_INSET): CollisionSpec {
  return { kind: 'rect', aspect, fit: 'min', inset };
}

function tall(aspect: number, inset = DEFAULT_INSET): CollisionSpec {
  return { kind: 'rect', aspect, fit: 'max', inset };
}

function capsule(aspect: number, fit: CollisionFit, inset = DEFAULT_INSET): CollisionSpec {
  return { kind: 'capsule', aspect, fit, inset };
}

function compound(aspect: number, fit: CollisionFit, parts: CollisionPart[], inset = 1): CollisionSpec {
  return { kind: 'compound', aspect, fit, inset, parts: centerParts(parts) };
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
  // Previous tight circles (inset 0.64–0.74) let sprites overlap; these sit on the
  // visible core without restoring sparse AABB boxes.
  raspberry: circle(1.68, 0.86, 'min'),
  kiwi: circle(1.0, 0.97),
  starfruit: circle(1.56, 0.9, 'min'),
  passionfruit: circle(0.96, 0.97),
  dragonfruit: compound(1.35, 'min', [
    { x: -0.26, y: 0.32, r: 0.64 },
    { x: 0.0, y: 0.0, r: 0.66 },
    { x: 0.26, y: -0.32, r: 0.62 },
  ]),
  mango: capsule(0.87, 'max', 0.96),
  banana: compound(1.4, 'min', [
    { x: -0.54, y: 0.32, r: 0.38 },
    { x: -0.16, y: 0.14, r: 0.43 },
    { x: 0.2, y: -0.08, r: 0.42 },
    { x: 0.54, y: -0.34, r: 0.36 },
  ]),
  coconut: compound(1.33, 'min', [
    { x: -0.42, y: 0.1, r: 0.62 },
    { x: 0.38, y: -0.08, r: 0.66 },
  ]),
  papaya: compound(1.38, 'min', [
    { x: -0.5, y: 0.24, r: 0.68 },
    { x: 0.0, y: 0.0, r: 0.72 },
    { x: 0.52, y: -0.24, r: 0.64 },
  ]),

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
