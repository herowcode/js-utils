import { describe, expect, it } from "vitest"
import { escapeHtml } from "./escape-html"

describe("escapeHtml", () => {
  it("escapes the five special characters", () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
    )
  })

  it("escapes ampersands first so entities are not double-decoded", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;")
  })

  it("leaves safe text alone", () => {
    expect(escapeHtml("olá mundo 123")).toBe("olá mundo 123")
    expect(escapeHtml("")).toBe("")
  })

  it("returns an empty string for non-strings", () => {
    expect(escapeHtml(undefined as unknown as string)).toBe("")
    expect(escapeHtml(null as unknown as string)).toBe("")
  })

  it("stays fast on 100 KB adversarial input", () => {
    for (const input of [
      "<".repeat(100_000),
      "&".repeat(100_000),
      "a".repeat(100_000),
    ]) {
      const start = performance.now()
      escapeHtml(input)
      expect(performance.now() - start).toBeLessThan(50)
    }
  })
})
