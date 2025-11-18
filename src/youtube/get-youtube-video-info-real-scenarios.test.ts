import { afterEach, describe, expect, it, vi } from "vitest"
import { getYoutubeVideoInfo } from "./get-youtube-video-info"

/**
 * Cenários Reais de Teste para getYoutubeVideoInfo
 *
 * Este arquivo contém cenários de teste baseados em casos reais de uso,
 * incluindo vídeos populares, casos extremos e diferentes formatos de resposta.
 */

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("getYoutubeVideoInfo - Cenários Reais", () => {
  /**
   * Cenário 1: Vídeo Rickroll (dQw4w9WgXcQ)
   * Um dos vídeos mais populares e referenciados do YouTube
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
              url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
              width: 320,
              height: 180,
            },
            {
              url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
              width: 480,
              height: 360,
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

    const html = `<!DOCTYPE html><html><body><script>var ytInitialPlayerResponse = ${JSON.stringify(rickrollResponse)};</script></body></html>`
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    } as Response)
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
   * Teste com transmissão ao vivo
   */
  it("deve identificar corretamente uma transmissão ao vivo", async () => {
    const liveStreamResponse = {
      videoDetails: {
        videoId: "jfKfPfyJRdk",
        title: "lofi hip hop radio 📚 - beats to relax/study to",
        author: "Lofi Girl",
        channelId: "UCSJ4gkVC6NrvII8umztf0Ow",
        shortDescription: "24/7 lofi hip hop radio",
        lengthSeconds: "0",
        viewCount: "125000",
        keywords: ["lofi", "hip hop", "chill", "beats"],
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
          ownerProfileUrl: "https://www.youtube.com/@LofiGirl",
          externalChannelId: "UCSJ4gkVC6NrvII8umztf0Ow",
          publishDate: "2020-02-22",
          uploadDate: "2020-02-22",
          title: {
            simpleText: "lofi hip hop radio 📚 - beats to relax/study to",
          },
          description: { simpleText: "24/7 lofi hip hop radio" },
          liveBroadcastDetails: {
            isLiveNow: true,
          },
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
      },
    }

    const html = `<!DOCTYPE html><html><body><script>var ytInitialPlayerResponse = ${JSON.stringify(liveStreamResponse)};</script></body></html>`
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    } as Response)
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo("https://youtu.be/jfKfPfyJRdk")

    expect(info?.isLive).toBe(true)
    expect(info?.title).toContain("lofi hip hop radio")
    expect(info?.thumbnail).toContain("maxresdefault_live.jpg")
  })

  /**
   * Cenário 3: Vídeo Curto (YouTube Shorts)
   * Teste com vídeo em formato Shorts
   */
  it("deve processar corretamente um YouTube Shorts", async () => {
    const shortsResponse = {
      videoDetails: {
        videoId: "abc123xyz",
        title: "Amazing Short Video #shorts",
        author: "Content Creator",
        channelId: "UCtest123",
        shortDescription: "A short video",
        lengthSeconds: "45",
        viewCount: "5000000",
        keywords: ["shorts", "viral"],
        isLiveContent: false,
        thumbnail: {
          thumbnails: [
            {
              url: "https://i.ytimg.com/vi/abc123xyz/maxresdefault.jpg",
              width: 1080,
              height: 1920,
            },
          ],
        },
      },
      microformat: {
        playerMicroformatRenderer: {
          ownerChannelName: "Content Creator",
          ownerProfileUrl: "https://www.youtube.com/@contentcreator",
          externalChannelId: "UCtest123",
          publishDate: "2023-05-15",
          uploadDate: "2023-05-15",
          title: { simpleText: "Amazing Short Video #shorts" },
          description: { simpleText: "A short video" },
          thumbnail: {
            thumbnails: [
              {
                url: "https://i.ytimg.com/vi/abc123xyz/maxresdefault.jpg",
                width: 1080,
                height: 1920,
              },
            ],
          },
        },
      },
    }

    const html = `<!DOCTYPE html><html><body><script>var ytInitialPlayerResponse = ${JSON.stringify(shortsResponse)};</script></body></html>`
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    } as Response)
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/shorts/abc123xyz",
    )

    expect(info?.lengthSeconds).toBeLessThan(60)
    expect(info?.title).toContain("#shorts")
  })

  /**
   * Cenário 4: Vídeo com Título Multi-linha (runs format)
   * Teste quando o título vem em formato de "runs" ao invés de "simpleText"
   */
  it("deve processar títulos em formato runs corretamente", async () => {
    const complexTitleResponse = {
      videoDetails: {
        videoId: "test456",
        title: "Video with Complex Title",
        author: "Channel Name",
        channelId: "UCtest456",
        shortDescription: "Test description",
        lengthSeconds: "600",
        viewCount: "1000",
        isLiveContent: false,
      },
      microformat: {
        playerMicroformatRenderer: {
          ownerChannelName: "Channel Name",
          ownerProfileUrl: "https://www.youtube.com/@channelname",
          externalChannelId: "UCtest456",
          publishDate: "2024-01-01",
          uploadDate: "2024-01-01",
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
          thumbnail: {
            thumbnails: [
              {
                url: "https://i.ytimg.com/vi/test456/hqdefault.jpg",
                width: 480,
                height: 360,
              },
            ],
          },
        },
      },
    }

    const html = `<!DOCTYPE html><html><body><script>var ytInitialPlayerResponse = ${JSON.stringify(complexTitleResponse)};</script></body></html>`
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    } as Response)
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=test456",
    )

    expect(info?.title).toBe("Video with Complex Title")
    expect(info?.description).toBe("This is a multi-part description")
  })

  /**
   * Cenário 5: Vídeo sem thumbnails em videoDetails
   * Teste fallback para microformat thumbnails
   */
  it("deve usar thumbnails do microformat quando videoDetails não tem", async () => {
    const noVideoDetailsThumbnailResponse = {
      videoDetails: {
        videoId: "test789",
        title: "Video without thumbnail in details",
        author: "Test Channel",
        channelId: "UCtest789",
        shortDescription: "Test",
        lengthSeconds: "300",
        viewCount: "500",
        isLiveContent: false,
      },
      microformat: {
        playerMicroformatRenderer: {
          ownerChannelName: "Test Channel",
          ownerProfileUrl: "https://www.youtube.com/@testchannel",
          externalChannelId: "UCtest789",
          publishDate: "2024-11-17",
          uploadDate: "2024-11-17",
          title: { simpleText: "Video without thumbnail in details" },
          description: { simpleText: "Test" },
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

    const html = `<!DOCTYPE html><html><body><script>var ytInitialPlayerResponse = ${JSON.stringify(noVideoDetailsThumbnailResponse)};</script></body></html>`
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    } as Response)
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=test789",
    )

    expect(info?.thumbnails).toHaveLength(2)
    expect(info?.thumbnail).toContain("maxresdefault.jpg")
    expect(info?.thumbnails[1]?.width).toBe(1280)
  })

  /**
   * Cenário 6: Teste de Cache
   * Verifica que múltiplas chamadas para o mesmo vídeo usam cache
   */
  it("deve usar cache para requisições repetidas do mesmo vídeo", async () => {
    const cacheTestResponse = {
      videoDetails: {
        videoId: "cache123",
        title: "Cached Video",
        author: "Cache Channel",
        channelId: "UCcache123",
        shortDescription: "Cache test",
        lengthSeconds: "180",
        viewCount: "1000",
        isLiveContent: false,
        thumbnail: {
          thumbnails: [
            {
              url: "https://i.ytimg.com/vi/cache123/hqdefault.jpg",
              width: 480,
              height: 360,
            },
          ],
        },
      },
    }

    const html = `<!DOCTYPE html><html><body><script>var ytInitialPlayerResponse = ${JSON.stringify(cacheTestResponse)};</script></body></html>`
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    } as Response)
    vi.stubGlobal("fetch", fetchMock)

    // Primeira chamada
    const info1 = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=cache123",
    )

    // Segunda chamada - deve usar cache
    const info2 = await getYoutubeVideoInfo("https://youtu.be/cache123")

    // Terceira chamada com formato diferente - deve usar cache
    const info3 = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=cache123&t=10s",
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(info1?.id).toBe("cache123")
    expect(info2?.id).toBe("cache123")
    expect(info3?.id).toBe("cache123")
  })

  /**
   * Cenário 7: Fallback para oEmbed
   * Teste quando HTML parsing falha mas oEmbed funciona
   */
  it("deve usar oEmbed quando HTML parsing falha", async () => {
    const oEmbedData = {
      title: "Video from oEmbed",
      author_name: "oEmbed Channel",
      author_url: "https://www.youtube.com/@oembedchannel",
      thumbnail_url: "https://i.ytimg.com/vi/oembed123/hqdefault.jpg",
      thumbnail_width: 480,
      thumbnail_height: 360,
    }

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve("<html><body>No player response here</body></html>"),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(oEmbedData),
      } as Response)
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=oembed123",
    )

    expect(info?.title).toBe("Video from oEmbed")
    expect(info?.channelTitle).toBe("oEmbed Channel")
    expect(info?.channelUrl).toBe("https://www.youtube.com/@oembedchannel")
    expect(info?.thumbnails).toHaveLength(1)
    expect(info?.thumbnail).toBe(
      "https://i.ytimg.com/vi/oembed123/hqdefault.jpg",
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  /**
   * Cenário 8: Fallback para NoEmbed
   * Teste quando tanto HTML quanto oEmbed falham
   */
  it("deve usar NoEmbed como último fallback", async () => {
    const noEmbedData = {
      title: "Video from NoEmbed",
      author_name: "NoEmbed Channel",
      author_url: "https://example.com/channel",
      description: "Full description from NoEmbed",
      thumbnail_url: "https://example.com/thumb.jpg",
      upload_date: "2024-11-17",
    }

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("<html>Invalid</html>"),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(noEmbedData),
      } as Response)
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=noembed456",
    )

    expect(info?.title).toBe("Video from NoEmbed")
    expect(info?.channelTitle).toBe("NoEmbed Channel")
    expect(info?.description).toBe("Full description from NoEmbed")
    expect(info?.shortDescription).toBe("Full description from NoEmbed")
    expect(info?.publishedAt).toBe("2024-11-17")
    expect(info?.uploadedAt).toBe("2024-11-17")
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  /**
   * Cenário 9: Vídeo Indisponível/Privado
   * Teste quando todos os métodos falham
   */
  it("deve retornar null para vídeo indisponível", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)
    vi.stubGlobal("fetch", fetchMock)

    const info = await getYoutubeVideoInfo(
      "https://www.youtube.com/watch?v=unavailable123",
    )

    expect(info).toBeNull()
  })

  /**
   * Cenário 10: URL Inválida
   * Teste com URL que não contém ID de vídeo válido
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
