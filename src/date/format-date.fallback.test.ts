import { describe, expect, it } from "vitest"
import { formatDate } from "./format-date"

describe("formatDate fallback", () => {
  it("still throws for invalid dates without a fallback", () => {
    expect(() => formatDate("nope")).toThrow(RangeError)
    expect(() => formatDate("nope", "pt-BR")).toThrow("Invalid time value")
    expect(() => formatDate("nope", { format: "DD/MM/YYYY" })).toThrow(
      RangeError,
    )
  })

  it("returns the fallback from the config object", () => {
    expect(formatDate("nope", { fallback: "-" })).toBe("-")
    expect(formatDate("nope", { format: "DD/MM/YYYY", fallback: "" })).toBe("")
  })

  it("ignores the fallback for valid dates", () => {
    expect(
      formatDate("2025-01-02T12:00:00Z", {
        format: "DD/MM/YYYY",
        fallback: "-",
      }),
    ).toBe(formatDate("2025-01-02T12:00:00Z", { format: "DD/MM/YYYY" }))
  })
})
