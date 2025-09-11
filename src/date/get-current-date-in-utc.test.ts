import { describe, expect, it } from "vitest"
import { dayjs } from "./dayjs"
import { getCurrentDateInUTC } from "./get-current-date-in-utc"

describe("getCurrentDateInUTC", () => {
  it("should return current date in UTC", () => {
    const result = getCurrentDateInUTC()
    const now = dayjs().utc()

    // Check that it's a dayjs object
    expect(result.isValid()).toBe(true)

    // Check that it's in UTC (no timezone offset)
    expect(result.utcOffset()).toBe(0)

    // Should be very close to current time (within 1 second)
    const diff = Math.abs(result.diff(now, "milliseconds"))
    expect(diff).toBeLessThan(1000)
  })

  it("should return different values when called at different times", () => {
    const first = getCurrentDateInUTC()

    // Wait a small amount
    return new Promise((resolve) => {
      setTimeout(() => {
        const second = getCurrentDateInUTC()
        expect(second.isAfter(first) || second.isSame(first)).toBe(true)
        resolve(undefined)
      }, 10)
    })
  })

  it("should return a Dayjs instance", () => {
    const result = getCurrentDateInUTC()

    // Check that it has dayjs methods
    expect(typeof result.format).toBe("function")
    expect(typeof result.isValid).toBe("function")
    expect(typeof result.utc).toBe("function")
  })

  it("should be in UTC timezone", () => {
    const result = getCurrentDateInUTC()

    // UTC offset should be 0
    expect(result.utcOffset()).toBe(0)

    // Should be the same when converted to UTC again
    expect(result.isSame(result.utc())).toBe(true)
  })

  it("should return valid date", () => {
    const result = getCurrentDateInUTC()
    expect(result.isValid()).toBe(true)
  })

  it("should be close to Date.now()", () => {
    const result = getCurrentDateInUTC()
    const now = Date.now()

    const diff = Math.abs(result.valueOf() - now)
    expect(diff).toBeLessThan(1000) // Within 1 second
  })

  it("should format correctly in UTC", () => {
    const result = getCurrentDateInUTC()
    const formatted = result.format("YYYY-MM-DD HH:mm:ss")

    // Should match UTC format pattern
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })
})
