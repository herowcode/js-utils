import { describe, expect, it } from "vitest"
import { formatCurrency } from "./format-currency"
import { parseLocaleNumber } from "./parse-locale-number"

describe("parseLocaleNumber", () => {
  it("parses pt-BR numbers by default", () => {
    expect(parseLocaleNumber("1.234,56")).toBe(1234.56)
    expect(parseLocaleNumber("1234,5")).toBe(1234.5)
    expect(parseLocaleNumber("1.234")).toBe(1234)
    expect(parseLocaleNumber("0,5")).toBe(0.5)
    expect(parseLocaleNumber("42")).toBe(42)
  })

  it("strips currency symbols and codes", () => {
    expect(parseLocaleNumber("R$ 1.234,56")).toBe(1234.56)
    expect(parseLocaleNumber("R$ 1.234,56")).toBe(1234.56)
    expect(parseLocaleNumber("US$ 10,00")).toBe(10)
    expect(parseLocaleNumber("BRL 10,00")).toBe(10)
    expect(parseLocaleNumber("10,00 €")).toBe(10)
    expect(parseLocaleNumber("12,5%")).toBe(12.5)
  })

  it("handles negative forms", () => {
    expect(parseLocaleNumber("-1.234,56")).toBe(-1234.56)
    expect(parseLocaleNumber("-R$ 12,50")).toBe(-12.5)
    expect(parseLocaleNumber("R$ -12,50")).toBe(-12.5)
    expect(parseLocaleNumber("(R$ 12,50)")).toBe(-12.5)
    expect(parseLocaleNumber("−12,5")).toBe(-12.5)
    expect(parseLocaleNumber("+3,5")).toBe(3.5)
  })

  it("round-trips formatCurrency output", () => {
    for (const value of [0, 1234.56, -9876.54, 1000000.01]) {
      expect(parseLocaleNumber(formatCurrency(value))).toBe(value)
    }
  })

  it("derives separators from locale and honors decimal", () => {
    expect(parseLocaleNumber("1,234.56", { locale: "en-US" })).toBe(1234.56)
    expect(parseLocaleNumber("$1,234.56", { locale: "en-US" })).toBe(1234.56)
    expect(parseLocaleNumber("1 234,56", { locale: "fr-FR" })).toBe(1234.56)
    expect(parseLocaleNumber("1.234,56", { decimal: "," })).toBe(1234.56)
    expect(parseLocaleNumber("1,234.56", { decimal: "." })).toBe(1234.56)
  })

  it("returns integer cents with asCents", () => {
    expect(parseLocaleNumber("R$ 1,50", { asCents: true })).toBe(150)
    expect(parseLocaleNumber("19,99", { asCents: true })).toBe(1999)
    expect(parseLocaleNumber("-0,07", { asCents: true })).toBe(-7)
  })

  it("returns NaN on garbage", () => {
    for (const garbage of [
      "",
      "   ",
      "abc",
      "12abc",
      "abc12",
      "1e3",
      "1,2,3",
      "1.2.3",
      "0.5",
      "--1",
      "1,234,567,89",
      "(12,5",
      "12,5)",
      "R$",
      "NaN",
    ]) {
      expect(parseLocaleNumber(garbage)).toBeNaN()
    }
    expect(parseLocaleNumber(undefined as unknown as string)).toBeNaN()
    expect(parseLocaleNumber(12 as unknown as string)).toBeNaN()
  })

  it("rejects adversarial input quickly", () => {
    for (const input of [
      " ".repeat(100_000),
      `1${",".repeat(100_000)}`,
      `R$${" ".repeat(100_000)}x`,
      "(".repeat(100_000),
    ]) {
      const start = performance.now()
      expect(parseLocaleNumber(input)).toBeNaN()
      expect(performance.now() - start).toBeLessThan(50)
    }
  })
})
