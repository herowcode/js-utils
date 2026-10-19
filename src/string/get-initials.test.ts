import { describe, expect, it } from "vitest"
import { getInitials } from "./get-initials"

describe("getInitials", () => {
  it("uses the first and last words", () => {
    expect(getInitials("Maria da Silva")).toBe("MS")
    expect(getInitials("john ronald reuel tolkien")).toBe("JT")
  })

  it("handles one word and two words", () => {
    expect(getInitials("madonna")).toBe("M")
    expect(getInitials("Ada Lovelace")).toBe("AL")
  })

  it("respects max", () => {
    expect(getInitials("Ada King Lovelace", { max: 3 })).toBe("AKL")
    expect(getInitials("Ada King Lovelace", { max: 1 })).toBe("A")
    expect(getInitials("Ada Lovelace", { max: 5 })).toBe("AL")
  })

  it("trims, collapses whitespace and skips leading punctuation", () => {
    expect(getInitials("  ada   lovelace ")).toBe("AL")
    expect(getInitials('"Ada" (Lovelace)')).toBe("AL")
    expect(getInitials("- ada")).toBe("A")
  })

  it("handles accents, emoji and non-latin scripts", () => {
    expect(getInitials("élodie çelik")).toBe("ÉÇ")
    expect(getInitials("田中 太郎")).toBe("田太")
    expect(getInitials("😀 Smile")).toBe("S")
  })

  it("returns fallback for empty or invalid input", () => {
    expect(getInitials("")).toBe("")
    expect(getInitials("   ")).toBe("")
    expect(getInitials("!!!", { fallback: "?" })).toBe("?")
    expect(getInitials(null, { fallback: "?" })).toBe("?")
    expect(getInitials(undefined)).toBe("")
    expect(getInitials("Ada", { max: 0, fallback: "?" })).toBe("?")
  })

  it("stays fast on 100 KB adversarial input", () => {
    for (const input of [
      "a ".repeat(50_000),
      " ".repeat(100_000),
      `${"!".repeat(100_000)}a`,
      "a".repeat(100_000),
    ]) {
      const start = performance.now()
      getInitials(input)
      expect(performance.now() - start).toBeLessThan(50)
    }
  })
})
