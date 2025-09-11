import { describe, expect, it } from "vitest"
import { formatSecondsToFragment } from "./format-seconds-to-fragment"

describe("formatSecondsToFragment", () => {
  it('returns "0s" for 0', () => {
    expect(formatSecondsToFragment(0)).toBe("0s")
  })

  it("clamps negative values to 0", () => {
    expect(formatSecondsToFragment(-5)).toBe("0s")
  })

  it("floors fractional seconds", () => {
    expect(formatSecondsToFragment(1.9)).toBe("1s")
  })

  it("formats seconds-only values", () => {
    expect(formatSecondsToFragment(42)).toBe("42s")
  })

  it("formats minutes without showing zero seconds", () => {
    expect(formatSecondsToFragment(60)).toBe("1m")
  })

  it("formats minutes and seconds", () => {
    expect(formatSecondsToFragment(61)).toBe("1m1s")
    expect(formatSecondsToFragment(125)).toBe("2m5s")
  })

  it("formats hours only", () => {
    expect(formatSecondsToFragment(3600)).toBe("1h")
  })

  it("formats hours, minutes and seconds", () => {
    expect(formatSecondsToFragment(3723)).toBe("1h2m3s")
    expect(formatSecondsToFragment(3661)).toBe("1h1m1s")
  })

  it("handles large values", () => {
    expect(formatSecondsToFragment(86399)).toBe("23h59m59s")
  })
})
