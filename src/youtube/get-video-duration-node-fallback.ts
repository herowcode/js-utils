export async function getYoutubeVideoDuration(
  _videoUrl: string,
): Promise<string | null> {
  throw new Error(
    "@herowcode/utils/youtube: getYoutubeVideoDuration is not supported in Node.js",
  )
}
