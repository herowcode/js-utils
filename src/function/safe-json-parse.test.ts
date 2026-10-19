import { describe, expect, it } from "vitest"
import { safeJsonParse } from "./safe-json-parse"

describe("safeJsonParse", () => {
  it("parses valid JSON", () => {
    expect(safeJsonParse<{ a: number }>('{"a":1}')).toEqual({ a: 1 })
    expect(safeJsonParse("[1,2]")).toEqual([1, 2])
    expect(safeJsonParse("null")).toBeNull()
    expect(safeJsonParse("0")).toBe(0)
  })

  it("returns undefined for invalid JSON by default", () => {
    expect(safeJsonParse("{nope")).toBeUndefined()
    expect(safeJsonParse("")).toBeUndefined()
  })

  it("returns the fallback for invalid or non-string input", () => {
    expect(safeJsonParse("{nope", { fallback: [] })).toEqual([])
    expect(safeJsonParse(null, { fallback: 1 })).toBe(1)
    expect(safeJsonParse(undefined, { fallback: "x" })).toBe("x")
    expect(safeJsonParse(5 as unknown as string, { fallback: "x" })).toBe("x")
  })

  it("does not use the fallback for valid JSON", () => {
    expect(safeJsonParse("false", { fallback: true })).toBe(false)
  })
})
