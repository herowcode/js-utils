import { parseISODateParts, utcDate } from "./iso-date-core"

export interface IDiffDaysISOOptions {
  /** Returned when either date is malformed. Defaults to NaN. */
  fallback?: number
}

const DAY_MS = 86_400_000

/**
 * Whole calendar days from `b` to `a` (`a - b`), negative when `a` is earlier.
 * @example diffDaysISO("2026-03-10", "2026-03-01") // 9
 */
export function diffDaysISO(
  a: string,
  b: string,
  { fallback = Number.NaN }: IDiffDaysISOOptions = {},
): number {
  const left = parseISODateParts(a)
  const right = parseISODateParts(b)
  if (!left || !right) return fallback
  return Math.round(
    (utcDate(left.year, left.month, left.day).getTime() -
      utcDate(right.year, right.month, right.day).getTime()) /
      DAY_MS,
  )
}
