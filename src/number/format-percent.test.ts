import { describe, expect, it } from "vitest"
import { formatPercent } from "./format-percent"

describe("formatPercent", () => {
  it("treats the value as a percentage", () => {
    expect(formatPercent(25)).toBe(
      new Intl.NumberFormat("pt-BR", { style: "percent" }).format(0.25),
    )
  })

  it("keeps up to two fraction digits by default", () => {
    expect(formatPercent(12.5)).toBe(
      new Intl.NumberFormat("pt-BR", {
        style: "percent",
        maximumFractionDigits: 2,
      }).format(0.125),
    )
  })

  it("fixes fraction digits with decimals", () => {
    expect(formatPercent(50, { decimals: 1 })).toBe(
      new Intl.NumberFormat("pt-BR", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(0.5),
    )
  })

  it("honors locale", () => {
    expect(formatPercent(12.5, { locale: "en-US" })).toBe("12.5%")
  })

  it("returns fallback for invalid input", () => {
    expect(formatPercent(Number.NaN)).toBe("")
    expect(formatPercent(null, { fallback: "-" })).toBe("-")
  })
})
