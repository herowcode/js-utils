import { getDateInUTC } from "./getDateInUTC"

describe("getDateInUTC", () => {
  const testDate = new Date("2023-12-25T15:30:45.123Z")
  const localDate = new Date("2023-12-25T15:30:45.123")

  it("should convert Date to UTC Dayjs object", () => {
    const result = getDateInUTC(testDate)

    expect(result.isValid()).toBe(true)
    expect(result.utcOffset()).toBe(0)
  })

  it("should preserve the date and time correctly", () => {
    const result = getDateInUTC(testDate)

    expect(result.year()).toBe(2023)
    expect(result.month()).toBe(11) // December is month 11 in dayjs (0-indexed)
    expect(result.date()).toBe(25)
    expect(result.hour()).toBe(15)
    expect(result.minute()).toBe(30)
    expect(result.second()).toBe(45)
  })

  it("should handle local dates", () => {
    const result = getDateInUTC(localDate)

    expect(result.isValid()).toBe(true)
    expect(result.utcOffset()).toBe(0)
  })

  it("should handle different date formats", () => {
    const dates = [
      new Date("2023-01-01"),
      new Date("2023-06-15T12:00:00Z"),
      new Date("2023-12-31T23:59:59.999Z"),
      new Date(Date.now()),
    ]

    dates.forEach((date) => {
      const result = getDateInUTC(date)
      expect(result.isValid()).toBe(true)
      expect(result.utcOffset()).toBe(0)
    })
  })

  it("should return same timestamp for UTC input", () => {
    const utcDate = new Date("2023-12-25T15:30:45.123Z")
    const result = getDateInUTC(utcDate)

    expect(result.valueOf()).toBe(utcDate.getTime())
  })

  it("should handle edge case dates", () => {
    const edgeCases = [
      new Date("1970-01-01T00:00:00.000Z"), // Unix epoch
      new Date("2000-01-01T00:00:00.000Z"), // Y2K
      new Date("2024-02-29T12:00:00.000Z"), // Leap year
      new Date("2023-02-28T23:59:59.999Z"), // End of February
    ]

    edgeCases.forEach((date) => {
      const result = getDateInUTC(date)
      expect(result.isValid()).toBe(true)
      expect(result.utcOffset()).toBe(0)
    })
  })

  it("should handle invalid dates", () => {
    const invalidDate = new Date("invalid")
    const result = getDateInUTC(invalidDate)

    expect(result.isValid()).toBe(false)
  })

  it("should return a Dayjs instance with all methods", () => {
    const result = getDateInUTC(testDate)

    // Check that it has dayjs methods
    expect(typeof result.format).toBe("function")
    expect(typeof result.add).toBe("function")
    expect(typeof result.subtract).toBe("function")
    expect(typeof result.diff).toBe("function")
    expect(typeof result.isBefore).toBe("function")
    expect(typeof result.isAfter).toBe("function")
  })

  it("should format correctly", () => {
    const result = getDateInUTC(testDate)
    const formatted = result.format("YYYY-MM-DD HH:mm:ss")

    expect(formatted).toBe("2023-12-25 15:30:45")
  })

  it("should be immutable (not modify original date)", () => {
    const originalDate = new Date("2023-12-25T15:30:45.123Z")
    const originalTime = originalDate.getTime()

    getDateInUTC(originalDate)

    expect(originalDate.getTime()).toBe(originalTime)
  })

  it("should handle dates from different timezones correctly", () => {
    // Create a date that represents the same moment in time
    const utcDate = new Date("2023-12-25T15:30:00Z")
    const result = getDateInUTC(utcDate)

    // Should maintain the same UTC timestamp
    expect(result.valueOf()).toBe(utcDate.getTime())
    expect(result.format("YYYY-MM-DD HH:mm:ss")).toBe("2023-12-25 15:30:00")
  })

  it("should work with Date.now()", () => {
    const now = Date.now()
    const dateFromNow = new Date(now)
    const result = getDateInUTC(dateFromNow)

    expect(result.valueOf()).toBe(now)
    expect(result.isValid()).toBe(true)
  })
})
