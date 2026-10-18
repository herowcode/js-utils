import type { IYouTubeErrorOptions } from "./youtube-error"

export async function getYoutubeVideoDuration(
  _videoUrl: string,
  _options?: IYouTubeErrorOptions,
): Promise<string | null> {
  throw new Error(
    "@herowcode/utils/youtube: getYoutubeVideoDuration is not supported in Node.js",
  )
}
