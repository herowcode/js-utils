import { describe, expect, it } from "vitest"
import { keyBy } from "./key-by"

describe("keyBy", () => {
  it("indexes by key", () => {
    const users = [
      { id: "a", n: 1 },
      { id: "b", n: 2 },
    ]
    expect(keyBy(users, (u) => u.id)).toEqual({
      a: users[0],
      b: users[1],
    })
  })

  it("lets the last duplicate win", () => {
    expect(
      keyBy(
        [
          { k: 1, v: "x" },
          { k: 1, v: "y" },
        ],
        (o) => o.k,
      ),
    ).toEqual({
      1: { k: 1, v: "y" },
    })
  })

  it("returns {} for an empty array", () => {
    expect(keyBy([], () => "k")).toEqual({})
  })

  it("treats __proto__ as an ordinary own key", () => {
    const out = keyBy([{ v: 1 }], () => "__proto__")
    expect(Object.keys(out)).toEqual(["__proto__"])
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype)
  })
})
