import { describe, expect, it } from "vitest"
import { dayjs } from "./dayjs"
import { fixTimezoneOffset } from "./fix-timezone-offset"

describe("fixTimezoneOffset", () => {
  it("should adjust the date by the timezone offset for a Date object", () => {
    const utcDate = new Date("2025-09-08T12:00:00Z") // UTC time
    const result = fixTimezoneOffset(utcDate)

    const offset = utcDate.getTimezoneOffset()
    const expected = dayjs(utcDate).add(offset, "minute")

    expect(result.toISOString()).toBe(expected.toISOString())
  })

  it("should adjust the date by the timezone offset for a string", () => {
    const utcDate = "2025-09-08T12:00:00Z" // UTC time as string
    const result = fixTimezoneOffset(utcDate)

    const offset = new Date(utcDate).getTimezoneOffset()
    const expected = dayjs(utcDate).add(offset, "minute")

    expect(result.toISOString()).toBe(expected.toISOString())
  })

  it("should handle invalid date input gracefully by throwing an error", () => {
    const invalidDate = "invalid-date"
    const result = fixTimezoneOffset(invalidDate)

    expect(result.isValid()).toBe(false)
  })
})
