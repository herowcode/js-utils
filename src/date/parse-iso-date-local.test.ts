import { describe, expect, it } from "vitest"
import { parseISODateLocal } from "./parse-iso-date-local"

describe("parseISODateLocal", () => {
  it("returns local midnight of that calendar day", () => {
    const d = parseISODateLocal("2026-01-01") as Date
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 0, 1])
    expect([
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds(),
    ]).toEqual([0, 0, 0, 0])
  })

  it("handles Feb 29 and December 31", () => {
    const leap = parseISODateLocal("2028-02-29") as Date
    expect([leap.getMonth(), leap.getDate()]).toEqual([1, 29])
    const eoy = parseISODateLocal("2026-12-31") as Date
    expect([eoy.getMonth(), eoy.getDate()]).toEqual([11, 31])
  })

  it("returns null for malformed or impossible dates", () => {
    expect(parseISODateLocal("2026-02-29")).toBeNull()
    expect(parseISODateLocal("2026-1-1")).toBeNull()
    expect(parseISODateLocal("2026-01-01T00:00:00Z")).toBeNull()
    expect(parseISODateLocal("")).toBeNull()
  })

  it("honours a custom fallback", () => {
    const fb = new Date(0)
    expect(parseISODateLocal("bad", { fallback: fb })).toBe(fb)
  })
})
