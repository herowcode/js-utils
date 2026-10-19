import { parseISODateParts } from "./iso-date-core"

export interface IParseISODateLocalOptions {
  /** Returned for a malformed date. Defaults to `null`. */
  fallback?: Date | null
}

/**
 * Parses `YYYY-MM-DD` as local midnight (not UTC midnight, which lands on the previous day west of UTC).
 * @example parseISODateLocal("2026-01-01") // Date at 2026-01-01T00:00 local time
 */
export function parseISODateLocal(
  isoDate: string,
  { fallback = null }: IParseISODateLocalOptions = {},
): Date | null {
  const parts = parseISODateParts(isoDate)
  if (!parts) return fallback
  const date = new Date(0)
  date.setFullYear(parts.year, parts.month - 1, parts.day)
  date.setHours(0, 0, 0, 0)
  return date
}
