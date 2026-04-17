import { afterEach, describe, expect, it, vi } from "vitest"
import { getYoutubeVideoInfo } from "./get-youtube-video-info"

/**
 * Cenários Reais de Teste para getYoutubeVideoInfo
 *
 * Este arquivo contém cenários de teste baseados em casos reais de uso,
 * incluindo vídeos populares, casos extremos e diferentes formatos de resposta.
 *
 * Desde a v1.6 a função consulta 4 fontes em paralelo (InnerTube → watch page
 * → oEmbed → NoEmbed) e mescla os resultados. Os mocks abaixo roteiam as
 * requisições por URL para cobrir cada fonte isoladamente ou em conjunto.
 */

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

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("getYoutubeVideoInfo - Cenários Reais", () => {
  /**
   * Cenário 1: Vídeo Rickroll (dQw4w9WgXcQ) via InnerTube
   */
  it("deve buscar informações do vídeo Rickroll com sucesso", async () => {
    const rickrollResponse = {
      videoDetails: {
        videoId: "dQw4w9WgXcQ",
        title: "Rick Astley - Never Gonna Give You Up (Official Music Video)",
        author: "Rick Astley",
        channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
        shortDescription:
          "The official video for Never Gonna Give You Up by Rick Astley",
        lengthSeconds: "213",
        viewCount: "1500000000",
        keywords: ["rick", "astley", "never", "gonna", "give", "you", "up"],
        isLiveContent: false,
        thumbnail: {
          thumbnails: [
            {
              url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
              width: 120,
              height: 90,
            },
            {
              url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
              width: 1280,
              height: 720,
            },
          ],
        },
      },
      microformat: {
        playerMicroformatRenderer: {
          ownerChannelName: "Rick Astley",
          ownerProfileUrl: "https://www.youtube.com/@RickAstleyYT",
          externalChannelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
          publishDate: "2009-10-25",
          uploadDate: "2009-10-24",
          title: {
            simpleText:
              "Rick Astley - Never Gonna Give You Up (Official Music Video)",
          },
          description: {
            simpleText:
              "The official video for Never Gonna Give You Up by Rick Astley",
          },
        },
      },
    }

    const fetchMock = makeFetchMock({
      innertube: () => jsonResponse(rickrollResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    )

    expect(info).toBeTruthy()
    expect(info?.id).toBe("dQw4w9WgXcQ")
    expect(info?.title).toContain("Never Gonna Give You Up")
    expect(info?.channelTitle).toBe("Rick Astley")
    expect(info?.viewCount).toBe(1500000000)
    expect(info?.lengthSeconds).toBe(213)
    expect(info?.isLive).toBe(false)
    expect(info?.thumbnail).toContain("maxresdefault.jpg")
  })

  /**
   * Cenário 2: Live Stream Ativa
   */
  it("deve identificar corretamente uma transmissão ao vivo", async () => {
    const liveStreamResponse = {
      videoDetails: {
        videoId: "jfKfPfyJRdk",
        title: "lofi hip hop radio 📚 - beats to relax/study to",
        author: "Lofi Girl",
        isLiveContent: true,
        thumbnail: {
          thumbnails: [
            {
              url: "https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault_live.jpg",
              width: 1280,
              height: 720,
            },
          ],
        },
      },
      microformat: {
        playerMicroformatRenderer: {
          ownerChannelName: "Lofi Girl",
          liveBroadcastDetails: { isLiveNow: true },
        },
      },
    }

    const fetchMock = makeFetchMock({
      innertube: () => jsonResponse(liveStreamResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo("https://youtu.be/jfKfPfyJRdk")

    expect(info?.isLive).toBe(true)
    expect(info?.title).toContain("lofi hip hop radio")
    expect(info?.thumbnail).toContain("maxresdefault_live.jpg")
  })

  /**
   * Cenário 3: YouTube Shorts
   */
  it("deve processar corretamente um YouTube Shorts", async () => {
    const shortsResponse = {
      videoDetails: {
        videoId: "abc123xyz",
        title: "Amazing Short Video #shorts",
        author: "Content Creator",
        lengthSeconds: "45",
        isLiveContent: false,
      },
    }

    const fetchMock = makeFetchMock({
      innertube: () => jsonResponse(shortsResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/shorts/abc123xyz",
    )

    expect(info?.lengthSeconds).toBeLessThan(60)
    expect(info?.title).toContain("#shorts")
  })

  /**
   * Cenário 4: Título em formato runs
   */
  it("deve processar títulos em formato runs corretamente", async () => {
    const complexTitleResponse = {
      videoDetails: {
        videoId: "test456",
        author: "Channel Name",
      },
      microformat: {
        playerMicroformatRenderer: {
          ownerChannelName: "Channel Name",
          title: {
            runs: [
              { text: "Video with " },
              { text: "Complex " },
              { text: "Title" },
            ],
          },
          description: {
            runs: [
              { text: "This is a " },
              { text: "multi-part " },
              { text: "description" },
            ],
          },
        },
      },
    }

    const fetchMock = makeFetchMock({
      innertube: () => jsonResponse(complexTitleResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=test456",
    )

    expect(info?.title).toBe("Video with Complex Title")
    expect(info?.description).toBe("This is a multi-part description")
  })

  /**
   * Cenário 5: Thumbnails do microformat quando videoDetails não tem
   */
  it("deve usar thumbnails do microformat quando videoDetails não tem", async () => {
    const noVideoDetailsThumbnailResponse = {
      videoDetails: {
        videoId: "test789",
        title: "Video without thumbnail in details",
        author: "Test Channel",
      },
      microformat: {
        playerMicroformatRenderer: {
          ownerChannelName: "Test Channel",
          thumbnail: {
            thumbnails: [
              {
                url: "https://i.ytimg.com/vi/test789/sddefault.jpg",
                width: 640,
                height: 480,
              },
              {
                url: "https://i.ytimg.com/vi/test789/maxresdefault.jpg",
                width: 1280,
                height: 720,
              },
            ],
          },
        },
      },
    }

    const fetchMock = makeFetchMock({
      innertube: () => jsonResponse(noVideoDetailsThumbnailResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=test789",
    )

    expect(info?.thumbnails.length).toBeGreaterThanOrEqual(2)
    expect(info?.thumbnail).toContain("maxresdefault.jpg")
  })

  /**
   * Cenário 6: Cache
   */
  it("deve usar cache para requisições repetidas do mesmo vídeo", async () => {
    const cacheTestResponse = {
      videoDetails: {
        videoId: "cache123",
        title: "Cached Video",
        author: "Cache Channel",
        lengthSeconds: "180",
      },
    }

    const fetchMock = makeFetchMock({
      innertube: () => jsonResponse(cacheTestResponse),
    })
    vi.stubGlobal("fetch", fetchMock)

    const info1 = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=cache123",
    )
    const callsAfterFirst = fetchMock.mock.calls.length

    const info2 = await getYoutubeVideoInfo("https://youtu.be/cache123")
    const info3 = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=cache123&t=10s",
    )

    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst)
    expect(info1?.id).toBe("cache123")
    expect(info2?.id).toBe("cache123")
    expect(info3?.id).toBe("cache123")
  })

  /**
   * Cenário 7: Watch page quando InnerTube falha
   */
  it("deve usar watch page HTML quando InnerTube falha", async () => {
    const playerResponse = {
      videoDetails: {
        videoId: "htmlonly",
        title: "HTML only video",
        author: "HTML Channel",
        lengthSeconds: "100",
      },
    }
    const html = `<!DOCTYPE html><html><body><script>var ytInitialPlayerResponse = ${JSON.stringify(playerResponse)};</script></body></html>`

    const fetchMock = makeFetchMock({
      watch: () => htmlResponse(html),
    })
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=htmlonly",
    )

    expect(info?.title).toBe("HTML only video")
    expect(info?.lengthSeconds).toBe(100)
  })

  /**
   * Cenário 8: Merge de fontes complementares
   */
  it("deve mesclar dados complementares de múltiplas fontes", async () => {
    const innertubePartial = {
      videoDetails: {
        videoId: "merge123",
        title: "Main title",
        author: "Main channel",
        lengthSeconds: "500",
      },
    }
    const noEmbedData = {
      title: "NoEmbed title",
      author_name: "NoEmbed channel",
      description: "Rich description from NoEmbed",
      thumbnail_url: "https://example.com/thumb.jpg",
      upload_date: "2024-11-17",
    }

    const fetchMock = makeFetchMock({
      innertube: () => jsonResponse(innertubePartial),
      noembed: () => jsonResponse(noEmbedData),
    })
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=merge123",
    )

    // Primary fields come from innertube
    expect(info?.title).toBe("Main title")
    expect(info?.channelTitle).toBe("Main channel")
    expect(info?.lengthSeconds).toBe(500)
    // Missing fields complemented by NoEmbed
    expect(info?.description).toBe("Rich description from NoEmbed")
    expect(info?.publishedAt).toBe("2024-11-17")
    expect(info?.thumbnails.some((t) => t.url.includes("example.com"))).toBe(
      true,
    )
  })

  /**
   * Cenário 9: oEmbed sozinho
   */
  it("deve usar oEmbed quando nenhuma outra fonte retorna dados", async () => {
    const oEmbedData = {
      title: "Video from oEmbed",
      author_name: "oEmbed Channel",
      author_url: "https://www.youtube.com/@oembedchannel",
      thumbnail_url: "https://i.ytimg.com/vi/oembed123/hqdefault.jpg",
      thumbnail_width: 480,
      thumbnail_height: 360,
    }

    const fetchMock = makeFetchMock({
      oembed: () => jsonResponse(oEmbedData),
    })
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=oembed123",
    )

    expect(info?.title).toBe("Video from oEmbed")
    expect(info?.channelTitle).toBe("oEmbed Channel")
    expect(info?.channelUrl).toBe("https://www.youtube.com/@oembedchannel")
    expect(info?.thumbnail).toBe(
      "https://i.ytimg.com/vi/oembed123/hqdefault.jpg",
    )
  })

  /**
   * Cenário 10: NoEmbed sozinho
   */
  it("deve usar NoEmbed quando nenhuma outra fonte retorna dados", async () => {
    const noEmbedData = {
      title: "Video from NoEmbed",
      author_name: "NoEmbed Channel",
      author_url: "https://example.com/channel",
      description: "Full description from NoEmbed",
      thumbnail_url: "https://example.com/thumb.jpg",
      upload_date: "2024-11-17",
    }

    const fetchMock = makeFetchMock({
      noembed: () => jsonResponse(noEmbedData),
    })
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=noembed456",
    )

    expect(info?.title).toBe("Video from NoEmbed")
    expect(info?.channelTitle).toBe("NoEmbed Channel")
    expect(info?.description).toBe("Full description from NoEmbed")
    expect(info?.publishedAt).toBe("2024-11-17")
  })

  /**
   * Cenário 11: Vídeo indisponível
   */
  it("deve retornar null para vídeo indisponível", async () => {
    const fetchMock = makeFetchMock({})
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=unavailable123",
    )

    expect(info).toBeNull()
  })

  /**
   * Cenário 12: URL Inválida
   */
  it("deve retornar null para URL inválida", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://example.com/not-a-youtube-url",
    )

    expect(info).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
