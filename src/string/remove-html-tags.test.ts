import { removeHtmlTags } from "./remove-html-tags"

describe("removeHtmlTags", () => {
  it("should remove simple HTML tags", () => {
    expect(removeHtmlTags("<p>Hello world</p>")).toBe("Hello world")
    expect(removeHtmlTags("<div>Test content</div>")).toBe("Test content")
    expect(removeHtmlTags("<span>Simple text</span>")).toBe("Simple text")
  })

  it("should remove self-closing tags", () => {
    expect(removeHtmlTags("Line 1<br/>Line 2")).toBe("Line 1Line 2")
    expect(removeHtmlTags('Image: <img src="test.jpg"/>')).toBe("Image: ")
    expect(removeHtmlTags("Break<hr>here")).toBe("Breakhere")
  })

  it("should remove tags with attributes", () => {
    expect(removeHtmlTags('<p class="test">Hello</p>')).toBe("Hello")
    expect(removeHtmlTags('<a href="https://example.com">Link</a>')).toBe(
      "Link",
    )
    expect(
      removeHtmlTags('<div id="container" class="main">Content</div>'),
    ).toBe("Content")
  })

  it("should handle nested tags", () => {
    expect(
      removeHtmlTags("<div><p>Hello <strong>world</strong></p></div>"),
    ).toBe("Hello world")
    expect(removeHtmlTags("<ul><li>Item 1</li><li>Item 2</li></ul>")).toBe(
      "Item 1Item 2",
    )
  })

  it("should handle tags with quoted attributes", () => {
    expect(removeHtmlTags('<div class="my class">Content</div>')).toBe(
      "Content",
    )
    expect(removeHtmlTags(`<img src='image.jpg' alt="description">`)).toBe("")
    expect(
      removeHtmlTags('<a href="http://example.com" title="Example">Link</a>'),
    ).toBe("Link")
  })

  it("should handle malformed HTML gracefully", () => {
    expect(removeHtmlTags("<p>Unclosed tag")).toBe("Unclosed tag")
    expect(removeHtmlTags("Opened <div> but not closed")).toBe(
      "Opened  but not closed",
    )
    expect(removeHtmlTags("<>Empty tag<>")).toBe("Empty tag")
  })

  it("should preserve text without HTML tags", () => {
    expect(removeHtmlTags("Just plain text")).toBe("Just plain text")
    expect(removeHtmlTags("Text with symbols")).toBe("Text with symbols")
  })

  it("should handle empty input", () => {
    expect(removeHtmlTags("")).toBe("")
    expect(removeHtmlTags(null as unknown as string)).toBe("")
    expect(removeHtmlTags(undefined as unknown as string)).toBe("")
  })

  it("should handle non-string input", () => {
    expect(removeHtmlTags(123 as unknown as string)).toBe("")
    expect(removeHtmlTags([] as unknown as string)).toBe("")
    expect(removeHtmlTags({} as unknown as string)).toBe("")
  })

  it("should handle HTML entities (should remain unchanged)", () => {
    expect(removeHtmlTags("&lt;p&gt;Text&lt;/p&gt;")).toBe(
      "&lt;p&gt;Text&lt;/p&gt;",
    )
    expect(removeHtmlTags("&amp; &quot; &apos;")).toBe("&amp; &quot; &apos;")
  })

  it("should handle complex HTML structures", () => {
    const html = `
      <html>
        <head><title>Test</title></head>
        <body>
          <h1>Title</h1>
          <p>Paragraph with <a href="#">link</a> and <strong>bold</strong> text.</p>
        </body>
      </html>
    `
    const expected = `
      
        Test
        
          Title
          Paragraph with link and bold text.
        
      
    `
    expect(removeHtmlTags(html)).toBe(expected)
  })

  it("should handle very long input (up to limit)", () => {
    const longHtml = `<p>${"a".repeat(99990)}</p>`
    const result = removeHtmlTags(longHtml)
    expect(result.length).toBeLessThanOrEqual(100000)
    expect(result).toMatch(/^a+$/)
  })

  it("should handle script and style tags content", () => {
    expect(removeHtmlTags('<script>alert("test");</script>Text')).toBe(
      'alert("test");Text',
    )
    expect(removeHtmlTags("<style>body { color: red; }</style>Content")).toBe(
      "body { color: red; }Content",
    )
  })
})
