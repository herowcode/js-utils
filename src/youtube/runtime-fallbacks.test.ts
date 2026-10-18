import { describe, expect, it } from "vitest"
import { getYoutubeVideoDuration } from "./get-video-duration-node-fallback"
import { getYoutubeThumbnail } from "./get-youtube-thumbnail-node-fallback"

describe("youtube runtime fallbacks", () => {
  it("rejects getYoutubeThumbnail in the node entry", async () => {
    await expect(
      getYoutubeThumbnail("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).rejects.toThrow(
      "@herowcode/utils/youtube: getYoutubeThumbnail is not supported in Node.js",
    )
  })

  it("rejects getYoutubeVideoDuration in the node entry", async () => {
    await expect(
      getYoutubeVideoDuration("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).rejects.toThrow(
      "@herowcode/utils/youtube: getYoutubeVideoDuration is not supported in Node.js",
    )
  })
})
