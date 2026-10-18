import { extractYouTubeId } from "./extract-youtube-video-id"
import { findYoutubeThumbnail } from "./find-youtube-thumbnail"

export async function getYoutubeThumbnail(
  videoUrl: string,
): Promise<string | null> {
  const videoId = extractYouTubeId(videoUrl)
  if (!videoId) return null

  return findYoutubeThumbnail(videoId)
}
