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

function partsCentroid(parts: CollisionPart[]): { cx: number; cy: number } {
  let mass = 0;
  let cx = 0;
  let cy = 0;
  for (const part of parts) {
    const w = part.r * part.r;
    mass += w;
    cx += part.x * w;
    cy += part.y * w;
  }
  if (mass <= 0) return { cx: 0, cy: 0 };
  return { cx: cx / mass, cy: cy / mass };
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

/**
 * Compound whose sprite origin tracks the physics COM.
 * Matter.js recentres compound parts onto their mass centroid; drawing must
 * apply the same shift or a C-shaped fruit (banana) floats above contact.
 */
function compoundOnCom(aspect: number, fit: CollisionFit, parts: CollisionPart[]): CollisionSpec {
  const { cx, cy } = partsCentroid(parts);
  return compound(aspect, fit, parts, cx, cy);
}

/** Keep compound centres of mass on the body origin so spawn stays at COM. */
function centerParts(parts: CollisionPart[]): CollisionPart[] {
  const { cx, cy } = partsCentroid(parts);
  if (cx === 0 && cy === 0) return parts;
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
  // Dest scale still uses the PNG visible AABB; drawing crops to the coloured fruit
  // and centres it on the body so colliders can sit on the real silhouette.
  raspberry: circle(1.68, 0.92, 'min'),
  kiwi: circle(1.0, 0.995),
  starfruit: compound(1.56, 'min', [
    { x: -0.51, y: 0.05, r: 0.48 },
    { x: -0.19, y: 0.57, r: 0.6 },
    { x: -0.04, y: -0.31, r: 0.56 },
    { x: 0.46, y: -0.58, r: 0.5 },
    { x: 0.46, y: 0.25, r: 0.58 },
  ]),
  passionfruit: circle(0.96, 0.995),
  dragonfruit: compound(1.35, 'min', [
    { x: -0.44, y: 0.53, r: 0.56 },
    { x: -0.28, y: -0.12, r: 0.52 },
    { x: 0.21, y: 0.36, r: 0.56 },
    { x: 0.43, y: -0.45, r: 0.58 },
  ]),
  mango: capsule(0.87, 'max', 0.995),
  // Circles follow the opaque banana crescent in crop-centred dest space.
  // `compoundOnCom` stores that centroid as alignX/Y so drawObject can put the
  // sprite on the same origin Matter uses after COM recentering.
  banana: compoundOnCom(1.4, 'min', [
    { x: -0.56, y: 0.64, r: 0.35 },
    { x: -0.11, y: 0.56, r: 0.37 },
    { x: 0.29, y: 0.34, r: 0.36 },
    { x: 0.59, y: -0.02, r: 0.37 },
    { x: 0.7, y: -0.52, r: 0.33 },
  ]),
  coconut: compound(1.33, 'min', [
    { x: -0.42, y: 0.06, r: 0.61 },
    { x: 0.0, y: 0.32, r: 0.54 },
    { x: 0.38, y: -0.26, r: 0.66 },
  ]),
  papaya: compound(1.38, 'min', [
    { x: -0.78, y: 0.34, r: 0.64 },
    { x: -0.14, y: -0.3, r: 0.66 },
    { x: -0.04, y: 0.43, r: 0.6 },
    { x: 0.64, y: -0.23, r: 0.7 },
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
