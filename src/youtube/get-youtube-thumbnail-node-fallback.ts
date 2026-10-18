import type { IYouTubeErrorOptions } from "./youtube-error"

export async function getYoutubeThumbnail(
  _videoUrl: string,
  _options?: IYouTubeErrorOptions,
): Promise<string | null> {
  throw new Error(
    "@herowcode/utils/youtube: getYoutubeThumbnail is not supported in Node.js",
  )
}
