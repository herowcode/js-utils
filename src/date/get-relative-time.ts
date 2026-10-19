import type { ConfigType } from "dayjs"
import { dayjs } from "./dayjs"

export interface IRelativeTimeOptions {
  /** Switches to `Intl.RelativeTimeFormat` with this width; default path (no style/calendar) is dayjs. */
  style?: "long" | "short" | "narrow"
  /** Uses words like "ontem"/"hoje" when the locale has them (Intl path, `numeric: "auto"`). */
  calendar?: boolean
  /** BCP 47 locale for the Intl path; default "pt-BR". */
  locale?: string
  /** Returned when `date` or `dateNow` is invalid. */
  fallback?: string
}

const MINUTE = 60
const HOUR = 3600
const DAY = 86400

function toUnitValue(diffMs: number): [number, Intl.RelativeTimeFormatUnit] {
  const sign = diffMs < 0 ? -1 : 1
  const secs = Math.trunc(Math.abs(diffMs) / 1000)
  const days = Math.trunc(secs / DAY)
  let value: number
  let unit: Intl.RelativeTimeFormatUnit
  if (secs < MINUTE) [value, unit] = [secs, "second"]
  else if (secs < HOUR) [value, unit] = [Math.trunc(secs / MINUTE), "minute"]
  else if (secs < DAY) [value, unit] = [Math.trunc(secs / HOUR), "hour"]
  else if (days < 7) [value, unit] = [days, "day"]
  else if (days < 35) [value, unit] = [Math.trunc(days / 7), "week"]
  else if (days < 365)
    [value, unit] = [Math.min(11, Math.trunc(days / 30)), "month"]
  else [value, unit] = [Math.trunc(days / 365), "year"]
  return [sign * value, unit]
}

/**
 * Describes `date` relative to `dateNow` ("3 minutes ago"); options switch to Intl wording.
 * @example getRelativeTime(yesterday, now, { calendar: true }) // "ontem"
 */
export function getRelativeTime(
  date: ConfigType,
  dateNow: ConfigType = dayjs(),
  options?: IRelativeTimeOptions,
): string {
  const target = dayjs(date)
  const now = dayjs(dateNow)

  if (options?.fallback !== undefined && !(target.isValid() && now.isValid())) {
    return options.fallback
  }

  if (
    (options?.style || options?.calendar) &&
    target.isValid() &&
    now.isValid()
  ) {
    const [value, unit] = toUnitValue(target.valueOf() - now.valueOf())
    return new Intl.RelativeTimeFormat(options.locale ?? "pt-BR", {
      style: options.style ?? "long",
      numeric: options.calendar ? "auto" : "always",
    }).format(value, unit)
  }

  return target.from(now)
}
