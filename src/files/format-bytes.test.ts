import { formatBytes } from "./format-bytes"

describe("formatBytes", () => {
  it("formats bytes less than 1 KB", () => {
    expect(formatBytes(0)).toBe("0.00 B")
    expect(formatBytes(512)).toBe("512.00 B")
    expect(formatBytes(1023)).toBe("1023.00 B")
  })

  it("formats bytes in KB", () => {
    expect(formatBytes(1024)).toBe("1.00 KB")
    expect(formatBytes(1536)).toBe("1.50 KB")
    expect(formatBytes(10 * 1024)).toBe("10.00 KB")
  })

  it("formats bytes in MB", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.00 MB")
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB")
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.50 MB")
  })

  it("formats bytes in GB", () => {
    expect(formatBytes(1024 ** 3)).toBe("1.00 GB")
    expect(formatBytes(2.5 * 1024 ** 3)).toBe("2.50 GB")
  })

  it("formats bytes in TB", () => {
    expect(formatBytes(1024 ** 4)).toBe("1.00 TB")
  })

  it("formats bytes in PB", () => {
    expect(formatBytes(1024 ** 5)).toBe("1.00 PB")
  })

  it("throws for negative bytes", () => {
    expect(() => formatBytes(-1)).toThrow("Size in bytes cannot be negative")
  })
})
