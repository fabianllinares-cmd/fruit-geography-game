import { SCORES } from '../game/scoring';
import { RADII, type ObjectDef, type VisualSpec } from './types';

export function buildObjects(
  entries: Array<{
    id: string;
    name: string;
    visual: VisualSpec;
  }>,
): ObjectDef[] {
  return entries.map((entry, index) => ({
    id: entry.id,
    name: entry.name,
    radius: RADII[index],
    score: SCORES[index],
    mergeTarget: index < entries.length - 1 ? entries[index + 1].id : null,
    visual: entry.visual,
  }));
}
