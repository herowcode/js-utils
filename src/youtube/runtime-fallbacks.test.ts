import { describe, expect, it } from "vitest"
import { getYoutubeVideoDuration } from "./get-video-duration-node-fallback"
import { getYoutubeThumbnail } from "./get-youtube-thumbnail-node-fallback"

describe("youtube runtime fallbacks", () => {
  it("returns null for getYoutubeThumbnail in node-safe fallback", async () => {
    await expect(
      getYoutubeThumbnail("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).resolves.toBeNull()
  })

  it("returns null for getYoutubeVideoDuration in node-safe fallback", async () => {
    await expect(
      getYoutubeVideoDuration("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).resolves.toBeNull()
  })
})
