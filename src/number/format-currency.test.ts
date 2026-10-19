import { describe, expect, it } from "vitest"
import { formatCurrency } from "./format-currency"

const brl = (options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    ...options,
  })

describe("formatCurrency", () => {
  it("matches Intl.NumberFormat for BRL pt-BR by default", () => {
    expect(formatCurrency(1234.5)).toBe(brl().format(1234.5))
    expect(formatCurrency(-0.99)).toBe(brl().format(-0.99))
  })

  it("puts a non-breaking space after R$", () => {
    expect(formatCurrency(10)).toContain("R$ ")
  })

  it("divides by 100 with fromCents", () => {
    expect(formatCurrency(12345, { fromCents: true })).toBe(
      brl().format(123.45),
    )
  })

  it("honors currency and locale", () => {
    expect(formatCurrency(1234.5, { currency: "USD", locale: "en-US" })).toBe(
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(1234.5),
    )
  })

  it("fixes fraction digits with decimals", () => {
    expect(formatCurrency(10, { decimals: 0 })).toBe(
      brl({ minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(10),
    )
    expect(formatCurrency(1.23456, { decimals: 3 })).toBe(
      brl({ minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(
        1.23456,
      ),
    )
  })

  it("supports compact notation", () => {
    expect(formatCurrency(1500000, { compact: true })).toBe(
      brl({ notation: "compact" }).format(1500000),
    )
  })

  describe("stripZeroCents", () => {
    it("drops the decimal part when cents are zero", () => {
      const out = formatCurrency(1500, { stripZeroCents: true })
      expect(out).toBe(
        brl({ minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
          1500,
        ),
      )
      expect(out).not.toContain(",")
    })

    it("keeps cents when they are not zero", () => {
      expect(formatCurrency(1500.5, { stripZeroCents: true })).toBe(
        brl().format(1500.5),
      )
    })

    it("works for negative amounts and other locales", () => {
      expect(formatCurrency(-20, { stripZeroCents: true })).toBe(
        brl({ minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(-20),
      )
      expect(
        formatCurrency(5, {
          currency: "USD",
          locale: "en-US",
          stripZeroCents: true,
        }),
      ).toBe("$5")
    })

    it("works with fromCents", () => {
      expect(
        formatCurrency(150000, { fromCents: true, stripZeroCents: true }),
      ).toBe(formatCurrency(1500, { stripZeroCents: true }))
    })
  })

  it("never prints a negative zero", () => {
    expect(formatCurrency(-0)).toBe(brl().format(0))
  })

  it("returns fallback for invalid input", () => {
    expect(formatCurrency(Number.NaN)).toBe("")
    expect(formatCurrency(null)).toBe("")
    expect(formatCurrency(undefined, { fallback: "-" })).toBe("-")
    expect(formatCurrency(Number.POSITIVE_INFINITY, { fallback: "n/a" })).toBe(
      "n/a",
    )
    expect(formatCurrency("12" as unknown as number, { fallback: "x" })).toBe(
      "x",
    )
  })
})
