import { truncate } from "./truncate"

describe("truncate", () => {
  it("should truncate strings longer than specified length", () => {
    expect(truncate("hello world", 5)).toBe("he...")
    expect(truncate("javascript", 6)).toBe("jav...")
    expect(truncate("testing truncate", 10)).toBe("testing...")
  })

  it("should return original string if shorter than or equal to length", () => {
    expect(truncate("hello", 10)).toBe("hello")
    expect(truncate("test", 4)).toBe("test")
    expect(truncate("hi", 5)).toBe("hi")
  })

  it("should handle custom suffix", () => {
    expect(truncate("hello world", 5, "***")).toBe("he***")
    expect(truncate("javascript", 6, "--")).toBe("java--")
    expect(truncate("testing", 5, ">")).toBe("test>")
  })

  it("should handle empty suffix", () => {
    expect(truncate("hello world", 5, "")).toBe("hello")
    expect(truncate("javascript", 4, "")).toBe("java")
  })

  it("should handle zero length", () => {
    expect(truncate("hello", 0)).toBe("...")
    expect(truncate("world", 0, "***")).toBe("***")
  })

  it("should handle length equal to suffix length", () => {
    expect(truncate("hello", 3)).toBe("...")
    expect(truncate("world", 2, "--")).toBe("--")
  })

  it("should handle length less than suffix length", () => {
    expect(truncate("hello", 1)).toBe("...")
    expect(truncate("world", 1, "***")).toBe("***")
  })

  it("should handle empty strings", () => {
    expect(truncate("", 5)).toBe("")
    expect(truncate("", 0)).toBe("") // Empty string has length 0, so it's <= 0
  })

  it("should handle single character strings", () => {
    expect(truncate("a", 1)).toBe("a")
    expect(truncate("a", 0)).toBe("...")
  })

  it("should handle long suffix", () => {
    expect(truncate("hello", 10, "very long suffix")).toBe("hello") // String is shorter than length
    expect(truncate("hi", 5, "......")).toBe("hi") // String is shorter than length
  })

  it("should throw error for non-string input", () => {
    expect(() => truncate(123 as unknown as string, 5)).toThrow(
      "Input must be a string",
    )
    expect(() => truncate(null as unknown as string, 5)).toThrow(
      "Input must be a string",
    )
    expect(() => truncate(undefined as unknown as string, 5)).toThrow(
      "Input must be a string",
    )
    expect(() => truncate([] as unknown as string, 5)).toThrow(
      "Input must be a string",
    )
  })

  it("should throw error for invalid length", () => {
    expect(() => truncate("hello", -1)).toThrow(
      "Length must be a non-negative number",
    )
    expect(() => truncate("hello", "invalid" as unknown as number)).toThrow(
      "Length must be a non-negative number",
    )
    expect(() => truncate("hello", null as unknown as number)).toThrow(
      "Length must be a non-negative number",
    )
  })
})
