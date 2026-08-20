export const DANGER_HOLD_MS = 2500;

export class DangerTracker {
  elapsed = 0;
  inDanger = false;

  constructor(private readonly holdMs = DANGER_HOLD_MS) {}

  /**
   * Advance the danger timer. `occupying` starts/continues the hold that can
   * end the game. `warning` only drives the HUD/line highlight so objects
   * that are merely high in the bowl do not look alarming.
   * Occupied objects must stay above the line continuously; bouncing through
   * it briefly does not end the game.
   */
  update(occupying: boolean, dtMs: number, warning = occupying): boolean {
    if (occupying) {
      this.inDanger = true;
      this.elapsed += dtMs;
      return this.elapsed >= this.holdMs;
    }
    this.elapsed = 0;
    this.inDanger = warning;
    return false;
  }

  reset(): void {
    this.elapsed = 0;
    this.inDanger = false;
  }
}
