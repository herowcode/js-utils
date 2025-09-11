export async function validateYoutubeLink(videoUrl: string): Promise<boolean> {
  const { extractYouTubeId } = await import("./extract-youtube-video-id")
  const videoId = extractYouTubeId(videoUrl)
  if (!videoId) return false

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
      if (ok) return true
    } catch {
      // ignore and try next thumbnail
    }
  }

  // Fallback: try oEmbed endpoint (may be subject to CORS in some environments)
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      watchUrl,
    )}&format=json`
    const res = await fetch(oembedUrl, { method: "GET" })
    return res.ok
  } catch {
    return false
  }
}
