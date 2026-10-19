import { describe, expect, it } from "vitest"
import { removeAccents } from "./remove-accents"

describe("removeAccents", () => {
  it("strips diacritics and keeps case and punctuation", () => {
    expect(removeAccents("Crème Brûlée, Ação!")).toBe("Creme Brulee, Acao!")
  })

  it("returns plain ASCII and empty strings unchanged", () => {
    expect(removeAccents("plain")).toBe("plain")
    expect(removeAccents("")).toBe("")
  })

  it("handles precomposed and decomposed input alike", () => {
    expect(removeAccents("é")).toBe("e")
    expect(removeAccents("é")).toBe("e")
  })

  it("handles 100 KB of adversarial input in linear time", () => {
    const input = `${"e\u0301".repeat(50_000)}!`
    const start = performance.now()
    removeAccents(input)
    expect(performance.now() - start).toBeLessThan(50)
  })
})
