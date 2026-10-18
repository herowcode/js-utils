/** biome-ignore-all lint/suspicious/noExplicitAny: Mocked values can be any */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest"

vi.mock("./extract-youtube-video-id", () => ({
  extractYouTubeId: vi.fn(),
}))

import { extractYouTubeId } from "./extract-youtube-video-id"
import { validateYoutubeLink } from "./validate-youtube-link"

describe("validateYoutubeLink", () => {
  const mockExtract = vi.mocked(extractYouTubeId)
  let _originalFetch: any
  let successMap: Record<string, boolean>
  let naturalWidth: number | undefined

  beforeEach(() => {
    // reset mocks
    vi.clearAllMocks()
    successMap = {}
    naturalWidth = undefined

    // stub global Image to control onload/onerror behavior
    class MockImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      _src = ""
      get naturalWidth() {
        return naturalWidth
      }
      set src(val: string) {
        this._src = val
        // simulate async load/error
        queueMicrotask(() => {
          if (successMap[val]) {
            this.onload?.()
          } else {
            this.onerror?.()
          }
        })
      }
      get src() {
        return this._src
      }
    }
    vi.stubGlobal("Image", MockImage)

    // stub fetch
    _originalFetch = globalThis.fetch
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    // restore fetch
    vi.unstubAllGlobals()
  })

  it("returns false for non-YouTube / invalid id", async () => {
    mockExtract.mockReturnValueOnce(null)
    const res = await validateYoutubeLink("not-a-youtube-url")
    expect(res).toBe(false)
    expect(mockExtract).toHaveBeenCalledOnce()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it("returns true when a thumbnail loads successfully (first attempt)", async () => {
    mockExtract.mockReturnValueOnce("vid123")
    const thumbs = [
      "https://img.youtube.com/vi/vid123/maxresdefault.jpg",
      "https://img.youtube.com/vi/vid123/hqdefault.jpg",
    ]
    successMap[thumbs[0]] = true

    const res = await validateYoutubeLink("https://youtu.be/vid123")
    expect(res).toBe(true)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it("tries subsequent thumbnails until one succeeds", async () => {
    mockExtract.mockReturnValueOnce("vid456")
    const thumbs = [
      "https://img.youtube.com/vi/vid456/maxresdefault.jpg",
      "https://img.youtube.com/vi/vid456/hqdefault.jpg",
    ]
    successMap[thumbs[0]] = false
    successMap[thumbs[1]] = true

    const res = await validateYoutubeLink("https://youtu.be/vid456")
    expect(res).toBe(true)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it("falls back to oEmbed and returns true when fetch.ok is true", async () => {
    mockExtract.mockReturnValueOnce("vid789")
    // all thumbs fail
    successMap["https://img.youtube.com/vi/vid789/maxresdefault.jpg"] = false
    successMap["https://img.youtube.com/vi/vid789/hqdefault.jpg"] = false
    ;(globalThis.fetch as unknown as Mock).mockResolvedValue({
      ok: true,
    } as any)

    const res = await validateYoutubeLink(
      "https://www.youtube.com/watch?v=vid789",
    )
    expect(res).toBe(true)
    expect(globalThis.fetch).toHaveBeenCalledOnce()
  })

  it("returns false when thumbnails fail and oEmbed returns non-ok", async () => {
    mockExtract.mockReturnValueOnce("vid000")
    // thumbs fail
    successMap["https://img.youtube.com/vi/vid000/maxresdefault.jpg"] = false
    ;(globalThis.fetch as unknown as Mock).mockResolvedValue({
      ok: false,
    } as any)

    const res = await validateYoutubeLink("https://youtu.be/vid000")
    expect(res).toBe(false)
    expect(globalThis.fetch).toHaveBeenCalledOnce()
  })

  it("returns false when fetch throws", async () => {
    mockExtract.mockReturnValueOnce("viderr")
    // thumbs fail
    successMap["https://img.youtube.com/vi/viderr/maxresdefault.jpg"] = false
    ;(globalThis.fetch as unknown as Mock).mockRejectedValue(
      new Error("network"),
    )

    const res = await validateYoutubeLink("https://youtu.be/viderr")
    expect(res).toBe(false)
    expect(globalThis.fetch).toHaveBeenCalledOnce()
  })

  it("ignores the 120px placeholder thumbnail and falls back to oEmbed", async () => {
    mockExtract.mockReturnValueOnce("vidmissing")
    successMap["https://img.youtube.com/vi/vidmissing/maxresdefault.jpg"] = true
    successMap["https://img.youtube.com/vi/vidmissing/hqdefault.jpg"] = true
    successMap["https://img.youtube.com/vi/vidmissing/mqdefault.jpg"] = true
    naturalWidth = 120
    ;(globalThis.fetch as unknown as Mock).mockResolvedValue({
      ok: false,
      status: 404,
    } as any)

    const res = await validateYoutubeLink("https://youtu.be/vidmissing")
    expect(res).toBe(false)
    expect(globalThis.fetch).toHaveBeenCalledOnce()
  })

  it("treats oEmbed 401 (embedding disabled) as a valid video", async () => {
    mockExtract.mockReturnValueOnce("vid401")
    ;(globalThis.fetch as unknown as Mock).mockResolvedValue({
      ok: false,
      status: 401,
    } as any)

    expect(await validateYoutubeLink("https://youtu.be/vid401")).toBe(true)
  })

  it("treats oEmbed 404 as an invalid video", async () => {
    mockExtract.mockReturnValueOnce("vid404")
    ;(globalThis.fetch as unknown as Mock).mockResolvedValue({
      ok: false,
      status: 404,
    } as any)

    expect(await validateYoutubeLink("https://youtu.be/vid404")).toBe(false)
  })

  describe("onError", () => {
    it("reports an invalid URL as a validation error", async () => {
      mockExtract.mockReturnValueOnce(null)
      const onError = vi.fn()

      await validateYoutubeLink("not-a-youtube-url", { onError })

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ source: "validation" }),
      )
    })

    it("reports the missing thumbnail and the oEmbed status", async () => {
      mockExtract.mockReturnValueOnce("vid404")
      ;(globalThis.fetch as unknown as Mock).mockResolvedValue({
        ok: false,
        status: 404,
      } as any)
      const onError = vi.fn()

      await validateYoutubeLink("https://youtu.be/vid404", { onError })

      expect(onError.mock.calls.map(([e]) => e.source)).toEqual([
        "thumbnail",
        "oembed",
      ])
      expect(onError).toHaveBeenLastCalledWith(
        expect.objectContaining({ source: "oembed", status: 404 }),
      )
    })

    it("reports an oEmbed network error with the original error as cause", async () => {
      mockExtract.mockReturnValueOnce("viderr")
      const networkError = new Error("network")
      ;(globalThis.fetch as unknown as Mock).mockRejectedValue(networkError)
      const onError = vi.fn()

      await validateYoutubeLink("https://youtu.be/viderr", { onError })

      expect(onError).toHaveBeenLastCalledWith(
        expect.objectContaining({
          source: "oembed",
          message: "network",
          cause: networkError,
        }),
      )
    })

    it("stays silent when a thumbnail proves the video exists", async () => {
      mockExtract.mockReturnValueOnce("vidok")
      successMap["https://img.youtube.com/vi/vidok/maxresdefault.jpg"] = true
      const onError = vi.fn()

      expect(
        await validateYoutubeLink("https://youtu.be/vidok", { onError }),
      ).toBe(true)
      expect(onError).not.toHaveBeenCalled()
    })
  })
})
