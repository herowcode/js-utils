import { describe, expect, it } from "vitest"
import { formatBytes } from "./format-bytes"

describe("formatBytes options", () => {
  it("keeps the default output without options", () => {
    expect(formatBytes(1536)).toBe("1.50 KB")
    expect(formatBytes(1536, {})).toBe("1.50 KB")
    expect(formatBytes(0)).toBe("0.00 B")
  })

  it("sets the number of decimals", () => {
    expect(formatBytes(1536, { decimals: 0 })).toBe("2 KB")
    expect(formatBytes(1536, { decimals: 1 })).toBe("1.5 KB")
  })

  it("steps by 1000", () => {
    expect(formatBytes(1500, { base: 1000, decimals: 1 })).toBe("1.5 KB")
    expect(formatBytes(1_000_000, { base: 1000 })).toBe("1.00 MB")
  })

  it("formats the number for a locale", () => {
    expect(formatBytes(1536, { locale: "pt-BR" })).toBe("1,50 KB")
    expect(formatBytes(1536 * 1024, { locale: "en-US", decimals: 1 })).toBe(
      "1.5 MB",
    )
  })

  it("still rejects negative sizes", () => {
    expect(() => formatBytes(-1, { base: 1000 })).toThrow(
      "Size in bytes cannot be negative",
    )
  })
})
