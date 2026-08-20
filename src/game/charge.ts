export const ENERGY_MAX = 100;
export const ENERGY_FOR_CHALLENGE = 100;

/** Geography energy granted when a merge produces this result level. */
export function energyFromMerge(resultLevel: number): number {
  return 10 + resultLevel * 5;
}

export class ChargeMeter {
  energy = 0;

  get ready(): boolean {
    return this.isReady(ENERGY_FOR_CHALLENGE);
  }

  isReady(threshold: number = ENERGY_FOR_CHALLENGE): boolean {
    return this.energy >= threshold;
  }

  add(amount: number): void {
    this.energy = Math.min(ENERGY_MAX, Math.max(0, this.energy + amount));
  }

  set(amount: number): void {
    this.energy = Math.min(ENERGY_MAX, Math.max(0, amount));
  }

  /**
   * Consume a geography challenge charge.
   * Returns false if a challenge is not available yet.
   */
  consume(threshold: number = ENERGY_FOR_CHALLENGE): boolean {
    if (!this.isReady(threshold)) return false;
    this.energy = 0;
    return true;
  }

  reset(): void {
    this.energy = 0;
  }
}
