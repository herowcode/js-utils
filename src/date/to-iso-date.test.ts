import { describe, expect, it } from "vitest"
import { toISODate } from "./to-iso-date"

const SP = { timeZone: "America/Sao_Paulo" }

describe("toISODate", () => {
  it("uses the local day at 22:30 in Sao Paulo, when UTC is already tomorrow", () => {
    const instant = new Date("2026-01-02T01:30:00Z") // 22:30 on Jan 1 in Sao Paulo
    expect(toISODate(instant, SP)).toBe("2026-01-01")
    expect(instant.toISOString().slice(0, 10)).toBe("2026-01-02")
  })

  it("matches UTC for UTC and differs for other zones", () => {
    const instant = new Date("2026-06-15T23:30:00Z")
    expect(toISODate(instant, { timeZone: "UTC" })).toBe("2026-06-15")
    expect(toISODate(instant, { timeZone: "Asia/Tokyo" })).toBe("2026-06-16")
  })

  it("handles the US DST transition day", () => {
    // 2026-03-08 02:00 EST -> 03:00 EDT
    const ny = { timeZone: "America/New_York" }
    expect(toISODate(new Date("2026-03-08T04:59:59Z"), ny)).toBe("2026-03-07")
    expect(toISODate(new Date("2026-03-08T05:00:00Z"), ny)).toBe("2026-03-08")
    expect(toISODate(new Date("2026-03-09T03:59:59Z"), ny)).toBe("2026-03-08")
    expect(toISODate(new Date("2026-03-09T04:00:00Z"), ny)).toBe("2026-03-09")
  })

  it("handles Feb 29 and year rollover", () => {
    expect(
      toISODate(new Date("2028-02-29T12:00:00Z"), { timeZone: "UTC" }),
    ).toBe("2028-02-29")
    expect(toISODate(new Date("2027-01-01T02:00:00Z"), SP)).toBe("2026-12-31")
  })

  it("accepts timestamps and ISO strings", () => {
    expect(toISODate(Date.parse("2026-01-02T01:30:00Z"), SP)).toBe("2026-01-01")
    expect(toISODate("2026-01-02T01:30:00Z", SP)).toBe("2026-01-01")
  })

  it("returns a date-only string unchanged instead of shifting it west of UTC", () => {
    expect(toISODate("2026-01-01", SP)).toBe("2026-01-01")
  })

  it("defaults to the runtime zone", () => {
    const runtime = Intl.DateTimeFormat().resolvedOptions().timeZone
    const instant = new Date("2026-01-02T01:30:00Z")
    expect(toISODate(instant)).toBe(toISODate(instant, { timeZone: runtime }))
  })

  it("returns the fallback for invalid dates", () => {
    expect(toISODate(new Date("nope"), SP)).toBe("")
    expect(toISODate("garbage", { fallback: "-" })).toBe("-")
    expect(toISODate(Number.NaN, { fallback: "-" })).toBe("-")
  })

  it("throws RangeError for an unknown time zone", () => {
    expect(() => toISODate(new Date(), { timeZone: "Mars/Base" })).toThrow(
      RangeError,
    )
  })

  it("does not blow up on 100 KB string input", () => {
    const start = performance.now()
    toISODate("1".repeat(100_000), { fallback: "-" })
    expect(performance.now() - start).toBeLessThan(50)
  })
})
