import { describe, expect, it } from "vitest"
import { dayjs } from "./dayjs"
import { getRelativeTime } from "./get-relative-time"

const now = dayjs("2025-09-15T12:00:00Z")
const rtf = (style: "long" | "short" | "narrow", numeric: "always" | "auto") =>
  new Intl.RelativeTimeFormat("pt-BR", { style, numeric })

describe("getRelativeTime options", () => {
  it("keeps the dayjs output without style or calendar", () => {
    const past = now.subtract(5, "minute")
    expect(getRelativeTime(past, now)).toBe(past.from(now))
    expect(getRelativeTime(past, now, {})).toBe(past.from(now))
    expect(getRelativeTime(past, now, { fallback: "-" })).toBe(past.from(now))
  })

  it("accepts Date and number as dateNow", () => {
    const past = now.subtract(2, "hour")
    expect(getRelativeTime(past, now.toDate())).toBe(past.from(now))
    expect(getRelativeTime(past, now.valueOf())).toBe(past.from(now))
  })

  it("uses Intl with pt-BR by default when style is set", () => {
    expect(
      getRelativeTime(now.subtract(5, "minute"), now, { style: "long" }),
    ).toBe(rtf("long", "always").format(-5, "minute"))
    expect(getRelativeTime(now.add(2, "hour"), now, { style: "short" })).toBe(
      rtf("short", "always").format(2, "hour"),
    )
  })

  it("picks the largest whole unit", () => {
    const cases: [number, number, Intl.RelativeTimeFormatUnit][] = [
      [-30, -30, "second"],
      [-90, -1, "minute"],
      [-3 * 3600, -3, "hour"],
      [-3 * 86400, -3, "day"],
      [-14 * 86400, -2, "week"],
      [-34 * 86400, -4, "week"],
      [-90 * 86400, -3, "month"],
      [-364 * 86400, -11, "month"],
      [-800 * 86400, -2, "year"],
    ]
    for (const [offset, value, unit] of cases) {
      expect(
        getRelativeTime(now.add(offset, "second"), now, { style: "long" }),
      ).toBe(rtf("long", "always").format(value, unit))
    }
  })

  it("uses words for calendar", () => {
    expect(
      getRelativeTime(now.subtract(1, "day"), now, { calendar: true }),
    ).toBe(rtf("long", "auto").format(-1, "day"))
    expect(
      getRelativeTime(now.subtract(1, "day"), now, { calendar: true }),
    ).not.toMatch(/1/)
  })

  it("honors locale", () => {
    expect(
      getRelativeTime(now.subtract(1, "day"), now, {
        calendar: true,
        locale: "en",
      }),
    ).toBe("yesterday")
  })

  it("returns the fallback only for invalid dates", () => {
    expect(getRelativeTime("nope", now, { fallback: "-" })).toBe("-")
    expect(getRelativeTime("nope", now, { style: "long", fallback: "-" })).toBe(
      "-",
    )
    const legacy = dayjs("nope").from(now)
    expect(getRelativeTime("nope", now)).toBe(legacy)
    expect(getRelativeTime("nope", now, { style: "long" })).toBe(legacy)
  })
})
