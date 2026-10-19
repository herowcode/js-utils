import { describe, expect, it } from "vitest"
import { formatCEP, formatCNPJ, formatCPF, isValidCNPJ, isValidCPF } from "."

const HUGE = 100_000

function within50ms(fn: () => unknown) {
  const start = performance.now()
  fn()
  expect(performance.now() - start).toBeLessThan(50)
}

describe("formatCEP", () => {
  it("formats 8 digits from any punctuation", () => {
    expect(formatCEP("01310100")).toBe("01310-100")
    expect(formatCEP("01.310-100")).toBe("01310-100")
  })

  it("returns the fallback for wrong lengths and non-strings", () => {
    expect(formatCEP("1234")).toBe("")
    expect(formatCEP(undefined)).toBe("")
    expect(formatCEP(1310100, { fallback: "-" })).toBe("-")
  })

  it("stays linear on 100 KB of punctuation", () => {
    within50ms(() => formatCEP(`${"-".repeat(HUGE)}01310100`))
    within50ms(() => formatCEP("9".repeat(HUGE)))
  })
})

describe("CPF", () => {
  it("accepts valid CPFs with or without punctuation", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true)
    expect(isValidCPF("52998224725")).toBe(true)
    expect(isValidCPF("111.444.777-35")).toBe(true)
  })

  it("rejects wrong check digits, lengths, repeated digits and non-strings", () => {
    expect(isValidCPF("529.982.247-24")).toBe(false)
    expect(isValidCPF("529.982.247-35")).toBe(false)
    expect(isValidCPF("5299822472")).toBe(false)
    expect(isValidCPF("529982247255")).toBe(false)
    expect(isValidCPF("000.000.000-00")).toBe(false)
    expect(isValidCPF("11111111111")).toBe(false)
    expect(isValidCPF(52998224725)).toBe(false)
    expect(isValidCPF(null)).toBe(false)
  })

  it("formats 11 digits without validating them", () => {
    expect(formatCPF("52998224725")).toBe("529.982.247-25")
    expect(formatCPF("11111111111")).toBe("111.111.111-11")
    expect(formatCPF("123")).toBe("")
    expect(formatCPF("123", { fallback: "?" })).toBe("?")
  })

  it("stays linear on 100 KB input", () => {
    within50ms(() => isValidCPF(`${"x".repeat(HUGE)}52998224725`))
    within50ms(() => formatCPF("1".repeat(HUGE)))
  })
})

describe("CNPJ", () => {
  it("accepts valid CNPJs with or without punctuation", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true)
    expect(isValidCNPJ("11222333000181")).toBe(true)
    expect(isValidCNPJ("00.000.000/0001-91")).toBe(true)
  })

  it("accepts the alphanumeric format", () => {
    expect(isValidCNPJ("12.ABC.345/01DE-35")).toBe(true)
    expect(isValidCNPJ("12abc34501de35")).toBe(true)
    expect(isValidCNPJ("12.ABC.345/01DE-36")).toBe(false)
  })

  it("rejects wrong check digits, lengths, repeated characters and non-strings", () => {
    expect(isValidCNPJ("11.222.333/0001-82")).toBe(false)
    expect(isValidCNPJ("11.222.333/0001-91")).toBe(false)
    expect(isValidCNPJ("1122233300018")).toBe(false)
    expect(isValidCNPJ("00000000000000")).toBe(false)
    expect(isValidCNPJ("11222333000AB1")).toBe(false)
    expect(isValidCNPJ(11222333000181)).toBe(false)
    expect(isValidCNPJ(undefined)).toBe(false)
  })

  it("formats 14 characters without validating them", () => {
    expect(formatCNPJ("11222333000181")).toBe("11.222.333/0001-81")
    expect(formatCNPJ("12abc34501de35")).toBe("12.ABC.345/01DE-35")
    expect(formatCNPJ("1122")).toBe("")
    expect(formatCNPJ(null, { fallback: "n/a" })).toBe("n/a")
  })

  it("stays linear on 100 KB input", () => {
    within50ms(() => isValidCNPJ(`${"-".repeat(HUGE)}11222333000181`))
    within50ms(() => formatCNPJ("A".repeat(HUGE)))
  })
})
