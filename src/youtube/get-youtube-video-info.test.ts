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

type TRouteHandlers = {
  innertube?: (body: unknown) => Response | null
  watch?: () => Response | null
  oembed?: () => Response | null
  noembed?: () => Response | null
}

function notFound(): Response {
  return {
    ok: false,
    status: 404,
    text: () => Promise.resolve(""),
    json: () => Promise.resolve({}),
  } as Response
}

function htmlResponse(html: string, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    text: () => Promise.resolve(html),
    json: () => Promise.resolve({}),
  } as Response
}

function jsonResponse(data: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    text: () => Promise.resolve(JSON.stringify(data)),
    json: () => Promise.resolve(data),
  } as Response
}

function makeFetchMock(routes: TRouteHandlers) {
  return vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.includes("/youtubei/v1/player")) {
        const body = init?.body ? JSON.parse(String(init.body)) : {}
        return routes.innertube?.(body) ?? notFound()
      }
      if (url.includes("youtube.com/oembed")) {
        return routes.oembed?.() ?? notFound()
      }
      if (url.includes("noembed.com")) {
        return routes.noembed?.() ?? notFound()
      }
      if (url.includes("/watch")) {
        return routes.watch?.() ?? notFound()
      }
      return notFound()
    },
  )
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

  it("parses metadata from innertube response", async () => {
    const fetchMock = makeFetchMock({
      innertube: () => jsonResponse(samplePlayerResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const info = await getYoutubeVideoInfo(validUrl)

    expect(info).toMatchObject({
      id: "dQw4w9WgXcQ",
      url: validUrl,
      title: "Sample title",
      channelTitle: "Sample channel",
      channelId: "channel-id",
      channelUrl: "https://www.youtube.com/@sample",
      description: "Full description",
      shortDescription: "Short description",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      publishedAt: "2009-10-25",
      uploadedAt: "2009-10-24",
      keywords: ["never", "gonna", "give", "you", "up"],
      viewCount: 123456,
      lengthSeconds: 213,
      isLive: false,
    })
    expect(info?.thumbnails.length).toBeGreaterThanOrEqual(2)
  })

  it("parses metadata from watch page when innertube fails", async () => {
    const html = buildHtmlFromPlayerResponse(samplePlayerResponse)
    const fetchMock = makeFetchMock({
      watch: () => htmlResponse(html),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const info = await getYoutubeVideoInfo(validUrl)

    expect(info).toMatchObject({
      id: "dQw4w9WgXcQ",
      title: "Sample title",
      lengthSeconds: 213,
      description: "Full description",
    })
  })

  it("merges partial data from multiple sources", async () => {
    const innertubePartial = {
      videoDetails: {
        videoId: "dQw4w9WgXcQ",
        title: "Innertube title",
        author: "Innertube channel",
        lengthSeconds: "213",
      },
    }
    const oEmbedResponse = {
      title: "oEmbed title",
      author_name: "oEmbed channel",
      author_url: "https://www.youtube.com/@oembed",
      thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      thumbnail_width: 480,
      thumbnail_height: 360,
    }
    const noEmbedResponse = {
      title: "NoEmbed title",
      author_name: "NoEmbed channel",
      description: "NoEmbed description",
      thumbnail_url: "https://example.com/extra-thumb.jpg",
      upload_date: "2009-10-25",
    }

    const fetchMock = makeFetchMock({
      innertube: () => jsonResponse(innertubePartial),
      oembed: () => jsonResponse(oEmbedResponse),
      noembed: () => jsonResponse(noEmbedResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const info = await getYoutubeVideoInfo(validUrl)

    // Innertube wins for fields it provides
    expect(info?.title).toBe("Innertube title")
    expect(info?.channelTitle).toBe("Innertube channel")
    expect(info?.lengthSeconds).toBe(213)
    // oEmbed fills channelUrl (innertube lacked it)
    expect(info?.channelUrl).toBe("https://www.youtube.com/@oembed")
    // noEmbed fills description + publishedAt
    expect(info?.description).toBe("NoEmbed description")
    expect(info?.publishedAt).toBe("2009-10-25")
    // thumbnails merged from oEmbed + noEmbed (deduped)
    const urls = info?.thumbnails.map((t) => t.url) ?? []
    expect(urls).toContain("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg")
    expect(urls).toContain("https://example.com/extra-thumb.jpg")
  })

  it("tries innertube WEB client when ANDROID fails", async () => {
    let androidCalled = false
    const fetchMock = makeFetchMock({
      innertube: (body) => {
        const clientName = (
          body as { context?: { client?: { clientName?: string } } }
        )?.context?.client?.clientName
        if (clientName === "ANDROID") {
          androidCalled = true
          return notFound()
        }
        if (clientName === "WEB") {
          return jsonResponse(samplePlayerResponse)
        }
        return notFound()
      },
    })
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const info = await getYoutubeVideoInfo(validUrl)

    expect(androidCalled).toBe(true)
    expect(info?.lengthSeconds).toBe(213)
  })

  it("caches responses per video id", async () => {
    const fetchMock = makeFetchMock({
      innertube: () => jsonResponse(samplePlayerResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    await getYoutubeVideoInfo("https://youtu.be/dQw4w9WgXcQ")
    const callsAfterFirst = fetchMock.mock.calls.length

    await getYoutubeVideoInfo(validUrl)

    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst)
  })

  it("passes an abort signal to every fetch", async () => {
    const fetchMock = makeFetchMock({
      innertube: () => jsonResponse(samplePlayerResponse),
      watch: () =>
        htmlResponse(buildHtmlFromPlayerResponse(samplePlayerResponse)),
      oembed: () => jsonResponse({ title: "t", author_name: "a" }),
      noembed: () => jsonResponse({ title: "t", author_name: "a" }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    await getYoutubeVideoInfo(validUrl)

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(4)
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.signal).toBeInstanceOf(AbortSignal)
    }
  })

  it("returns a copy so callers cannot mutate the cached value", async () => {
    const fetchMock = makeFetchMock({
      innertube: () => jsonResponse(structuredClone(samplePlayerResponse)),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const first = await getYoutubeVideoInfo(validUrl)
    const expectedTitle = first?.title
    const expectedThumbs = first?.thumbnails.length
    const expectedKeywords = first?.keywords?.length
    if (!first) throw new Error("expected info")
    first.title = "mutated"
    first.thumbnails.push({ url: "https://evil.example/x.jpg" })
    first.thumbnails[0].url = "https://evil.example/y.jpg"
    first.keywords?.push("mutated")

    const second = await getYoutubeVideoInfo(validUrl)

    expect(second?.title).toBe(expectedTitle)
    expect(second?.thumbnails.length).toBe(expectedThumbs)
    expect(second?.thumbnails[0].url).not.toContain("evil.example")
    expect(second?.keywords?.length).toBe(expectedKeywords)
  })

  it("clears cache entries when fetching fails", async () => {
    let shouldSucceed = false
    const fetchMock = makeFetchMock({
      innertube: () =>
        shouldSucceed ? jsonResponse(samplePlayerResponse) : notFound(),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const firstAttempt = await getYoutubeVideoInfo(validUrl)
    shouldSucceed = true
    const secondAttempt = await getYoutubeVideoInfo(validUrl)

    expect(firstAttempt).toBeNull()
    expect(secondAttempt).not.toBeNull()
  })

  it("returns oEmbed-only data when all other sources fail", async () => {
    const oEmbedResponse = {
      title: "oEmbed title",
      author_name: "oEmbed channel",
      author_url: "https://www.youtube.com/@oembed",
      thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      thumbnail_width: 480,
      thumbnail_height: 360,
    }
    const fetchMock = makeFetchMock({
      oembed: () => jsonResponse(oEmbedResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const info = await getYoutubeVideoInfo(validUrl)

    expect(info).toMatchObject({
      id: "dQw4w9WgXcQ",
      title: "oEmbed title",
      channelTitle: "oEmbed channel",
      channelUrl: "https://www.youtube.com/@oembed",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    })
    expect(info?.description).toBeUndefined()
    expect(info?.lengthSeconds).toBeUndefined()
  })

  it("returns noEmbed-only data when all other sources fail", async () => {
    const noEmbedResponse = {
      title: "NoEmbed title",
      author_name: "NoEmbed channel",
      author_url: "https://example.com/channel",
      description: "From noembed",
      thumbnail_url: "https://example.com/thumb.jpg",
      upload_date: "2020-01-01",
    }
    const fetchMock = makeFetchMock({
      noembed: () => jsonResponse(noEmbedResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const info = await getYoutubeVideoInfo(validUrl)

    expect(info).toMatchObject({
      title: "NoEmbed title",
      channelTitle: "NoEmbed channel",
      description: "From noembed",
      shortDescription: "From noembed",
      publishedAt: "2020-01-01",
      uploadedAt: "2020-01-01",
    })
  })

  it("returns null when all sources fail", async () => {
    const fetchMock = makeFetchMock({})
    vi.stubGlobal("fetch", fetchMock)

    const { getYoutubeVideoInfo } = await importModule()
    const info = await getYoutubeVideoInfo(validUrl)

    expect(info).toBeNull()
  })
})

describe("getYoutubeVideoInfo cache limits", () => {
  const oneHourMs = 60 * 60 * 1000

  function countingFetch() {
    const calls = new Map<string, number>()
    const fetchMock = makeFetchMock({
      innertube: (body) => {
        const id = (body as { videoId: string }).videoId
        calls.set(id, (calls.get(id) ?? 0) + 1)
        return jsonResponse(samplePlayerResponse)
      },
    })
    vi.stubGlobal("fetch", fetchMock)
    return calls
  }

  const urlFor = (n: number) =>
    `https://youtu.be/vid${String(n).padStart(8, "0")}`
  const idFor = (n: number) => `vid${String(n).padStart(8, "0")}`

  afterEach(() => {
    vi.useRealTimers()
  })

  it("refetches once a cached entry is older than an hour", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    const calls = countingFetch()
    const { getYoutubeVideoInfo } = await importModule()

    await getYoutubeVideoInfo(validUrl)
    vi.advanceTimersByTime(oneHourMs - 1)
    await getYoutubeVideoInfo(validUrl)
    expect(calls.get("dQw4w9WgXcQ")).toBe(1)

    vi.advanceTimersByTime(1)
    await getYoutubeVideoInfo(validUrl)
    expect(calls.get("dQw4w9WgXcQ")).toBe(2)
  })

  it("keeps at most 100 videos, evicting the least recently used", async () => {
    const calls = countingFetch()
    const { getYoutubeVideoInfo } = await importModule()

    for (let n = 0; n < 100; n++) await getYoutubeVideoInfo(urlFor(n))
    await getYoutubeVideoInfo(urlFor(0)) // touch: 1 becomes the oldest
    await getYoutubeVideoInfo(urlFor(100))

    await getYoutubeVideoInfo(urlFor(0))
    await getYoutubeVideoInfo(urlFor(1))

    expect(calls.get(idFor(0))).toBe(1)
    expect(calls.get(idFor(1))).toBe(2)
  })
})

describe("getYoutubeVideoInfo onError", () => {
  it("reports why each source failed", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({
        innertube: () => notFound(),
        watch: () => htmlResponse("<html>no player data</html>"),
        oembed: () => jsonResponse({}, false),
        noembed: () => jsonResponse({ error: "no title" }),
      }),
    )
    const onError = vi.fn()
    const { getYoutubeVideoInfo } = await importModule()

    const info = await getYoutubeVideoInfo(validUrl, { onError })

    expect(info).toBeNull()
    const bySource = Object.fromEntries(
      onError.mock.calls.map(([error]) => [error.source, error]),
    )
    expect(Object.keys(bySource).sort()).toEqual([
      "innertube",
      "noembed",
      "oembed",
      "watch-page",
    ])
    expect(bySource.innertube).toMatchObject({ status: 404 })
    expect(bySource.innertube.message).toMatch(/ANDROID.*404.*WEB.*404/)
    expect(bySource["watch-page"].message).toMatch(/ytInitialPlayerResponse/)
    expect(bySource.oembed).toMatchObject({ status: 500 })
    expect(bySource.noembed.message).toMatch(/title/)
  })

  it("reports network errors with the original error as cause", async () => {
    const networkError = new TypeError("Failed to fetch")
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes("noembed.com")) throw networkError
        return jsonResponse(samplePlayerResponse)
      }),
    )
    const onError = vi.fn()
    const { getYoutubeVideoInfo } = await importModule()

    const info = await getYoutubeVideoInfo(validUrl, { onError })

    expect(info?.title).toBe("Sample title")
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "noembed",
        message: "Failed to fetch",
        cause: networkError,
      }),
    )
  })

  it("ignores errors thrown by the callback", async () => {
    vi.stubGlobal("fetch", makeFetchMock({}))
    const { getYoutubeVideoInfo } = await importModule()

    const info = await getYoutubeVideoInfo(validUrl, {
      onError: () => {
        throw new Error("callback bug")
      },
    })

    expect(info).toBeNull()
  })
})
