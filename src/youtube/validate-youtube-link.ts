import { extractYouTubeId } from "./extract-youtube-video-id"
import { findYoutubeThumbnail } from "./find-youtube-thumbnail"

export async function validateYoutubeLink(videoUrl: string): Promise<boolean> {
  const videoId = extractYouTubeId(videoUrl)
  if (!videoId) return false

  if (await findYoutubeThumbnail(videoId)) return true

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
    return res.ok || res.status === 401
  } catch {
    return false
  }
}
