import { describe, expect, it } from "vitest"
import { groupBy } from "./group-by"

describe("groupBy", () => {
  it("groups in order", () => {
    expect(groupBy([1, 2, 3, 4, 5], (n) => (n % 2 ? "odd" : "even"))).toEqual({
      odd: [1, 3, 5],
      even: [2, 4],
    })
  })

  it("supports numeric keys and the index", () => {
    expect(groupBy(["a", "b", "c"], (_, i) => i % 2)).toEqual({
      0: ["a", "c"],
      1: ["b"],
    })
  })

  it("returns {} for an empty array", () => {
    expect(groupBy([], () => "k")).toEqual({})
  })

  it("treats __proto__ as an ordinary own key", () => {
    const out = groupBy([1, 2], () => "__proto__")
    expect(Object.keys(out)).toEqual(["__proto__"])
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
