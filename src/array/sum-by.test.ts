import { describe, expect, it } from "vitest"
import { sumBy } from "./sum-by"

describe("sumBy", () => {
  it("sums the mapped values", () => {
    expect(sumBy([{ n: 1 }, { n: 2.5 }], (x) => x.n)).toBe(3.5)
  })

  it("passes the index", () => {
    expect(sumBy(["a", "b", "c"], (_, i) => i)).toBe(3)
  })

  it("returns 0 for an empty array", () => {
    expect(sumBy([], () => 1)).toBe(0)
  })

  it("skips non-finite results", () => {
    expect(sumBy([1, Number.NaN, Number.POSITIVE_INFINITY, 2], (n) => n)).toBe(
      3,
    )
  })
})
