import { describe, expect, it } from "vitest"
import { getDatePartsInTimeZone } from "./get-date-parts-in-time-zone"

describe("getDatePartsInTimeZone", () => {
  it("returns all parts in the zone", () => {
    expect(
      getDatePartsInTimeZone(new Date("2026-01-02T01:30:45Z"), {
        timeZone: "America/Sao_Paulo",
      }),
    ).toEqual({
      year: 2026,
      month: 1,
      day: 1,
      hour: 22,
      minute: 30,
      second: 45,
    })
  })

  it("rolls the year over in the zone", () => {
    expect(
      getDatePartsInTimeZone("2025-12-31T23:30:00Z", {
        timeZone: "Asia/Tokyo",
      }),
    ).toMatchObject({ year: 2026, month: 1, day: 1, hour: 8 })
  })

  it("handles Feb 29", () => {
    expect(
      getDatePartsInTimeZone(new Date("2028-02-29T12:00:00Z"), {
        timeZone: "UTC",
      }),
    ).toMatchObject({ month: 2, day: 29 })
  })

  it("returns null or the fallback for invalid dates", () => {
    expect(getDatePartsInTimeZone("nope", { timeZone: "UTC" })).toBeNull()
    const fb = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 }
    expect(getDatePartsInTimeZone(Number.NaN, { fallback: fb })).toBe(fb)
  })
})
