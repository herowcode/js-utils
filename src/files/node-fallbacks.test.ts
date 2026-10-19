import { describe, expect, it } from "vitest"
import { copyToClipboard } from "./copy-to-clipboard-node-fallback"
import { downloadBlob } from "./download-blob-node-fallback"

describe("files node fallbacks", () => {
  it("rejects copyToClipboard in the node entry", async () => {
    await expect(copyToClipboard("x")).rejects.toThrow(
      "@herowcode/utils/files: copyToClipboard is not supported in Node.js",
    )
  })

  it("throws downloadBlob in the node entry", () => {
    expect(() => downloadBlob(new Blob(["x"]), "x.txt")).toThrow(
      "@herowcode/utils/files: downloadBlob is not supported in Node.js",
    )
  })
})
