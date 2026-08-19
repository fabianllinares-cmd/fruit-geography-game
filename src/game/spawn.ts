/** Weighted random so normal drops stay in the smaller levels. */
export const DROP_WEIGHTS = [5, 4, 3, 2, 1] as const;
export const MAX_DROP_LEVEL = DROP_WEIGHTS.length - 1;

export function pickDropLevel(random: () => number = Math.random): number {
  const total = DROP_WEIGHTS.reduce((sum, w) => sum + w, 0);
  let roll = random() * total;
  for (let i = 0; i < DROP_WEIGHTS.length; i++) {
    roll -= DROP_WEIGHTS[i];
    if (roll <= 0) return i;
  }
  return 0;
}
