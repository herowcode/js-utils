import { describe, expect, it } from "vitest"
import { buildQueryString } from "./build-query-string"

describe("buildQueryString", () => {
  it("serializes primitives and skips null/undefined", () => {
    expect(buildQueryString({ a: 1, b: "x", c: null, d: undefined })).toBe(
      "?a=1&b=x",
    )
  })

  it("returns an empty string when nothing is left", () => {
    expect(buildQueryString({})).toBe("")
    expect(buildQueryString({ a: null, b: [] })).toBe("")
  })

  it("repeats the key for array values", () => {
    expect(buildQueryString({ a: [1, 2], b: "x" })).toBe("?a=1&a=2&b=x")
  })

  it("skips null/undefined array entries and keeps falsy values", () => {
    expect(buildQueryString({ a: [0, null, false, undefined, ""] })).toBe(
      "?a=0&a=false&a=",
    )
  })

  it("encodes keys and values", () => {
    expect(buildQueryString({ "q r": ["a&b", "é"] })).toBe(
      "?q+r=a%26b&q+r=%C3%A9",
    )
  })
})
