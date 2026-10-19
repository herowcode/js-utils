import type { IDateOnlyOptions } from "./iso-date-core"
import { toISODate } from "./to-iso-date"

export interface IGetTodayISODateOptions extends IDateOnlyOptions {
  /** Instant to treat as "now". Defaults to the current time. */
  now?: Date | number
}

/**
 * Returns today's `YYYY-MM-DD` in `timeZone`; servers should pass `timeZone` explicitly.
 * @example getTodayISODate({ timeZone: "America/Sao_Paulo" }) // "2026-01-01"
 */
export function getTodayISODate({
  timeZone,
  now = new Date(),
}: IGetTodayISODateOptions = {}): string {
  return toISODate(now, { timeZone })
}
