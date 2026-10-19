import { describe, expect, it } from "vitest"
import { percentOf } from "./percent-of"

describe("percentOf", () => {
  it("returns part as a percentage of total", () => {
    expect(percentOf(1, 4)).toBe(25)
    expect(percentOf(3, 2)).toBe(150)
    expect(percentOf(-1, 4)).toBe(-25)
  })

  it("rounds to decimals", () => {
    expect(percentOf(1, 3, { decimals: 1 })).toBe(33.3)
    expect(percentOf(2, 3, { decimals: 0 })).toBe(67)
  })

  it("returns fallback when total is zero or input is not finite", () => {
    expect(percentOf(5, 0)).toBe(0)
    expect(percentOf(5, 0, { fallback: Number.NaN })).toBeNaN()
    expect(percentOf(Number.NaN, 5, { fallback: -1 })).toBe(-1)
    expect(percentOf(1, Number.POSITIVE_INFINITY)).toBe(0)
  })
})
