import { describe, expect, it } from "vitest"
import { formatNumber } from "./format-number"

describe("formatNumber", () => {
  it("defaults to pt-BR", () => {
    expect(formatNumber(1234567.891)).toBe(
      new Intl.NumberFormat("pt-BR").format(1234567.891),
    )
  })

  it("honors locale, decimals and compact", () => {
    expect(formatNumber(1234.5, { locale: "en-US", decimals: 2 })).toBe(
      "1,234.50",
    )
    expect(formatNumber(1500, { compact: true })).toBe(
      new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(1500),
    )
  })

  it("returns fallback for invalid input", () => {
    expect(formatNumber(Number.NaN)).toBe("")
    expect(formatNumber(undefined, { fallback: "-" })).toBe("-")
    expect(formatNumber(Number.NEGATIVE_INFINITY, { fallback: "-" })).toBe("-")
  })
})
