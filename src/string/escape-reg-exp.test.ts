import { describe, expect, it } from "vitest"
import { escapeRegExp } from "./escape-reg-exp"

describe("escapeRegExp", () => {
  it("escapes every metacharacter", () => {
    const special = ".*+?^$" + "{}()|[]\\"
    const re = new RegExp(`^${escapeRegExp(special)}$`)
    expect(re.test(special)).toBe(true)
    expect(escapeRegExp("a.b")).toBe("a\\.b")
  })

  it("makes user input match literally", () => {
    expect(new RegExp(escapeRegExp("1+1=2")).test("1+1=2")).toBe(true)
    expect(new RegExp(escapeRegExp("1+1=2")).test("11=2")).toBe(false)
  })

  it("leaves plain text alone", () => {
    expect(escapeRegExp("hello world")).toBe("hello world")
    expect(escapeRegExp("")).toBe("")
  })

  it("returns an empty string for non-strings", () => {
    expect(escapeRegExp(undefined as unknown as string)).toBe("")
  })

  it("stays fast on 100 KB adversarial input", () => {
    for (const input of [
      ".".repeat(100_000),
      "a".repeat(100_000),
      "\\".repeat(100_000),
    ]) {
      const start = performance.now()
      escapeRegExp(input)
      expect(performance.now() - start).toBeLessThan(50)
    }
  })
})
