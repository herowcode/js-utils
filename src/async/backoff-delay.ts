export interface IBackoffDelayOptions {
  /** Base delay in ms, doubled per attempt. Defaults to 100. */
  baseMs?: number
  /** Upper bound of the backoff in ms. Defaults to 3000. */
  maxMs?: number
}

/**
 * Exponential backoff with equal jitter: between half and the full capped delay, in ms.
 * @example await sleep(backoffDelay(2)) // 200-400 ms
 */
export function backoffDelay(
  attempt: number,
  { baseMs = 100, maxMs = 3000 }: IBackoffDelayOptions = {},
): number {
  const base = Math.min(2 ** attempt * baseMs, maxMs)
  return base / 2 + Math.random() * (base / 2)
}
