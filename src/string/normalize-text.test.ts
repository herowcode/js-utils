import { describe, expect, it } from "vitest"
import { normalizeText } from "./normalize-text"

describe("normalizeText", () => {
  it("lowercases, strips accents and punctuation, collapses whitespace", () => {
    expect(normalizeText("  Olá,   Mundo! ")).toBe("ola mundo")
    expect(normalizeText("Tab\tnew\nline")).toBe("tab new line")
  })

  it("keeps digits and underscores", () => {
    expect(normalizeText("Ünï_cödé 123")).toBe("uni_code 123")
  })

  it("returns an empty string for blank input", () => {
    expect(normalizeText("   ")).toBe("")
    expect(normalizeText("")).toBe("")
  })

  it("handles 100 KB of adversarial input in linear time", () => {
    const input = `${" ".repeat(50_000)}a${" ".repeat(50_000)}!`
    const start = performance.now()
    normalizeText(input)
    expect(performance.now() - start).toBeLessThan(50)
  })
})
