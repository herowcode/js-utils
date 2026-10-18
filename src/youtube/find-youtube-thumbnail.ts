// default.jpg is skipped: it is 120px wide, indistinguishable from the missing-thumbnail placeholder
const QUALITIES = ["maxresdefault", "hqdefault", "mqdefault"]
const PLACEHOLDER_MAX_WIDTH = 120
const PROBE_TIMEOUT_MS = 5000

// Image load/error is not subject to CORS, unlike fetch. YouTube answers a
// missing thumbnail with a 120x90 placeholder JPEG, so a successful load alone proves nothing.
function probeImage(src: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const img = new Image()
    const timer = setTimeout(() => resolve(false), PROBE_TIMEOUT_MS)
    const done = (ok: boolean) => {
      clearTimeout(timer)
      resolve(ok)
    }
    img.onload = () => done(!(img.naturalWidth <= PLACEHOLDER_MAX_WIDTH))
    img.onerror = () => done(false)
    img.src = src
  })
}

export async function findYoutubeThumbnail(
  videoId: string,
): Promise<string | null> {
  for (const quality of QUALITIES) {
    const url = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
    try {
      if (await probeImage(url)) return url
    } catch {
      // Image is unavailable outside the browser; try the next candidate
    }
  }

  return null
}
