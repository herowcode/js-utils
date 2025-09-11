import { describe, expect, it } from "vitest"
import { formatHMSToSeconds } from "./format-hms-to-seconds"

describe("formatHMSToSeconds", () => {
  it("returns null for undefined, null or empty input", () => {
    expect(formatHMSToSeconds()).toBeNull()
    // biome-ignore lint/suspicious/noExplicitAny: Ignore for test
    expect(formatHMSToSeconds(null as any)).toBeNull()
    expect(formatHMSToSeconds("")).toBeNull()
  })

  it("returns null for NaN", () => {
    expect(formatHMSToSeconds(Number.NaN)).toBeNull()
  })

  it("handles numeric inputs (floors and clamps negatives to 0)", () => {
    expect(formatHMSToSeconds(10.9)).toBe(10)
    expect(formatHMSToSeconds(0)).toBe(0)
    expect(formatHMSToSeconds(-5)).toBe(0)
  })

  it("parses purely numeric strings", () => {
    expect(formatHMSToSeconds("123")).toBe(123)
    expect(formatHMSToSeconds("  42 ")).toBe(42)
    expect(formatHMSToSeconds("0")).toBe(0)
  })

  it("parses mm:ss and hh:mm:ss formats", () => {
    expect(formatHMSToSeconds("02:03")).toBe(123) // 2*60 + 3
    expect(formatHMSToSeconds("2:3")).toBe(123)
    expect(formatHMSToSeconds("1:02:03")).toBe(3723) // 1*3600 + 2*60 + 3
    expect(formatHMSToSeconds("1:2:3")).toBe(3723)
    expect(formatHMSToSeconds("00:00:00")).toBe(0)
  })

  it("returns null for invalid or unsupported formats", () => {
    expect(formatHMSToSeconds("1:2:3:4")).toBeNull() // too many segments
    expect(formatHMSToSeconds("12.3")).toBeNull() // decimal numeric string not allowed
    expect(formatHMSToSeconds("1:02:03.5")).toBeNull() // fractional seconds not supported
    expect(formatHMSToSeconds("abc")).toBeNull()
    expect(formatHMSToSeconds("1h2m3s")).toBeNull()
  })
})
