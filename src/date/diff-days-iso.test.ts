import { describe, expect, it } from "vitest"
import { diffDaysISO } from "./diff-days-iso"

describe("diffDaysISO", () => {
  it("returns a - b in calendar days", () => {
    expect(diffDaysISO("2026-03-10", "2026-03-01")).toBe(9)
    expect(diffDaysISO("2026-03-01", "2026-03-10")).toBe(-9)
    expect(diffDaysISO("2026-03-01", "2026-03-01")).toBe(0)
  })

  it("counts DST-transition spans as whole days", () => {
    expect(diffDaysISO("2026-03-09", "2026-03-07")).toBe(2)
    expect(diffDaysISO("2026-11-02", "2026-10-31")).toBe(2)
  })

  it("handles Feb 29 and year rollover", () => {
    expect(diffDaysISO("2028-03-01", "2028-02-28")).toBe(2)
    expect(diffDaysISO("2027-03-01", "2027-02-28")).toBe(1)
    expect(diffDaysISO("2027-01-01", "2026-01-01")).toBe(365)
    expect(diffDaysISO("2029-01-01", "2028-01-01")).toBe(366)
  })

  it("returns the fallback for malformed input", () => {
    expect(diffDaysISO("2026-13-01", "2026-01-01")).toBeNaN()
    expect(diffDaysISO("2026-01-01", "nope", { fallback: -1 })).toBe(-1)
  })
})
