import { describe, expect, it } from "vitest"
import { truncate } from "./truncate"

describe("truncate options", () => {
  it("keeps the default and string-suffix output", () => {
    expect(truncate("hello brave world", 10)).toBe("hello b...")
    expect(truncate("hello brave world", 10, "~")).toBe("hello bra~")
    expect(truncate("hello brave world", 10, {})).toBe("hello b...")
  })

  it("accepts the suffix inside the options object", () => {
    expect(truncate("hello brave world", 10, { suffix: "~" })).toBe(
      "hello bra~",
    )
  })

  it("cuts at a word boundary", () => {
    expect(truncate("hello brave world", 14, { wordBoundary: true })).toBe(
      "hello brave...",
    )
    expect(truncate("hello brave world", 12, { wordBoundary: true })).toBe(
      "hello...",
    )
  })

  it("hard-cuts when there is no whitespace to cut at", () => {
    expect(truncate("abcdefghijkl", 8, { wordBoundary: true })).toBe("abcde...")
  })
})
