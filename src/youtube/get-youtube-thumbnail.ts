import { extractYouTubeId } from "./extract-youtube-video-id"
import { findYoutubeThumbnail } from "./find-youtube-thumbnail"
import {
  type IYouTubeErrorOptions,
  reportInvalidUrl,
  reportMissingThumbnail,
} from "./youtube-error"

export async function getYoutubeThumbnail(
  videoUrl: string,
  options?: IYouTubeErrorOptions,
): Promise<string | null> {
  const videoId = extractYouTubeId(videoUrl)
  if (!videoId) {
    reportInvalidUrl(options)
    return null
  }

  const thumbnail = await findYoutubeThumbnail(videoId)
  if (!thumbnail) reportMissingThumbnail(options)
  return thumbnail
}
