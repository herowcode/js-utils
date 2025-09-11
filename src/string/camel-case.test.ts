import { describe, expect, it } from "vitest"
import { camelCase } from "./camel-case"

describe("camelCase", () => {
  it("should convert simple words to camelCase", () => {
    expect(camelCase("hello world")).toBe("helloWorld")
    expect(camelCase("foo bar")).toBe("fooBar")
    expect(camelCase("test case")).toBe("testCase")
  })

  it("should handle hyphenated strings", () => {
    expect(camelCase("hello-world")).toBe("helloWorld")
    expect(camelCase("foo-bar-baz")).toBe("fooBarBaz")
    expect(camelCase("test-case-string")).toBe("testCaseString")
  })

  it("should handle underscore separated strings", () => {
    expect(camelCase("hello_world")).toBe("helloWorld")
    expect(camelCase("foo_bar_baz")).toBe("fooBarBaz")
    expect(camelCase("test_case_string")).toBe("testCaseString")
  })

  it("should handle mixed separators", () => {
    expect(camelCase("hello-world_test case")).toBe("helloWorldTestCase")
    expect(camelCase("foo_bar-baz test")).toBe("fooBarBazTest")
  })

  it("should handle already camelCase strings", () => {
    expect(camelCase("helloWorld")).toBe("helloworld")
    expect(camelCase("fooBarBaz")).toBe("foobarbaz")
  })

  it("should handle uppercase strings", () => {
    expect(camelCase("HELLO WORLD")).toBe("helloWorld")
    expect(camelCase("FOO-BAR-BAZ")).toBe("fooBarBaz")
  })

  it("should handle strings with numbers", () => {
    expect(camelCase("hello123 world456")).toBe("hello123World456")
    expect(camelCase("test-123-case")).toBe("test123Case")
  })

  it("should remove special characters", () => {
    expect(camelCase("hello@world!")).toBe("helloworld")
    expect(camelCase("foo#bar$baz")).toBe("foobarbaz")
  })

  it("should handle empty strings", () => {
    expect(camelCase("")).toBe("")
  })

  it("should handle single words", () => {
    expect(camelCase("hello")).toBe("hello")
    expect(camelCase("WORLD")).toBe("world")
  })

  it("should handle strings with only special characters", () => {
    expect(camelCase("!@#$%")).toBe("")
    expect(camelCase("---")).toBe("")
  })

  it("should handle multiple spaces", () => {
    expect(camelCase("hello    world")).toBe("helloWorld")
    expect(camelCase("foo   bar   baz")).toBe("fooBarBaz")
  })

  it("should throw error for non-string input", () => {
    expect(() => camelCase(123 as unknown as string)).toThrow(
      "Input must be a string",
    )
    expect(() => camelCase(null as unknown as string)).toThrow(
      "Input must be a string",
    )
    expect(() => camelCase(undefined as unknown as string)).toThrow(
      "Input must be a string",
    )
    expect(() => camelCase([] as unknown as string)).toThrow(
      "Input must be a string",
    )
  })
})
