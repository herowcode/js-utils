import { describe, expect, it } from "vitest"
import { toNumber } from "./to-number"

describe("toNumber", () => {
  it("passes finite numbers through", () => {
    expect(toNumber(5)).toBe(5)
    expect(toNumber(-1.5)).toBe(-1.5)
  })

  it("parses numeric strings and bigints", () => {
    expect(toNumber("12.5")).toBe(12.5)
    expect(toNumber(" 7 ")).toBe(7)
    expect(toNumber(10n)).toBe(10)
  })

  it("uses fallback instead of NaN", () => {
    expect(toNumber("abc")).toBe(0)
    expect(toNumber("")).toBe(0)
    expect(toNumber("   ")).toBe(0)
    expect(toNumber(null)).toBe(0)
    expect(toNumber(undefined, { fallback: 9 })).toBe(9)
    expect(toNumber(Number.NaN, { fallback: -1 })).toBe(-1)
    expect(toNumber(Number.POSITIVE_INFINITY, { fallback: 3 })).toBe(3)
    expect(toNumber({}, { fallback: 2 })).toBe(2)
  })

  it("truncates toward zero with integer", () => {
    expect(toNumber("12.9", { integer: true })).toBe(12)
    expect(toNumber(-3.7, { integer: true })).toBe(-3)
    expect(toNumber("x", { integer: true, fallback: 4.5 })).toBe(4.5)
  })
})
