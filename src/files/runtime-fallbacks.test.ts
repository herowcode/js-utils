import { describe, expect, it } from "vitest"
import { downloadUrl } from "./download-url-node-fallback"
import { fileDelete } from "./file-delete-browser-fallback"
import { fileExists } from "./file-exists-browser-fallback"

describe("files runtime fallbacks", () => {
  it("returns false for downloadUrl in node-safe fallback", async () => {
    await expect(downloadUrl("https://example.com/file.txt")).resolves.toBe(
      false,
    )
  })

  it("returns false for fileExists in browser-safe fallback", async () => {
    await expect(fileExists("/tmp/file.txt")).resolves.toBe(false)
  })

  it("returns undefined for fileDelete in browser-safe fallback", async () => {
    await expect(fileDelete("/tmp/file.txt")).resolves.toBeUndefined()
  })
})
