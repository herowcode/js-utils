import { formatISODate, parseISODateParts, utcDate } from "./iso-date-core"

export interface IAddDaysISOOptions {
  /** Returned for a malformed date or a non-integer `days`. Defaults to "". */
  fallback?: string
}

/**
 * Adds calendar days to a `YYYY-MM-DD` string; DST cannot shift the result.
 * @example addDaysISO("2026-02-28", 1) // "2026-03-01"
 */
export function addDaysISO(
  isoDate: string,
  days: number,
  { fallback = "" }: IAddDaysISOOptions = {},
): string {
  const parts = parseISODateParts(isoDate)
  if (!parts || !Number.isInteger(days)) return fallback
  const result = utcDate(parts.year, parts.month, parts.day + days)
  if (Number.isNaN(result.getTime())) return fallback
  return formatISODate(
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    result.getUTCDate(),
  )
}
