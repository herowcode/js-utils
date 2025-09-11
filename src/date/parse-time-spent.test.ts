import { beforeEach, describe, expect, it, vi } from "vitest"
import { parseTimeSpent } from "./parse-time-spent"

describe("parseTimeSpent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return formatted time spent in the default locale (pt-BR)", () => {
    const result = parseTimeSpent("2020-01-01", "2022-04-16")
    expect(result).toBe("2 anos, 3 meses e 15 dias")
  })

  it("should return formatted time spent in English (en-US)", () => {
    const result = parseTimeSpent("2020-01-01", "2022-04-16", "en-US")
    expect(result).toBe("2 years, 3 months, and 15 days")
  })

  it("should return formatted time spent in Spanish (es-ES)", () => {
    const result = parseTimeSpent("2020-01-01", "2022-04-16", "es-ES")
    expect(result).toBe("2 años, 3 meses y 15 días")
  })

  it("should return formatted time spent in French (fr-FR)", () => {
    const result = parseTimeSpent("2020-01-01", "2022-04-16", "fr-FR")
    expect(result).toBe("2 ans, 3 mois et 15 jours")
  })

  it("should default to pt-BR if an unsupported locale is provided", () => {
    const result = parseTimeSpent(
      "2020-01-01",
      "2022-04-16",
      "unsupported-locale",
    )
    expect(result).toBe("2 anos, 3 meses e 15 dias")
  })

  it("should handle cases with only years", () => {
    const result = parseTimeSpent("2020-01-01", "2022-01-01")
    expect(result).toBe("2 anos")
  })

  it("should handle cases with only months", () => {
    const result = parseTimeSpent("2022-01-01", "2022-04-01")
    expect(result).toBe("3 meses")
  })

  it("should handle cases with only days", () => {
    const result = parseTimeSpent("2022-04-01", "2022-04-16")
    expect(result).toBe("15 dias")
  })

  it("should return an empty string if no time has passed", () => {
    const result = parseTimeSpent("2022-04-16", "2022-04-16")
    expect(result).toBe("")
  })
})
