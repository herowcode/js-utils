import { describe, expect, it } from "vitest"
import { kebabCase } from "./kebab-case"

describe("kebabCase", () => {
  it("should convert simple words to kebab-case", () => {
    expect(kebabCase("hello world")).toBe("hello-world")
    expect(kebabCase("foo bar")).toBe("foo-bar")
    expect(kebabCase("test case")).toBe("test-case")
  })

  it("should handle camelCase strings", () => {
    expect(kebabCase("helloWorld")).toBe("hello-world")
    expect(kebabCase("fooBarBaz")).toBe("foo-bar-baz")
    expect(kebabCase("testCaseString")).toBe("test-case-string")
  })

  it("should handle PascalCase strings", () => {
    expect(kebabCase("HelloWorld")).toBe("hello-world")
    expect(kebabCase("FooBarBaz")).toBe("foo-bar-baz")
    expect(kebabCase("TestCaseString")).toBe("test-case-string")
  })

  it("should handle underscore separated strings", () => {
    expect(kebabCase("hello_world")).toBe("hello-world")
    expect(kebabCase("foo_bar_baz")).toBe("foo-bar-baz")
    expect(kebabCase("test_case_string")).toBe("test-case-string")
  })

  it("should handle already kebab-case strings", () => {
    expect(kebabCase("hello-world")).toBe("hello-world")
    expect(kebabCase("foo-bar-baz")).toBe("foo-bar-baz")
  })

  it("should handle uppercase strings", () => {
    expect(kebabCase("HELLO WORLD")).toBe("hello-world")
    expect(kebabCase("FOO BAR BAZ")).toBe("foo-bar-baz")
  })

  it("should handle strings with numbers", () => {
    expect(kebabCase("hello123 world456")).toBe("hello123-world456")
    expect(kebabCase("test123Case")).toBe("test123case") // Numbers don't trigger case conversion
  })

  it("should remove special characters", () => {
    expect(kebabCase("hello@world!")).toBe("helloworld") // Special chars are removed
    expect(kebabCase("foo#bar$baz")).toBe("foobarbaz")
  })

  it("should handle empty strings", () => {
    expect(kebabCase("")).toBe("")
  })

  it("should handle single words", () => {
    expect(kebabCase("hello")).toBe("hello")
    expect(kebabCase("WORLD")).toBe("world")
  })

  it("should handle strings with only special characters", () => {
    expect(kebabCase("!@#$%")).toBe("")
    expect(kebabCase("___")).toBe("")
  })

  it("should handle multiple spaces", () => {
    expect(kebabCase("hello    world")).toBe("hello-world")
    expect(kebabCase("foo   bar   baz")).toBe("foo-bar-baz")
  })

  it("should remove leading and trailing hyphens", () => {
    expect(kebabCase("-hello-world-")).toBe("hello-world")
    expect(kebabCase("--foo-bar--")).toBe("foo-bar")
  })

  it("should throw error for non-string input", () => {
    expect(() => kebabCase(123 as unknown as string)).toThrow(
      "Input must be a string",
    )
    expect(() => kebabCase(null as unknown as string)).toThrow(
      "Input must be a string",
    )
    expect(() => kebabCase(undefined as unknown as string)).toThrow(
      "Input must be a string",
    )
    expect(() => kebabCase([] as unknown as string)).toThrow(
      "Input must be a string",
    )
  })
})
