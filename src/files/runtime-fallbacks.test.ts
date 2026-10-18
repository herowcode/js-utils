import { describe, expect, it } from "vitest"
import { compressImage } from "./compress-image-node-fallback"
import { downloadUrl } from "./download-url-node-fallback"
import { fileDelete } from "./file-delete-browser-fallback"
import { fileExists } from "./file-exists-browser-fallback"

describe("files runtime fallbacks", () => {
  it("rejects downloadUrl in the node entry", async () => {
    await expect(downloadUrl("https://example.com/file.txt")).rejects.toThrow(
      "@herowcode/utils/files: downloadUrl is not supported in Node.js",
    )
  })

  it("rejects compressImage in the node entry", async () => {
    await expect(
      compressImage({ file: new File(["x"], "a.png", { type: "image/png" }) }),
    ).rejects.toThrow(
      "@herowcode/utils/files: compressImage is not supported in Node.js",
    )
  })

  it("rejects fileExists in the browser entry", async () => {
    await expect(fileExists("/tmp/file.txt")).rejects.toThrow(
      "@herowcode/utils/files: fileExists is not supported in the browser",
    )
  })

  it("rejects fileDelete in the browser entry", async () => {
    await expect(fileDelete("/tmp/file.txt")).rejects.toThrow(
      "@herowcode/utils/files: fileDelete is not supported in the browser",
    )
  })
})
