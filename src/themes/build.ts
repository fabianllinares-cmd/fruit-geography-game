import { themeSprites, type ThemeId } from '../assets/catalog';
import { SCORES } from '../game/scoring';
import { RADII, type ObjectDef, type VisualSpec } from './types';

export function buildObjects(
  themeId: ThemeId,
  entries: Array<{
    id: string;
    name: string;
    visual: Omit<VisualSpec, 'sprite'>;
  }>,
): ObjectDef[] {
  const mapped = themeSprites(themeId);
  if (mapped.length !== entries.length) {
    throw new Error(`${themeId} must have ${mapped.length} objects, got ${entries.length}`);
  }
  return entries.map((entry, index) => {
    const row = mapped[index];
    if (row.level !== index + 1 || row.id !== entry.id) {
      throw new Error(
        `${themeId} level ${index + 1} must be "${row.id}" (got "${entry.id}")`,
      );
    }
    return {
      id: entry.id,
      name: entry.name,
      radius: RADII[index],
      score: SCORES[index],
      mergeTarget: index < entries.length - 1 ? entries[index + 1].id : null,
      visual: { ...entry.visual, sprite: row.file },
    };
  });
}
