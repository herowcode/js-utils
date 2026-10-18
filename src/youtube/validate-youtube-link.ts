import { extractYouTubeId } from "./extract-youtube-video-id"
import { findYoutubeThumbnail } from "./find-youtube-thumbnail"
import {
  type IYouTubeErrorOptions,
  reportInvalidUrl,
  reportMissingThumbnail,
  reportYouTubeError,
} from "./youtube-error"

export async function validateYoutubeLink(
  videoUrl: string,
  options?: IYouTubeErrorOptions,
): Promise<boolean> {
  const videoId = extractYouTubeId(videoUrl)
  if (!videoId) {
    reportInvalidUrl(options)
    return false
  }

  // Outside the browser there is no Image to probe with, so go straight to oEmbed
  if (typeof Image !== "undefined") {
    if (await findYoutubeThumbnail(videoId)) return true
    reportMissingThumbnail(options)
  }

  // Fallback: oEmbed (may be subject to CORS in some environments)
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      watchUrl,
    )}&format=json`
    const res = await fetch(oembedUrl, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
    })
    // 401 means the video exists but embedding is disabled
    if (res.ok || res.status === 401) return true
    reportYouTubeError(options, {
      source: "oembed",
      message: `HTTP ${res.status}`,
      status: res.status,
    })
    return false
  } catch (error) {
    reportYouTubeError(options, {
      source: "oembed",
      message: String((error as Error)?.message ?? error),
      cause: error,
    })
    return false
  }
}
