import { formatStringToTime } from "./format-string-to-time"

describe("formatStringToTime", () => {
  it("formats 3-digit input as MM:SS with padding", () => {
    expect(formatStringToTime("123")).toBe("01:23")
  })

  it("formats single-digit input as MM:SS", () => {
    expect(formatStringToTime("5")).toBe("00:05")
  })

  it("formats 4-digit input as MM:SS", () => {
    expect(formatStringToTime("1234")).toBe("12:34")
  })

  it("formats 5-digit input as HH:MM:SS (pads to 6 digits)", () => {
    expect(formatStringToTime("12345")).toBe("01:23:45")
  })

  it("truncates extra digits beyond 6 and returns HH:MM:SS", () => {
    expect(formatStringToTime("1234567")).toBe("12:34:56")
  })

  it("removes non-digit characters before formatting", () => {
    expect(formatStringToTime("ab12c3")).toBe("01:23")
    expect(formatStringToTime(" 12:34 ")).toBe("12:34")
  })

  it("treats empty or all-non-digit input as 00:00", () => {
    expect(formatStringToTime("")).toBe("00:00")
    expect(formatStringToTime("abc")).toBe("00:00")
  })

  it("preserves leading zeros for HH:MM:SS cases", () => {
    expect(formatStringToTime("000001")).toBe("00:01")
  })
})
