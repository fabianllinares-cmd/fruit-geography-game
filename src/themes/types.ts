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
 * Physics radii in world units. Sprites draw slightly larger than this circle
 * so fruits nest with less empty collision padding.
 */
export const RADII = [11, 14, 20, 24, 28, 33, 39, 45, 53, 62, 72] as const;
