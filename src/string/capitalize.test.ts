import { capitalize } from "./capitalize"

describe("capitalize", () => {
  it("should capitalize the first letter of a string", () => {
    expect(capitalize("hello")).toBe("Hello")
    expect(capitalize("world")).toBe("World")
    expect(capitalize("javascript")).toBe("Javascript")
  })

  it("should handle uppercase strings", () => {
    expect(capitalize("HELLO")).toBe("Hello")
    expect(capitalize("WORLD")).toBe("World")
  })

  it("should handle mixed case strings", () => {
    expect(capitalize("hELLO")).toBe("Hello")
    expect(capitalize("wORLD")).toBe("World")
  })

  it("should handle single character strings", () => {
    expect(capitalize("a")).toBe("A")
    expect(capitalize("Z")).toBe("Z")
  })

  it("should handle empty strings", () => {
    expect(capitalize("")).toBe("")
  })

  it("should handle strings with spaces", () => {
    expect(capitalize("hello world")).toBe("Hello world")
    expect(capitalize("HELLO WORLD")).toBe("Hello world")
  })

  it("should handle strings with numbers", () => {
    expect(capitalize("123hello")).toBe("123hello")
    expect(capitalize("hello123")).toBe("Hello123")
  })

  it("should handle strings with special characters", () => {
    expect(capitalize("!hello")).toBe("!hello")
    expect(capitalize("@world")).toBe("@world")
  })

  it("should throw error for non-string input", () => {
    expect(() => capitalize(123 as unknown as string)).toThrow(
      "Input must be a string",
    )
    expect(() => capitalize(null as unknown as string)).toThrow(
      "Input must be a string",
    )
    expect(() => capitalize(undefined as unknown as string)).toThrow(
      "Input must be a string",
    )
    expect(() => capitalize([] as unknown as string)).toThrow(
      "Input must be a string",
    )
  })
})
