export type VisualStyle = 'fruit' | 'night-fruit' | 'tropical' | 'ball' | 'drink';

export type BallKind =
  | 'pingpong'
  | 'golf'
  | 'pool'
  | 'tennis'
  | 'baseball'
  | 'handball'
  | 'volleyball'
  | 'soccer'
  | 'basketball'
  | 'bowling'
  | 'championship';

export type DrinkKind =
  | 'shot'
  | 'beer-small'
  | 'whiskey'
  | 'wine-glass'
  | 'martini'
  | 'cocktail'
  | 'pint'
  | 'wine-bottle'
  | 'champagne'
  | 'pitcher'
  | 'punch';

export interface VisualSpec {
  /** Local bundled artwork URL (SVG/PNG/WebP). */
  src: string;
  /** Accessible short label; not used as the rendered sprite. */
  emoji: string;
  fill: string;
  stroke: string;
  highlight: string;
  style: VisualStyle;
  leaf?: boolean;
  glow?: string;
  ball?: BallKind;
  drink?: DrinkKind;
  number?: string;
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
  icon: string;
  background: string;
  tagline: string;
  objects: ObjectDef[];
  cssVars: Record<string, string>;
}

export const RADII = [14, 18, 23, 28, 34, 40, 47, 55, 64, 74, 86] as const;
