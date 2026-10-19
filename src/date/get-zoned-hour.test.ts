import { describe, expect, it } from "vitest"
import { getZonedHour } from "./get-zoned-hour"

describe("getZonedHour", () => {
  it("returns the hour in the zone", () => {
    const instant = new Date("2026-01-02T01:30:00Z")
    expect(getZonedHour(instant, { timeZone: "America/Sao_Paulo" })).toBe(22)
    expect(getZonedHour(instant, { timeZone: "UTC" })).toBe(1)
  })

  it("returns 0, never 24, at local midnight", () => {
    expect(
      getZonedHour(new Date("2026-01-02T03:00:00Z"), {
        timeZone: "America/Sao_Paulo",
      }),
    ).toBe(0)
    expect(
      getZonedHour(new Date("2026-01-02T00:00:00Z"), { timeZone: "UTC" }),
    ).toBe(0)
  })

  it("skips the nonexistent 02:00 hour on the US spring-forward day", () => {
    const ny = { timeZone: "America/New_York" }
    expect(getZonedHour(new Date("2026-03-08T06:30:00Z"), ny)).toBe(1)
    expect(getZonedHour(new Date("2026-03-08T07:30:00Z"), ny)).toBe(3)
  })

  it("returns the fallback for invalid dates", () => {
    expect(getZonedHour("nope", { timeZone: "UTC" })).toBeNaN()
    expect(getZonedHour(new Date(Number.NaN), { fallback: -1 })).toBe(-1)
  })
})
