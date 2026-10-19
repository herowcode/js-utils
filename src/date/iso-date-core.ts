export interface IDatePartsInTimeZone {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export interface IDateOnlyOptions {
  /** IANA zone. Defaults to the runtime zone, which is usually UTC on servers: pass it explicitly there. */
  timeZone?: string
}

const formatters = new Map<string, Intl.DateTimeFormat>()

export function runtimeTimeZone(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone
}

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      calendar: "gregory",
      numberingSystem: "latn",
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
    formatters.set(timeZone, formatter)
  }
  return formatter
}

export function toDate(value: Date | number | string): Date {
  return value instanceof Date ? value : new Date(value)
}

/** Throws RangeError for an invalid `timeZone` or an invalid date. */
export function partsInTimeZone(
  date: Date,
  timeZone: string = runtimeTimeZone(),
): IDatePartsInTimeZone {
  const parts: Record<string, number> = {}
  for (const { type, value } of getFormatter(timeZone).formatToParts(date)) {
    if (type !== "literal") parts[type] = Number(value)
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  }
}

export function formatISODate(year: number, month: number, day: number) {
  const sign = year < 0 ? "-" : ""
  return `${sign}${String(Math.abs(year)).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Parses a strict `YYYY-MM-DD` that exists on the calendar; undefined otherwise. */
export function parseISODateParts(
  value: unknown,
): { year: number; month: number; day: number } | undefined {
  if (typeof value !== "string") return undefined
  const match = ISO_DATE.exec(value)
  if (!match) return undefined
  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ]
  const check = utcDate(year, month, day)
  return check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
    ? { year, month, day }
    : undefined
}

/** Date.UTC maps years 0-99 to 1900+; setUTCFullYear does not. */
export function utcDate(year: number, month: number, day: number): Date {
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  return date
}
