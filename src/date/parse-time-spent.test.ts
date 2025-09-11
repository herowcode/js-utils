import { beforeEach, describe, expect, it, vi } from "vitest"
import { parseTimeSpent } from "./parse-time-spent"

describe("parseTimeSpent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return formatted time spent in the default locale (pt-BR)", () => {
    const result = parseTimeSpent("2020-01-01", "2022-04-16")
    expect(result.formatted).toBe("2 anos, 3 meses e 15 dias")
  })

  it("should return formatted time spent in English (en-US)", () => {
    const result = parseTimeSpent("2020-01-01", "2022-04-16", "en-US")
    expect(result.formatted).toBe("2 years, 3 months, and 15 days")
  })

  it("should return formatted time spent in Spanish (es-ES)", () => {
    const result = parseTimeSpent("2020-01-01", "2022-04-16", "es-ES")
    expect(result.formatted).toBe("2 años, 3 meses y 15 días")
  })

  it("should return formatted time spent in French (fr-FR)", () => {
    const result = parseTimeSpent("2020-01-01", "2022-04-16", "fr-FR")
    expect(result.formatted).toBe("2 ans, 3 mois et 15 jours")
  })

  it("should default to pt-BR if an unsupported locale is provided", () => {
    const result = parseTimeSpent(
      "2020-01-01",
      "2022-04-16",
      "unsupported-locale",
    )
    expect(result.formatted).toBe("2 anos, 3 meses e 15 dias")
  })

  it("should handle cases with only years", () => {
    const result = parseTimeSpent("2020-01-01", "2022-01-01")
    expect(result.formatted).toBe("2 anos")
  })

  it("should handle cases with only months", () => {
    const result = parseTimeSpent("2022-01-01", "2022-04-01")
    expect(result.formatted).toBe("3 meses")
  })

  it("should handle cases with only days", () => {
    const result = parseTimeSpent("2022-04-01", "2022-04-16")
    expect(result.formatted).toBe("15 dias")
  })

  it("should return an empty string if no time has passed", () => {
    const result = parseTimeSpent("2022-04-16", "2022-04-16")
    expect(result.formatted).toBe("")
  })

  it("should handle days, hours, minutes and seconds", () => {
    const result = parseTimeSpent("2022-04-01T00:00:00", "2022-04-02T03:04:05")
    expect(result.years).toBe(0)
    expect(result.months).toBe(0)
    expect(result.days).toBe(1)
    expect(result.hours).toBe(3)
    expect(result.minutes).toBe(4)
    expect(result.seconds).toBe(5)
    expect(result.formatted).toBe("1 dia, 3 horas, 4 minutos e 5 segundos")
  })

  it("should handle hours and minutes only", () => {
    const result = parseTimeSpent("2022-04-01T01:15:00", "2022-04-01T03:45:00")
    expect(result.years).toBe(0)
    expect(result.months).toBe(0)
    expect(result.days).toBe(0)
    expect(result.hours).toBe(2)
    expect(result.minutes).toBe(30)
    expect(result.seconds).toBe(0)
    expect(result.formatted).toBe("2 horas e 30 minutos")
  })

  it("should support compact format and minimal option", () => {
    const compact = parseTimeSpent(
      "2022-04-01T00:00:00",
      "2022-04-02T03:04:05",
      "pt-BR",
      { format: "compact" },
    )
    expect(compact.formatted).toBe("1d3h4min5s")

    const compactMinimal = parseTimeSpent(
      "2022-04-01T00:00:00",
      "2022-04-02T03:04:05",
      "pt-BR",
      { format: "compact", minimal: true },
    )
    expect(compactMinimal.formatted).toBe("1d")

    const verboseMinimal = parseTimeSpent(
      "2022-04-01T00:00:00",
      "2022-04-02T03:04:05",
      "pt-BR",
      { minimal: true },
    )
    expect(verboseMinimal.formatted).toBe("1 dia")
  })

  it("should support compact format for hours and minutes only", () => {
    const compactHM = parseTimeSpent(
      "2022-04-01T01:15:00",
      "2022-04-01T03:45:00",
      "pt-BR",
      { format: "compact" },
    )
    expect(compactHM.formatted).toBe("2h30min")

    const compactHMMinimal = parseTimeSpent(
      "2022-04-01T01:15:00",
      "2022-04-01T03:45:00",
      "pt-BR",
      { format: "compact", minimal: true },
    )
    expect(compactHMMinimal.formatted).toBe("2h")
  })

  it("should support compact format for minutes and seconds only", () => {
    const compactMS = parseTimeSpent(
      "2022-04-01T00:01:10",
      "2022-04-01T00:05:20",
      "pt-BR",
      { format: "compact" },
    )
    expect(compactMS.minutes).toBe(4)
    expect(compactMS.seconds).toBe(10)
    expect(compactMS.formatted).toBe("4min10s")

    const compactMSMinimal = parseTimeSpent(
      "2022-04-01T00:01:10",
      "2022-04-01T00:05:20",
      "pt-BR",
      { format: "compact", minimal: true },
    )
    expect(compactMSMinimal.formatted).toBe("4min")
  })

  it("should support compact format for seconds only", () => {
    const compactS = parseTimeSpent(
      "2022-04-01T00:00:00",
      "2022-04-01T00:00:10",
      "pt-BR",
      { format: "compact" },
    )
    expect(compactS.seconds).toBe(10)
    expect(compactS.formatted).toBe("10s")

    const compactSMinimal = parseTimeSpent(
      "2022-04-01T00:00:00",
      "2022-04-01T00:00:10",
      "pt-BR",
      { format: "compact", minimal: true },
    )
    expect(compactSMinimal.formatted).toBe("10s")
  })

  it("should return zeros for all numeric fields when no time has passed", () => {
    const result = parseTimeSpent("2022-04-16T10:00:00", "2022-04-16T10:00:00")
    expect(result.years).toBe(0)
    expect(result.months).toBe(0)
    expect(result.days).toBe(0)
    expect(result.hours).toBe(0)
    expect(result.minutes).toBe(0)
    expect(result.seconds).toBe(0)
    expect(result.formatted).toBe("")
  })
})
