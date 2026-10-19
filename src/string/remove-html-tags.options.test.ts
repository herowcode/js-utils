import { describe, expect, it } from "vitest"
import { removeHtmlTags } from "./remove-html-tags"

describe("removeHtmlTags options", () => {
  it("keeps entities and whitespace by default", () => {
    expect(removeHtmlTags("<p>a &amp;  b</p>\n")).toBe("a &amp;  b\n")
    expect(removeHtmlTags("<p>a &amp;  b</p>\n", {})).toBe("a &amp;  b\n")
  })

  it("decodes entities", () => {
    expect(
      removeHtmlTags(
        "<p>&lt;b&gt; &amp; &quot;x&quot; &#39;y&#39; &#x41;&nbsp;z</p>",
        {
          decodeEntities: true,
        },
      ),
    ).toBe("<b> & \"x\" 'y' A z")
  })

  it("leaves unknown or invalid entities as they are", () => {
    expect(
      removeHtmlTags("&foo; &#99999999; &#x1234567;", {
        decodeEntities: true,
      }),
    ).toBe("&foo; &#99999999; &#x1234567;")
  })

  it("decodes only once", () => {
    expect(removeHtmlTags("&amp;lt;", { decodeEntities: true })).toBe("&lt;")
  })

  it("collapses whitespace", () => {
    expect(
      removeHtmlTags("<p>a</p>\n\n<p>  b </p>", { collapseWhitespace: true }),
    ).toBe("a b")
  })

  it("stays linear on adversarial entity input", () => {
    const input = "&".repeat(100_000)
    const start = performance.now()
    removeHtmlTags(input, { decodeEntities: true, collapseWhitespace: true })
    expect(performance.now() - start).toBeLessThan(50)
  })
})
