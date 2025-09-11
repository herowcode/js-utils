export async function getYoutubeThumbnail(
  videoUrl: string,
): Promise<string | null> {
  const { extractYouTubeId } = await import("./extract-youtube-video-id")
  const videoId = extractYouTubeId(videoUrl)
  if (!videoId) return null

  // Try loading YouTube thumbnail images — avoids CORS problems because
  // creating an Image and listening for load/error is not blocked by CORS.
  const thumbs = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/default.jpg`,
  ]

  const loadImage = (src: string) =>
    new Promise<boolean>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = src
    })

  for (const url of thumbs) {
    try {
      const ok = await loadImage(url)
      if (ok) return url
    } catch {
      // ignore and try next thumbnail
    }
  }

  return null
}
