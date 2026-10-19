export interface IPercentOfOptions {
  /** Round to this many fraction digits. */
  decimals?: number
  /** Returned when `total` is zero or an input is not finite. Default `0`. */
  fallback?: number
}

/**
 * Returns `part` as a percentage of `total` (`percentOf(1, 4)` is `25`).
 * @example percentOf(1, 3, { decimals: 1 }) // 33.3
 */
export function percentOf(
  part: number,
  total: number,
  { decimals, fallback = 0 }: IPercentOfOptions = {},
): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total === 0) {
    return fallback
  }
  const pct = (part / total) * 100
  if (decimals === undefined) return pct
  const factor = 10 ** decimals
  return Math.round(pct * factor) / factor
}
