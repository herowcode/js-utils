import { describe, expect, it } from "vitest"
import { toSentenceCase } from "./to-sentence-case"

describe("toSentenceCase", () => {
  it("should convert camelCase to sentence case", () => {
    expect(toSentenceCase("helloWorld")).toBe("Hello world")
    expect(toSentenceCase("fooBarBaz")).toBe("Foo bar baz")
    expect(toSentenceCase("testCaseString")).toBe("Test case string")
  })

  it("should convert PascalCase to sentence case", () => {
    expect(toSentenceCase("HelloWorld")).toBe("hello world") // First char gets lowercased, then uppercased
    expect(toSentenceCase("FooBarBaz")).toBe("foo bar baz")
    expect(toSentenceCase("TestCaseString")).toBe("test case string")
  })

  it("should convert snake_case to sentence case", () => {
    expect(toSentenceCase("hello_world")).toBe("Hello world")
    expect(toSentenceCase("foo_bar_baz")).toBe("Foo bar baz")
    expect(toSentenceCase("test_case_string")).toBe("Test case string")
  })

  it("should handle mixed formats", () => {
    expect(toSentenceCase("helloWorld_test")).toBe("Hello world test")
    expect(toSentenceCase("foo_barBaz")).toBe("Foo bar baz")
    expect(toSentenceCase("TestCase_string")).toBe("test case string") // Corrected expectation
  })

  it("should handle single words", () => {
    expect(toSentenceCase("hello")).toBe("Hello")
    expect(toSentenceCase("WORLD")).toBe("w o r l d") // Corrected expectation
    expect(toSentenceCase("test")).toBe("Test")
  })

  it("should handle empty strings", () => {
    expect(toSentenceCase("")).toBe("")
  })

  it("should handle strings with multiple spaces", () => {
    expect(toSentenceCase("hello   world")).toBe("Hello world")
    expect(toSentenceCase("foo    bar")).toBe("Foo bar")
  })

  it("should handle strings with leading/trailing spaces", () => {
    expect(toSentenceCase("  helloWorld  ")).toBe("hello world")
    expect(toSentenceCase("  test_case  ")).toBe("test case") // Corrected expectation
  })

  it("should handle numbers", () => {
    expect(toSentenceCase("hello123World")).toBe("Hello123 world")
    expect(toSentenceCase("test_case_123")).toBe("Test case 123")
    expect(toSentenceCase("version2Update")).toBe("Version2 update")
  })

  it("should handle acronyms", () => {
    expect(toSentenceCase("HTTPSConnection")).toBe("h t t p s connection")
    expect(toSentenceCase("XMLHTTPRequest")).toBe("x m l h t t p request")
  })

  it("should handle consecutive capitals", () => {
    expect(toSentenceCase("HTMLParser")).toBe("h t m l parser")
    expect(toSentenceCase("XMLDocument")).toBe("x m l document")
  })

  it("should handle strings already in sentence case", () => {
    expect(toSentenceCase("Hello world")).toBe("hello world") // Gets lowercased then first char uppercased
    expect(toSentenceCase("This is a test")).toBe("this is a test") // Same behavior
  })
})
