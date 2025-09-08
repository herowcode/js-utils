import { slugify } from "./slugify"

describe("slugify", () => {
  it("should convert basic strings to slugs", () => {
    expect(slugify("Hello World")).toBe("hello-world")
    expect(slugify("Foo Bar Baz")).toBe("foo-bar-baz")
    expect(slugify("Test Case")).toBe("test-case")
  })

  it("should handle special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world")
    expect(slugify("Test@Example.com")).toBe("testexamplecom")
    expect(slugify("Price: $29.99")).toBe("price-2999")
  })

  it("should handle accented characters", () => {
    expect(slugify("Café")).toBe("cafe")
    expect(slugify("naïve")).toBe("naive")
    expect(slugify("résumé")).toBe("resume")
    expect(slugify("São Paulo")).toBe("sao-paulo")
  })

  it("should handle multiple spaces", () => {
    expect(slugify("Hello    World")).toBe("hello-world")
    expect(slugify("Foo   Bar   Baz")).toBe("foo-bar-baz")
  })

  it("should handle leading and trailing spaces", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world")
    expect(slugify("   Test   ")).toBe("test")
  })

  it("should handle numbers", () => {
    expect(slugify("Version 2.0")).toBe("version-20")
    expect(slugify("Test 123")).toBe("test-123")
    expect(slugify("2023 Update")).toBe("2023-update")
  })

  it("should handle empty strings", () => {
    expect(slugify("")).toBe("")
    expect(slugify("   ")).toBe("")
  })

  it("should handle strings with only special characters", () => {
    expect(slugify("!@#$%^&*()")).toBe("")
    expect(slugify("---")).toBe("")
  })

  it("should handle mixed case", () => {
    expect(slugify("CamelCase")).toBe("camelcase")
    expect(slugify("PascalCase")).toBe("pascalcase")
    expect(slugify("UPPERCASE")).toBe("uppercase")
  })

  it("should handle underscores", () => {
    expect(slugify("hello_world")).toBe("hello_world")
    expect(slugify("test_case_string")).toBe("test_case_string")
  })

  it("should handle complex strings", () => {
    expect(slugify("The Quick Brown Fox Jumps Over The Lazy Dog!")).toBe(
      "the-quick-brown-fox-jumps-over-the-lazy-dog",
    )
    expect(slugify("Montréal, Québec - Canada (2023)")).toBe(
      "montreal-quebec-canada-2023",
    )
  })

  it("should handle single words", () => {
    expect(slugify("hello")).toBe("hello")
    expect(slugify("WORLD")).toBe("world")
    expect(slugify("test123")).toBe("test123")
  })
})
