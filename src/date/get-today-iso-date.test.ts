import { describe, expect, it } from "vitest"
import { getTodayISODate } from "./get-today-iso-date"

describe("getTodayISODate", () => {
  const now = new Date("2026-01-02T01:30:00Z")

  it("returns the day in the given zone", () => {
    expect(getTodayISODate({ timeZone: "America/Sao_Paulo", now })).toBe(
      "2026-01-01",
    )
    expect(getTodayISODate({ timeZone: "UTC", now })).toBe("2026-01-02")
  })

  it("accepts a timestamp for now", () => {
    expect(
      getTodayISODate({ timeZone: "Asia/Tokyo", now: now.getTime() }),
    ).toBe("2026-01-02")
  })

  it("defaults to the current time and runtime zone", () => {
    expect(getTodayISODate()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
