import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { getTodayISODate } from "./get-today-iso-date"
import { getZonedHour } from "./get-zoned-hour"
import { parseISODateLocal } from "./parse-iso-date-local"
import { toISODate } from "./to-iso-date"

describe("runtime time zone (America/Sao_Paulo)", () => {
  const previous = process.env.TZ
  beforeAll(() => {
    process.env.TZ = "America/Sao_Paulo"
  })
  afterAll(() => {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  })

  const instant = new Date("2026-01-02T01:30:00Z")

  it("toISODate defaults to the runtime zone", () => {
    expect(toISODate(instant)).toBe("2026-01-01")
  })

  it("getTodayISODate uses the runtime zone", () => {
    expect(getTodayISODate({ now: instant })).toBe("2026-01-01")
  })

  it("getZonedHour defaults to the runtime zone", () => {
    expect(getZonedHour(instant)).toBe(22)
  })

  it("parseISODateLocal builds local midnight, not UTC midnight", () => {
    const parsed = parseISODateLocal("2026-01-01")?.getTime()
    expect(parsed).toBe(new Date(2026, 0, 1).getTime())
    expect(parsed).not.toBe(Date.UTC(2026, 0, 1))
  })
})
