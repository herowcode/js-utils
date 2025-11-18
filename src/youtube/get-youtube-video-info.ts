type TYtThumbnail = {
  url: string
  width?: number
  height?: number
}

type TYtTextField = {
  simpleText?: string
  runs?: { text?: string }[]
}

type TYtPlayerResponse = {
  videoDetails?: {
    videoId?: string
    title?: string
    author?: string
    channelId?: string
    shortDescription?: string
    lengthSeconds?: string
    viewCount?: string
    keywords?: string[]
    isLiveContent?: boolean
    thumbnail?: { thumbnails?: TYtThumbnail[] }
  }
  microformat?: {
    playerMicroformatRenderer?: {
      title?: TYtTextField
      description?: TYtTextField
      ownerChannelName?: string
      ownerProfileUrl?: string
      externalChannelId?: string
      publishDate?: string
      uploadDate?: string
      thumbnail?: { thumbnails?: TYtThumbnail[] }
      liveBroadcastDetails?: {
        isLiveNow?: boolean
      }
    }
  }
}

type TYtPlayerMicroformat = TYtPlayerResponse["microformat"] extends infer M
  ? M extends { playerMicroformatRenderer?: infer R }
    ? R
    : never
  : never

type TYtOEmbedResponse = {
  title?: string
} & Partial<Record<"author_name" | "author_url" | "thumbnail_url", string>> &
  Partial<Record<"thumbnail_width" | "thumbnail_height", number>>

type TNoEmbedResponse = TYtOEmbedResponse & {
  description?: string
} & Partial<Record<"upload_date", string>>

export type TYouTubeVideoInfo = {
  id: string
  url: string
  title: string
  channelTitle: string
  channelId?: string
  channelUrl?: string
  description?: string
  shortDescription?: string
  thumbnails: TYtThumbnail[]
  thumbnail?: string
  publishedAt?: string
  uploadedAt?: string
  keywords?: string[]
  viewCount?: number
  lengthSeconds?: number
  isLive?: boolean
}

const videoInfoCache = new Map<string, Promise<TYouTubeVideoInfo | null>>()

export async function getYoutubeVideoInfo(
  videoUrl: string,
): Promise<TYouTubeVideoInfo | null> {
  const { extractYouTubeId } = await import("./extract-youtube-video-id")
  const videoId = extractYouTubeId(videoUrl)
  if (!videoId) return null

  const cached = videoInfoCache.get(videoId)
  if (cached) return cached

  const fetchPromise = fetchYoutubeVideoInfo(videoId)
  videoInfoCache.set(videoId, fetchPromise)

  const info = await fetchPromise
  if (!info) {
    videoInfoCache.delete(videoId)
  }

  return info
}

async function fetchYoutubeVideoInfo(
  videoId: string,
): Promise<TYouTubeVideoInfo | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`

  const htmlInfo = await fetchFromWatchPage(videoId, watchUrl)
  if (htmlInfo) return htmlInfo

  const oEmbedInfo = await fetchFromOEmbed(videoId, watchUrl)
  if (oEmbedInfo) return oEmbedInfo

  const noEmbedInfo = await fetchFromNoEmbed(videoId, watchUrl)
  if (noEmbedInfo) return noEmbedInfo

  return null
}

async function fetchFromWatchPage(
  videoId: string,
  watchUrl: string,
): Promise<TYouTubeVideoInfo | null> {
  try {
    const response = await fetch(watchUrl)
    if (!response.ok) {
      return null
    }

    const html = await response.text()
    const rawJson = extractJsonBlock(html, "ytInitialPlayerResponse")
    if (!rawJson) {
      return null
    }

    const data = JSON.parse(rawJson) as TYtPlayerResponse
    const details = data.videoDetails
    const microformat = data.microformat?.playerMicroformatRenderer

    if (!details && !microformat) {
      return null
    }

    const thumbnails = getThumbnails(details, microformat)
    const bestThumbnail = selectBestThumbnail(thumbnails)

    return {
      id: details?.videoId ?? videoId,
      url: watchUrl,
      title: details?.title ?? extractText(microformat?.title) ?? "",
      channelTitle: details?.author ?? microformat?.ownerChannelName ?? "",
      channelId: details?.channelId ?? microformat?.externalChannelId,
      channelUrl: microformat?.ownerProfileUrl,
      description:
        extractText(microformat?.description) ?? details?.shortDescription,
      shortDescription: details?.shortDescription,
      thumbnails,
      thumbnail: bestThumbnail?.url,
      publishedAt: microformat?.publishDate ?? microformat?.uploadDate,
      uploadedAt: microformat?.uploadDate,
      keywords: details?.keywords,
      viewCount: parseNumber(details?.viewCount),
      lengthSeconds: parseNumber(details?.lengthSeconds),
      isLive:
        details?.isLiveContent ?? microformat?.liveBroadcastDetails?.isLiveNow,
    }
  } catch {
    return null
  }
}

async function fetchFromOEmbed(
  videoId: string,
  watchUrl: string,
): Promise<TYouTubeVideoInfo | null> {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      watchUrl,
    )}&format=json`
    const response = await fetch(oEmbedUrl)
    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as TYtOEmbedResponse
    if (!data?.title || !data?.author_name) {
      return null
    }

    const thumbnails = createThumbnailList(
      data.thumbnail_url,
      data.thumbnail_width,
      data.thumbnail_height,
    )

    return {
      id: videoId,
      url: watchUrl,
      title: data.title,
      channelTitle: data.author_name,
      channelUrl: data.author_url,
      thumbnails,
      thumbnail: thumbnails[0]?.url,
      description: undefined,
      shortDescription: undefined,
      publishedAt: undefined,
      uploadedAt: undefined,
      keywords: undefined,
      viewCount: undefined,
      lengthSeconds: undefined,
      isLive: undefined,
    }
  } catch {
    return null
  }
}

