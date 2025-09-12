import { describe, expect, it } from "vitest"
import { markdownToText } from "./markdown-to-text"

describe("markdownToText", () => {
  it("removes emphasis and links but preserves plain text", () => {
    const input = "**bold** _italic_ and [link](http://example.com)"
    const out = markdownToText(input)
    expect(out).toBe("bold italic and link")
  })

  it("strips headings, blockquotes and list markers preserving line breaks", () => {
    const input = "# Heading\n> quote\n- item1\n1. item2"
    const out = markdownToText(input)
    expect(out).toBe("Heading\nquote\nitem1\nitem2")
  })

  it("keeps code fence inner content and preserves surrounding lines", () => {
    const input = "Text\n```js\nconst a = 1;\n```\nMore"
    const out = markdownToText(input)
    expect(out).toBe("Text\nconst a = 1;\nMore")
  })

  it("removes inline code backticks", () => {
    const input = "Use `x = y` inline"
    const out = markdownToText(input)
    expect(out).toBe("Use x = y inline")
  })

  it("keeps image alt text and removes image markup", () => {
    const input = "Start ![alt text](img.png) end"
    const out = markdownToText(input)
    expect(out).toBe("Start alt text end")
  })

  it("converts reference links and removes reference definitions", () => {
    const input = "See [ref][1]\n\n[1]: http://example.com"
    const out = markdownToText(input)
    expect(out).toBe("See ref")
  })

  it("removes HTML tags and decodes common entities", () => {
    const input = "<b>bold</b> &amp; &lt;test&gt;"
    const out = markdownToText(input)
    expect(out).toBe("bold & <test>")
  })

  it("removes table separator lines and replaces pipes with spaced pipes", () => {
    const input = "| a | b |\n|---|---|\n| 1 | 2 |"
    const out = markdownToText(input)
    // separator removed, pipes replaced by " | ", trimmed
    expect(out).toBe("|  a  |  b  |\n| 1  | 2  |")
  })

  it("removes footnote markers and definitions", () => {
    const input = "Text[^1]\n\n[^1]: note"
    const out = markdownToText(input)
    expect(out).toBe("Text")
  })

  it("collapses excessive blank lines to at most two", () => {
    const input = "a\n\n\n\nb"
    const out = markdownToText(input)
    expect(out).toBe("a\n\nb")
  })
})
