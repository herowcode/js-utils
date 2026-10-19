import {
  type IDateOnlyOptions,
  type IDatePartsInTimeZone,
  partsInTimeZone,
  toDate,
} from "./iso-date-core"

export type { IDatePartsInTimeZone }

export interface IGetDatePartsOptions extends IDateOnlyOptions {
  /** Returned for an invalid date. Defaults to `null`. */
  fallback?: IDatePartsInTimeZone | null
}

/**
 * Returns the calendar and clock parts of an instant as seen in `timeZone` (hour is 0-23).
 * @example getDatePartsInTimeZone(new Date("2026-01-02T01:30:00Z"), { timeZone: "America/Sao_Paulo" }) // { year: 2026, month: 1, day: 1, hour: 22, ... }
 */
export function getDatePartsInTimeZone(
  date: Date | number | string,
  { timeZone, fallback = null }: IGetDatePartsOptions = {},
): IDatePartsInTimeZone | null {
  const value = toDate(date)
  if (Number.isNaN(value.getTime())) return fallback
  return partsInTimeZone(value, timeZone)
}
