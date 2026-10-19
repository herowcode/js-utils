/**
 * Parses a Retry-After header (seconds or HTTP date) into ms; undefined when it is not valid.
 * @example parseRetryAfterMs("120") // 120000
 */
export function parseRetryAfterMs(
  value: string | null | undefined,
  now: number = Date.now(),
): number | undefined {
  if (value === null || value === undefined) return undefined
  const trimmed = value.trim()
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000
  // Date.parse accepts "1.5" or "-1" as dates; only real HTTP dates go through it
  if (/^[+-]?[\d.]+$/.test(trimmed)) return undefined
  const date = Date.parse(trimmed)
  if (Number.isNaN(date)) return undefined
  return Math.max(date - now, 0)
}
