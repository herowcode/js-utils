import { describe, expect, it } from "vitest"
import { markdownToText } from "./markdown-to-text"

describe("markdownToText options", () => {
  const md = '# Title\n\nSee [docs](https://x.dev/a_b "t") now.\n\nBye'

  it("drops link targets by default", () => {
    expect(markdownToText(md)).toBe("Title\n\nSee docs now.\n\nBye")
    expect(markdownToText(md, {})).toBe("Title\n\nSee docs now.\n\nBye")
  })

  it("keeps link targets", () => {
    expect(markdownToText(md, { keepLinkUrls: true })).toBe(
      "Title\n\nSee docs (https://x.dev/a_b) now.\n\nBye",
    )
  })

  it("joins everything into one line", () => {
    expect(markdownToText(md, { singleLine: true })).toBe(
      "Title See docs now. Bye",
    )
  })
})
