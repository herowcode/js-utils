/** Internal: setTimeout fires immediately for delays above this (2^31 - 1 ms). */
export const MAX_TIMER_DELAY = 2 ** 31 - 1

/** Internal: clamps a delay to what setTimeout can honour; NaN becomes 0. */
export function clampTimerDelay(ms: number): number {
  return Math.min(Math.max(ms || 0, 0), MAX_TIMER_DELAY)
}
