import { describe, expect, it } from "vitest"
import { addDaysISO } from "./add-days-iso"

describe("addDaysISO", () => {
  it("rolls over months and years", () => {
    expect(addDaysISO("2026-01-31", 1)).toBe("2026-02-01")
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01")
    expect(addDaysISO("2026-01-01", -1)).toBe("2025-12-31")
  })

  it("handles Feb 29", () => {
    expect(addDaysISO("2028-02-28", 1)).toBe("2028-02-29")
    expect(addDaysISO("2028-02-29", 1)).toBe("2028-03-01")
    expect(addDaysISO("2027-02-28", 1)).toBe("2027-03-01")
    expect(addDaysISO("2028-02-29", 365)).toBe("2029-02-28")
  })

  it("is pure calendar math across US DST days", () => {
    expect(addDaysISO("2026-03-07", 1)).toBe("2026-03-08")
    expect(addDaysISO("2026-03-08", 1)).toBe("2026-03-09")
    expect(addDaysISO("2026-11-01", 1)).toBe("2026-11-02")
  })

  it("adds zero and large offsets", () => {
    expect(addDaysISO("2026-05-05", 0)).toBe("2026-05-05")
    expect(addDaysISO("2026-01-01", 10_000)).toBe("2053-05-19")
  })

  it("returns the fallback for malformed input", () => {
    expect(addDaysISO("2026-02-30", 1)).toBe("")
    expect(addDaysISO("2026-1-1", 1)).toBe("")
    expect(addDaysISO("2026-01-01", 1.5, { fallback: "x" })).toBe("x")
    expect(addDaysISO("2026-01-01", Number.NaN, { fallback: "x" })).toBe("x")
    expect(addDaysISO(undefined as unknown as string, 1)).toBe("")
  })

  it("rejects 100 KB adversarial input in linear time", () => {
    const start = performance.now()
    addDaysISO("9".repeat(100_000), 1)
    expect(performance.now() - start).toBeLessThan(50)
  })
})
