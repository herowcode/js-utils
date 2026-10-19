import {
  formatISODate,
  type IDateOnlyOptions,
  parseISODateParts,
  partsInTimeZone,
  toDate,
} from "./iso-date-core"

export interface IToISODateOptions extends IDateOnlyOptions {
  /** Returned for an invalid date. Defaults to "". */
  fallback?: string
}

/**
 * Formats an instant as the `YYYY-MM-DD` calendar day in `timeZone`, never by slicing the UTC ISO string.
 * @example toISODate(new Date("2026-01-02T01:30:00Z"), { timeZone: "America/Sao_Paulo" }) // "2026-01-01"
 */
export function toISODate(
  date: Date | number | string,
  { timeZone, fallback = "" }: IToISODateOptions = {},
): string {
  // A bare date-only string already is the answer; parsing it as UTC midnight would shift it west of UTC
  if (typeof date === "string" && parseISODateParts(date)) return date
  const value = toDate(date)
  if (Number.isNaN(value.getTime())) return fallback
  const { year, month, day } = partsInTimeZone(value, timeZone)
  return formatISODate(year, month, day)
}
