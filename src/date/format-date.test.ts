import { afterEach, describe, expect, it } from "vitest"
import {
  resetDayjsGlobalIntl,
  resolveDayjsIntlConfig,
  setDayjsGlobalIntl,
} from "./dayjs"
import { formatDate } from "./format-date"

describe("formatDate", () => {
  const testDate = new Date("2023-12-25T10:30:00Z")

  afterEach(() => {
    resetDayjsGlobalIntl()
  })

  it("should format date with default options (pt-BR)", () => {
    const result = formatDate(testDate)
    expect(result).toMatch(
      /25 de dezembro de 2023|dezembro 25, 2023|25\/12\/2023/,
    )
  })

  it("should format date with custom locale", () => {
    const result = formatDate(testDate, "en-US")
    expect(result).toMatch(/December 25, 2023/)
  })

  it("should format date with custom options", () => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
    const result = formatDate(testDate, "en-US", options)
    expect(result).toMatch(/Dec 25, 2023/)
  })

  it("should handle string dates", () => {
    const result = formatDate("2023-12-25", "en-US")
    // String dates may be interpreted as local time
    expect(result).toMatch(/December 2[45], 2023/)
  })

  it("should handle number timestamps", () => {
    const timestamp = testDate.getTime()
    const result = formatDate(timestamp, "en-US")
    expect(result).toMatch(/December 25, 2023/)
  })

  it("should handle different locales", () => {
    const ptResult = formatDate(testDate, "pt-BR")
    const enResult = formatDate(testDate, "en-US")
    const esResult = formatDate(testDate, "es-ES")

    expect(ptResult).not.toBe(enResult)
    expect(enResult).not.toBe(esResult)
  })

  it("should handle time formatting options", () => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }
    const result = formatDate(testDate, "en-US", options)
    expect(result).toMatch(/12\/25\/2023.*\d{1,2}:\d{2}/)
  })

  it("should override default options with custom ones", () => {
    const options: Intl.DateTimeFormatOptions = {
      month: "numeric",
    }
    const result = formatDate(testDate, "en-US", options)
    expect(result).toMatch(/12\/25\/2023/)
  })

  it("should handle different month formats", () => {
    const longMonth = formatDate(testDate, "en-US", { month: "long" })
    const shortMonth = formatDate(testDate, "en-US", { month: "short" })
    const numericMonth = formatDate(testDate, "en-US", { month: "numeric" })

    expect(longMonth).toContain("December")
    expect(shortMonth).toContain("Dec")
    expect(numericMonth).toMatch(/12/)
  })

  it("should handle different year formats", () => {
    const numericYear = formatDate(testDate, "en-US", { year: "numeric" })
    const twoDigitYear = formatDate(testDate, "en-US", { year: "2-digit" })

    expect(numericYear).toContain("2023")
    expect(twoDigitYear).toContain("23")
  })

  it("should handle different day formats", () => {
    const numericDay = formatDate(testDate, "en-US", { day: "numeric" })
    const twoDigitDay = formatDate(testDate, "en-US", { day: "2-digit" })

    expect(numericDay).toContain("25")
    expect(twoDigitDay).toContain("25")
  })

  it("should handle weekday formatting", () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    const result = formatDate(testDate, "en-US", options)
    expect(result).toMatch(/Monday.*December 25, 2023/)
  })

  it("should handle timezone formatting", () => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "UTC",
      timeZoneName: "short",
    }
    const result = formatDate(testDate, "en-US", options)
    expect(result).toContain("UTC")
  })

  it("should handle invalid dates gracefully", () => {
    expect(() => formatDate("invalid-date")).toThrow()
    expect(() => formatDate(Number.NaN)).toThrow()
  })

  it("should handle edge case dates", () => {
    const leap = formatDate("2024-02-29", "en-US")
    const endOfYear = formatDate("2023-12-31", "en-US")
    const startOfYear = formatDate("2023-01-01", "en-US")

    // Dates may be affected by timezone interpretation
    expect(leap).toMatch(/February 2[89], 2024/)
    expect(endOfYear).toMatch(/December 3[01], 2023/)
    expect(startOfYear).toMatch(/(December 31, 2022|January 1, 2023)/)
  })

  it("should maintain consistent formatting for same inputs", () => {
    const result1 = formatDate(testDate, "en-US")
    const result2 = formatDate(testDate, "en-US")
    expect(result1).toBe(result2)
  })

  it("should format using dayjs tokens when provided", () => {
    const result = formatDate("2023-12-25", "YYYY-MM-DD")
    expect(result).toBe("2023-12-25")
  })

  it("should accept configuration object for formatting", () => {
    const result = formatDate("2023-12-25", {
      locale: "pt-br",
      format: "DD [de] MMMM",
    })

    expect(result.toLowerCase()).toContain("25")
    expect(result.toLowerCase()).toContain("dez")
  })

  it("should force Intl formatting when requested even with format string", () => {
    const resolved = resolveDayjsIntlConfig({
      locale: "en-US",
      options: {
        month: "long",
        day: "numeric",
        year: undefined,
      },
    })

    expect(resolved.options.year).toBeUndefined()

    const result = formatDate(testDate, {
      format: "YYYY-MM-DD",
      useIntl: true,
      intl: {
        locale: "en-US",
        options: {
          month: "long",
          day: "numeric",
          year: undefined,
        },
      },
    })

    expect(result).toBe("December 25")
  })

  it("should reflect global Intl configuration changes", () => {
    setDayjsGlobalIntl({
      locale: "en-US",
      options: {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
      },
    })

    const result = formatDate(testDate)
    expect(result).toMatch(/12\/25\/23/)
  })
})
