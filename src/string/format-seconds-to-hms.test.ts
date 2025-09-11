import { describe, expect, it } from "vitest"
import { formatSecondsToHMS } from "./format-seconds-to-hms"

describe("formatSecondsToHMS", () => {
  it("formats zero seconds", () => {
    expect(formatSecondsToHMS(0)).toBe("00:00")
  })

  it("pads single-digit seconds and minutes", () => {
    expect(formatSecondsToHMS(5)).toBe("00:05")
    expect(formatSecondsToHMS(65)).toBe("01:05")
  })

  it("formats exact hours, minutes and seconds", () => {
    expect(formatSecondsToHMS(3600)).toBe("01:00:00")
    expect(formatSecondsToHMS(3661)).toBe("01:01:01")
  })

  it("rounds fractional seconds correctly", () => {
    // 3599.4 rounds to 3599 -> 00:59:59
    expect(formatSecondsToHMS(3599.4)).toBe("59:59")
    // 3599.6 rounds to 3600 -> 01:00:00
    expect(formatSecondsToHMS(3599.6)).toBe("01:00:00")
  })

  it("clamps negative inputs to zero", () => {
    expect(formatSecondsToHMS(-10)).toBe("00:00")
  })

  it("handles hours with more than two digits without truncation", () => {
    // 366100 seconds == 101:41:40
    expect(formatSecondsToHMS(366100)).toBe("101:41:40")
  })
})
