import { afterEach, describe, expect, it, vi } from "vitest"

const samplePlayerResponse = {
  videoDetails: {
    videoId: "dQw4w9WgXcQ",
    title: "Sample title",
    author: "Sample channel",
    channelId: "channel-id",
    shortDescription: "Short description",
    lengthSeconds: "213",
    viewCount: "123456",
    keywords: ["never", "gonna", "give", "you", "up"],
    isLiveContent: false,
    thumbnail: {
      thumbnails: [
        {
          url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
          width: 320,
          height: 180,
        },
        {
          url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          width: 480,
          height: 360,
        },
      ],
    },
  },
  microformat: {
    playerMicroformatRenderer: {
      ownerChannelName: "Sample channel",
      ownerProfileUrl: "https://www.youtube.com/@sample",
      externalChannelId: "channel-id",
      publishDate: "2009-10-25",
      uploadDate: "2009-10-24",
      title: { simpleText: "Sample title" },
      description: { simpleText: "Full description" },
      thumbnail: {
        thumbnails: [
          {
            url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            width: 1280,
            height: 720,
          },
        ],
      },
    },
  },
}

const validUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

function buildHtmlFromPlayerResponse(data: unknown): string {
  return `<!DOCTYPE html><html><body><script>var ytInitialPlayerResponse = ${JSON.stringify(data)};</script></body></html>`
}

function createFetchResponse(
  html: string,
  ok = true,
  jsonData?: unknown,
): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    text: () => Promise.resolve(html),
    json: () =>
      Promise.resolve(jsonData ?? (html ? JSON.parse(html) : undefined)),
  } as Response
}

function createJsonFetchResponse(data: unknown, ok = true): Response {
  return createFetchResponse(JSON.stringify(data), ok, data)
}

async function importModule() {
  return import("./get-youtube-video-info")
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("getYoutubeVideoInfo", () => {
  it("returns null when video id cannot be extracted", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const { getYoutubeVideoInfo } = await importModule()

    const info = await getYoutubeVideoInfo("not-a-valid-url")

    expect(info).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("parses metadata from youtube response", async () => {
    const html = buildHtmlFromPlayerResponse(samplePlayerResponse)
    const fetchMock = vi.fn().mockResolvedValue(createFetchResponse(html))
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const info = await getYoutubeVideoInfo(validUrl)

    expect(info).toEqual({
      id: "dQw4w9WgXcQ",
      url: validUrl,
      title: "Sample title",
      channelTitle: "Sample channel",
      channelId: "channel-id",
      channelUrl: "https://www.youtube.com/@sample",
      description: "Full description",
      shortDescription: "Short description",
      thumbnails: [
        {
          url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
          width: 320,
          height: 180,
        },
        {
          url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          width: 480,
          height: 360,
        },
      ],
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      publishedAt: "2009-10-25",
      uploadedAt: "2009-10-24",
      keywords: ["never", "gonna", "give", "you", "up"],
      viewCount: 123456,
      lengthSeconds: 213,
      isLive: false,
    })
  })

  it("caches responses per video id", async () => {
    const html = buildHtmlFromPlayerResponse(samplePlayerResponse)
    const fetchMock = vi.fn().mockResolvedValue(createFetchResponse(html))
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    await getYoutubeVideoInfo("https://youtu.be/dQw4w9WgXcQ")
    await getYoutubeVideoInfo(validUrl)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("clears cache entries when fetching fails", async () => {
    const errorResponse = createFetchResponse("", false)
    const successHtml = buildHtmlFromPlayerResponse(samplePlayerResponse)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse) // watch page
      .mockResolvedValueOnce(errorResponse) // oEmbed
      .mockResolvedValueOnce(errorResponse) // noEmbed
      .mockResolvedValueOnce(createFetchResponse(successHtml))
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const firstAttempt = await getYoutubeVideoInfo(validUrl)
    const secondAttempt = await getYoutubeVideoInfo(validUrl)

    expect(firstAttempt).toBeNull()
    expect(secondAttempt).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it("falls back to YouTube oEmbed endpoint when HTML parsing fails", async () => {
    const oEmbedResponse = {
      title: "oEmbed title",
      author_name: "oEmbed channel",
      author_url: "https://www.youtube.com/@oembed",
      thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      thumbnail_width: 480,
      thumbnail_height: 360,
    }

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createFetchResponse("<html></html>"))
      .mockResolvedValueOnce(createJsonFetchResponse(oEmbedResponse))
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const info = await getYoutubeVideoInfo(validUrl)

    expect(info).toEqual({
      id: "dQw4w9WgXcQ",
      url: validUrl,
      title: "oEmbed title",
      channelTitle: "oEmbed channel",
      channelUrl: "https://www.youtube.com/@oembed",
      thumbnails: [
        {
          url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          width: 480,
          height: 360,
        },
      ],
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      description: undefined,
      shortDescription: undefined,
      publishedAt: undefined,
      uploadedAt: undefined,
      keywords: undefined,
      viewCount: undefined,
      lengthSeconds: undefined,
      isLive: undefined,
    })
  })

  it("falls back to NoEmbed when all YouTube sources fail", async () => {
    const noEmbedResponse = {
      title: "NoEmbed title",
      author_name: "NoEmbed channel",
      author_url: "https://example.com/channel",
      description: "From noembed",
      thumbnail_url: "https://example.com/thumb.jpg",
      upload_date: "2020-01-01",
    }

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createFetchResponse("<html></html>"))
      .mockResolvedValueOnce(createFetchResponse("", false))
      .mockResolvedValueOnce(createJsonFetchResponse(noEmbedResponse))
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const info = await getYoutubeVideoInfo(validUrl)

    expect(info).toEqual({
      id: "dQw4w9WgXcQ",
      url: validUrl,
      title: "NoEmbed title",
      channelTitle: "NoEmbed channel",
      channelUrl: "https://example.com/channel",
      description: "From noembed",
      shortDescription: "From noembed",
      thumbnails: [
        {
          url: "https://example.com/thumb.jpg",
          width: undefined,
          height: undefined,
        },
      ],
      thumbnail: "https://example.com/thumb.jpg",
      publishedAt: "2020-01-01",
      uploadedAt: "2020-01-01",
      keywords: undefined,
      viewCount: undefined,
      lengthSeconds: undefined,
      isLive: undefined,
    })
  })
})
