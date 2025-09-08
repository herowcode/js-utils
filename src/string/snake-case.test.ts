import { snakeCase } from "./snake-case"

describe("snakeCase", () => {
  it("should convert simple words to snake_case", () => {
    expect(snakeCase("hello world")).toBe("hello_world")
    expect(snakeCase("foo bar")).toBe("foo_bar")
    expect(snakeCase("test case")).toBe("test_case")
  })

  it("should handle camelCase strings", () => {
    expect(snakeCase("helloWorld")).toBe("hello_world")
    expect(snakeCase("fooBarBaz")).toBe("foo_bar_baz")
    expect(snakeCase("testCaseString")).toBe("test_case_string")
  })

  it("should handle PascalCase strings", () => {
    expect(snakeCase("HelloWorld")).toBe("hello_world")
    expect(snakeCase("FooBarBaz")).toBe("foo_bar_baz")
    expect(snakeCase("TestCaseString")).toBe("test_case_string")
  })

  it("should handle hyphenated strings", () => {
    expect(snakeCase("hello-world")).toBe("hello_world")
    expect(snakeCase("foo-bar-baz")).toBe("foo_bar_baz")
    expect(snakeCase("test-case-string")).toBe("test_case_string")
  })

  it("should handle already snake_case strings", () => {
    expect(snakeCase("hello_world")).toBe("hello_world")
    expect(snakeCase("foo_bar_baz")).toBe("foo_bar_baz")
  })

  it("should handle uppercase strings", () => {
    expect(snakeCase("HELLO WORLD")).toBe("hello_world")
    expect(snakeCase("FOO BAR BAZ")).toBe("foo_bar_baz")
  })

  it("should handle strings with numbers", () => {
    expect(snakeCase("hello123 world456")).toBe("hello123_world456")
    expect(snakeCase("test123Case")).toBe("test123case") // Numbers don't trigger case conversion
  })

  it("should remove special characters", () => {
    expect(snakeCase("hello@world!")).toBe("helloworld") // Special chars are removed
    expect(snakeCase("foo#bar$baz")).toBe("foobarbaz")
  })

  it("should handle empty strings", () => {
    expect(snakeCase("")).toBe("")
  })

  it("should handle single words", () => {
    expect(snakeCase("hello")).toBe("hello")
    expect(snakeCase("WORLD")).toBe("world")
  })

  it("should handle strings with only special characters", () => {
    expect(snakeCase("!@#$%")).toBe("")
    expect(snakeCase("---")).toBe("")
  })

  it("should handle multiple spaces", () => {
    expect(snakeCase("hello    world")).toBe("hello_world")
    expect(snakeCase("foo   bar   baz")).toBe("foo_bar_baz")
  })

  it("should remove leading and trailing underscores", () => {
    expect(snakeCase("_hello_world_")).toBe("hello_world")
    expect(snakeCase("__foo_bar__")).toBe("foo_bar")
  })

  it("should throw error for non-string input", () => {
    expect(() => snakeCase(123 as unknown as string)).toThrow(
      "Input must be a string",
    )
    expect(() => snakeCase(null as unknown as string)).toThrow(
      "Input must be a string",
    )
    expect(() => snakeCase(undefined as unknown as string)).toThrow(
      "Input must be a string",
    )
    expect(() => snakeCase([] as unknown as string)).toThrow(
      "Input must be a string",
    )
  })
})