async function fetchFromNoEmbed(
  videoId: string,
  watchUrl: string,
): Promise<TYouTubeVideoInfo | null> {
  try {
    const noEmbedUrl = `https://noembed.com/embed?url=${encodeURIComponent(
      watchUrl,
    )}`
    const response = await fetch(noEmbedUrl)
    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as TNoEmbedResponse
    if (!data?.title || !data?.author_name) {
      return null
    }

    const thumbnails = createThumbnailList(
      data.thumbnail_url,
      data.thumbnail_width,
      data.thumbnail_height,
    )

    return {
      id: videoId,
      url: watchUrl,
      title: data.title,
      channelTitle: data.author_name,
      channelUrl: data.author_url,
      description: data.description,
      shortDescription: data.description,
      thumbnails,
      thumbnail: thumbnails[0]?.url,
      publishedAt: data.upload_date,
      uploadedAt: data.upload_date,
      keywords: undefined,
      viewCount: undefined,
      lengthSeconds: undefined,
      isLive: undefined,
    }
  } catch {
    return null
  }
}

function extractJsonBlock(html: string, marker: string): string | null {
  const markerIndex = html.indexOf(marker)
  if (markerIndex === -1) return null

  const jsonStart = html.indexOf("{", markerIndex)
  if (jsonStart === -1) return null

  let depth = 0
  for (let i = jsonStart; i < html.length; i++) {
    const char = html[i]
    if (char === "{") {
      depth += 1
    } else if (char === "}") {
      depth -= 1
    }

    if (depth === 0) {
      return html.slice(jsonStart, i + 1)
    }
  }

  return null
}

function getThumbnails(
  details: TYtPlayerResponse["videoDetails"] | undefined,
  microformat: TYtPlayerMicroformat | undefined,
): TYtThumbnail[] {
  if (details?.thumbnail?.thumbnails?.length) {
    return details.thumbnail.thumbnails
  }

  return microformat?.thumbnail?.thumbnails ?? []
}

function selectBestThumbnail(
  thumbnails: TYtThumbnail[],
): TYtThumbnail | undefined {
  if (!thumbnails.length) return undefined

  return thumbnails.reduce((best, current) => {
    if (!best) return current
    if (!best.width) return current
    if (!current.width) return best
    return current.width > best.width ? current : best
  })
}

function extractText(field?: TYtTextField): string | undefined {
  if (!field) return undefined
  if (field.simpleText) return field.simpleText
  if (field.runs?.length) {
    return field.runs.map((run) => run.text ?? "").join("")
  }

  return undefined
}

function parseNumber(value?: string): number | undefined {
  if (value === undefined) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

function createThumbnailList(
  url?: string,
  width?: number,
  height?: number,
): TYtThumbnail[] {
  if (!url) return []
  return [{ url, width, height }]
}
