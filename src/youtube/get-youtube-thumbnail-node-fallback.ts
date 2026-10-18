export async function getYoutubeThumbnail(
  _videoUrl: string,
): Promise<string | null> {
  throw new Error(
    "@herowcode/utils/youtube: getYoutubeThumbnail is not supported in Node.js",
  )
}
