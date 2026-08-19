export const DANGER_HOLD_MS = 2500;

export class DangerTracker {
  elapsed = 0;
  inDanger = false;

  constructor(private readonly holdMs = DANGER_HOLD_MS) {}

  /**
   * Advance the danger timer. Occupied objects must stay above the line
   * continuously; bouncing through it briefly does not end the game.
   */
  update(occupiedAboveLine: boolean, dtMs: number): boolean {
    if (occupiedAboveLine) {
      this.inDanger = true;
      this.elapsed += dtMs;
      return this.elapsed >= this.holdMs;
    }
    this.inDanger = false;
    this.elapsed = 0;
    return false;
  }

  reset(): void {
    this.elapsed = 0;
    this.inDanger = false;
  }
}
