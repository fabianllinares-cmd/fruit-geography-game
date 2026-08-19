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

/** Physics size classes in world units. Visual sprites draw at 1.18× this diameter, using visible artwork bounds. */
export const RADII = [14, 18, 23, 28, 34, 40, 47, 55, 64, 74, 86] as const;
