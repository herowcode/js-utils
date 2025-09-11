export function extractYouTubeId(urlString: string | null): string | null {
  if (!urlString) return null

  try {
    const url = new URL(urlString)

    const hostname = url.hostname.toLowerCase()
    const pathname = url.pathname

    if (hostname.includes("youtu.be")) {
      const id = pathname.replace(/^\/+/, "").split(/[?&#]/)[0]
      return id || null
    }

    if (hostname.includes("youtube.com")) {
      if (url.searchParams.has("v")) {
        return url.searchParams.get("v")
      }

      const parts = pathname.split("/").filter(Boolean)
      const last = parts[parts.length - 1]
      if (last) return last.split(/[?&#]/)[0] || null
    }
  } catch {}

  const regex = /(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([0-9A-Za-z_-]{6,})/i
  const match = urlString.match(regex)
  return match ? match[1] : null
}
