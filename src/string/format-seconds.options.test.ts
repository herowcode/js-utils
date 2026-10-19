import { describe, expect, it } from "vitest"
import { formatSecondsToFragment } from "./format-seconds-to-fragment"
import { formatSecondsToHMS } from "./format-seconds-to-hms"

describe("formatSecondsToHMS options", () => {
  it("keeps the default output without options", () => {
    expect(formatSecondsToHMS(65)).toBe("01:05")
    expect(formatSecondsToHMS(65, {})).toBe("01:05")
    expect(formatSecondsToHMS(3661.5)).toBe("01:01:02")
  })

  it("always shows hours", () => {
    expect(formatSecondsToHMS(65, { alwaysShowHours: true })).toBe("00:01:05")
  })

  it("applies the rounding mode", () => {
    expect(formatSecondsToHMS(1.2, { rounding: "ceil" })).toBe("00:02")
    expect(formatSecondsToHMS(1.8, { rounding: "floor" })).toBe("00:01")
  })
})

describe("formatSecondsToFragment options", () => {
  it("keeps the default output without options", () => {
    expect(formatSecondsToFragment(3723)).toBe("1h2m3s")
    expect(formatSecondsToFragment(3723, {})).toBe("1h2m3s")
    expect(formatSecondsToFragment(59.9)).toBe("59s")
  })

  it("joins parts with a separator", () => {
    expect(formatSecondsToFragment(3723, { separator: " " })).toBe("1h 2m 3s")
    expect(formatSecondsToFragment(0, { separator: " " })).toBe("0s")
  })

  it("applies the rounding mode", () => {
    expect(formatSecondsToFragment(59.1, { rounding: "ceil" })).toBe("1m")
    expect(formatSecondsToFragment(59.5, { rounding: "round" })).toBe("1m")
  })
})
