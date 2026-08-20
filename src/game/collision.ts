/**
 * Collision silhouettes keyed by object id.
 * Dimensions are fractions of the theme level radius (RADII[level]).
 * `fit: 'min'` maps the shorter visible side to the physics diameter (wide sprites).
 */
export type CollisionKind = 'circle' | 'rect';

export type CollisionFit = 'max' | 'min';

export interface CollisionSpec {
  kind: CollisionKind;
  /** Visible width / height of the artwork silhouette. */
  aspect: number;
  fit: CollisionFit;
  /** Small inset so piles nest without visible overlap. */
  inset: number;
}

const DEFAULT_INSET = 0.94;

function circle(aspect = 1, inset = DEFAULT_INSET): CollisionSpec {
  return { kind: 'circle', aspect, fit: 'max', inset };
}

function wide(aspect: number, inset = DEFAULT_INSET): CollisionSpec {
  return { kind: 'rect', aspect, fit: 'min', inset };
}

function tall(aspect: number, inset = DEFAULT_INSET): CollisionSpec {
  return { kind: 'rect', aspect, fit: 'max', inset };
}

/** Shared collision specs for every object id used across themes. */
export const COLLISION: Record<string, CollisionSpec> = {
  // Classic / Night
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

  // Tropical
  raspberry: wide(1.68),
  kiwi: circle(1.0),
  starfruit: wide(1.56),
  passionfruit: circle(0.96),
  dragonfruit: wide(1.35),
  mango: circle(0.87),
  banana: wide(1.4),
  coconut: wide(1.33),
  papaya: wide(1.48),

  // Sports
  pingpong: circle(0.98),
  golf: circle(0.97),
  '8ball': circle(0.99),
  tennis: circle(1.02),
  baseball: circle(1.0),
  volleyball: circle(0.97),
  soccer: circle(1.0),
  football: wide(1.48),
  rugby: wide(1.16),
  basketball: circle(0.95),
  trophy: tall(0.99),

  // Drinks
  ice: circle(1.02),
  shot: tall(0.65),
  whiskey: tall(0.86),
  champagne: tall(0.3),
  wine_white: tall(0.48),
  wine_red: tall(0.53),
  martini: tall(0.64),
  long: tall(0.42),
  beer: tall(0.76),
  cocktail: tall(0.64),
  bottle: tall(0.47),
};

export function collisionFor(id: string): CollisionSpec {
  return COLLISION[id] ?? circle(1);
}

export interface CollisionSize {
  kind: CollisionKind;
  hw: number;
  hh: number;
  bound: number;
}

/** Half extents in world units for a level radius and object id. */
export function collisionSize(id: string, radius: number): CollisionSize {
  const spec = collisionFor(id);
  const inset = spec.inset;
  if (spec.kind === 'circle') {
    const r = radius * inset;
    return { kind: 'circle', hw: r, hh: r, bound: r };
  }
  const aspect = Math.max(0.2, spec.aspect);
  if (spec.fit === 'min') {
    const hh = radius * inset;
    const hw = hh * aspect * inset;
    return { kind: 'rect', hw, hh, bound: hh };
  }
  const long = radius * inset;
  if (aspect >= 1) {
    return { kind: 'rect', hw: long, hh: long / aspect, bound: long };
  }
  const hh = long;
  const hw = long * aspect;
  return { kind: 'rect', hw, hh, bound: long };
}
