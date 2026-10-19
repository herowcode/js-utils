import { describe, expect, it } from "vitest"
import { parseRetryAfterMs } from "./parse-retry-after-ms"

const NOW = Date.parse("2026-01-01T00:00:00Z")

describe("parseRetryAfterMs", () => {
  it("parses delta-seconds", () => {
    expect(parseRetryAfterMs("120")).toBe(120_000)
    expect(parseRetryAfterMs(" 0 ")).toBe(0)
  })

  it("parses an HTTP date relative to now", () => {
    expect(parseRetryAfterMs("Thu, 01 Jan 2026 00:00:30 GMT", NOW)).toBe(30_000)
  })

  it("clamps past dates to 0", () => {
    expect(parseRetryAfterMs("Wed, 31 Dec 2025 23:00:00 GMT", NOW)).toBe(0)
  })

  it.each(["1.5", "-1", "+3", "", "soon", "NaN"])("rejects %j", (value) => {
    expect(parseRetryAfterMs(value, NOW)).toBeUndefined()
  })

  it("returns undefined for null and undefined", () => {
    expect(parseRetryAfterMs(null)).toBeUndefined()
    expect(parseRetryAfterMs(undefined)).toBeUndefined()
  })

  it("handles 100 KB adversarial input in linear time", () => {
    for (const input of [
      "1".repeat(100_000),
      `${"1.".repeat(50_000)}x`,
      " ".repeat(100_000),
    ]) {
      const start = performance.now()
      parseRetryAfterMs(input, NOW)
      expect(performance.now() - start).toBeLessThan(50)
    }
  })
})
