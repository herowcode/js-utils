import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { extractYouTubeId } from "./extract-youtube-video-id"
import { getYoutubeThumbnail } from "./get-youtube-thumbnail"

const successUrls = new Set<string>()
vi.mock("./extract-youtube-video-id", () => ({
  extractYouTubeId: vi.fn(),
}))

describe("getYoutubeThumbnail", () => {
  const mockExtract = vi.mocked(extractYouTubeId)

  beforeEach(() => {
    successUrls.clear()

    // @ts-expect-error - override global Image for the test runtime
    globalThis.Image = class {
      onload?: () => void
      onerror?: () => void
      private _src = ""
      set src(v: string) {
        this._src = v
        // Call onload if URL is marked successful, otherwise call onerror.
        if (successUrls.has(v)) {
          // call synchronously like the real handler would eventually do
          this.onload?.()
        } else {
          this.onerror?.()
        }
      }
      get src() {
        return this._src
      }
    }
  })

  afterEach(() => {
    // restore mocks
    vi.resetModules()
    // @ts-expect-error
    delete globalThis.Image
  })

  it("returns maxres thumbnail when available", async () => {
    mockExtract.mockReturnValueOnce("abc123")
    successUrls.add("https://img.youtube.com/vi/abc123/maxresdefault.jpg")

    const result = await getYoutubeThumbnail("https://youtu.be/abc123")
    expect(result).toBe("https://img.youtube.com/vi/abc123/maxresdefault.jpg")
  })

  it("falls back to hqdefault when maxres is not available", async () => {
    mockExtract.mockReturnValueOnce("def456")
    successUrls.add("https://img.youtube.com/vi/def456/hqdefault.jpg")

    const result = await getYoutubeThumbnail(
      "https://www.youtube.com/watch?v=def456",
    )
    expect(result).toBe("https://img.youtube.com/vi/def456/hqdefault.jpg")
  })

  it("returns null when no thumbnails load", async () => {
    mockExtract.mockReturnValueOnce("ghi789")
    // no successUrls added -> all will error
    const result = await getYoutubeThumbnail("https://youtu.be/ghi789")
    expect(result).toBeNull()
  })

  it("returns null when video id cannot be extracted", async () => {
    mockExtract.mockReturnValueOnce(null)
    const result = await getYoutubeThumbnail("not-a-video-url")
    expect(result).toBeNull()
  })
})
