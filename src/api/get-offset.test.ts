import { describe, expect, it } from "vitest"
import { getOffset } from "./get-offset"

describe("getOffset", () => {
  it("computes (page - 1) * pageSize", () => {
    expect(getOffset(1, 20)).toBe(0)
    expect(getOffset(3, 20)).toBe(40)
  })

  it("floors fractional input", () => {
    expect(getOffset(2.9, 10.5)).toBe(10)
  })

  it("returns 0 for invalid input", () => {
    for (const [page, size] of [
      [0, 10],
      [-2, 10],
      [Number.NaN, 10],
      [2, 0],
      [2, Number.NaN],
      [Number.POSITIVE_INFINITY, 10],
    ]) {
      expect(getOffset(page, size)).toBe(0)
    }
  })
})
