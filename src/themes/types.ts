export type VisualStyle = 'fruit' | 'night-fruit' | 'tropical' | 'ball' | 'drink';

export interface VisualSpec {
  sprite: string;
  fill: string;
  stroke: string;
  highlight: string;
  style: VisualStyle;
  glow?: string;
}

export interface ObjectDef {
  id: string;
  name: string;
  radius: number;
  score: number;
  mergeTarget: string | null;
  visual: VisualSpec;
}

export interface Theme {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  tagline: string;
  objects: ObjectDef[];
  cssVars: Record<string, string>;
}

/**
 * Physics radii in world units. Sprites draw larger than this circle
 * so fruits nest with less empty collision padding. Strawberry (index 2)
 * is boosted so it reads clearly larger than gooseberry.
 */
export const RADII = [10, 12, 21, 24, 28, 33, 39, 46, 54, 63, 73] as const;
