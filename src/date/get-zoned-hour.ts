import { type IDateOnlyOptions, partsInTimeZone, toDate } from "./iso-date-core"

export interface IGetZonedHourOptions extends IDateOnlyOptions {
  /** Returned for an invalid date. Defaults to NaN. */
  fallback?: number
}

/**
 * Returns the hour (0-23) of an instant as seen in `timeZone`.
 * @example getZonedHour(new Date("2026-01-02T01:30:00Z"), { timeZone: "America/Sao_Paulo" }) // 22
 */
export function getZonedHour(
  date: Date | number | string,
  { timeZone, fallback = Number.NaN }: IGetZonedHourOptions = {},
): number {
  const value = toDate(date)
  if (Number.isNaN(value.getTime())) return fallback
  return partsInTimeZone(value, timeZone).hour
}
