const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i
const YOUTUBE_HOSTS = ["youtube.com", "youtube-nocookie.com"]
const SHORT_HOST = "youtu.be"
const VIDEO_PATH_PREFIXES = ["embed", "shorts", "live", "v", "e"]

const isHost = (hostname: string, host: string) =>
  hostname === host || hostname.endsWith(`.${host}`)

const validId = (id: string | null | undefined) =>
  id && VIDEO_ID.test(id) ? id : null

export function extractYouTubeId(urlString: string | null): string | null {
  if (!urlString) return null

  let url: URL
  try {
    url = new URL(SCHEME.test(urlString) ? urlString : `https://${urlString}`)
  } catch {
    return null
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null

  const hostname = url.hostname.toLowerCase()
  const parts = url.pathname.split("/").filter(Boolean)

  if (isHost(hostname, SHORT_HOST)) return validId(parts[0])

  if (YOUTUBE_HOSTS.some((host) => isHost(hostname, host))) {
    if (url.searchParams.has("v")) return validId(url.searchParams.get("v"))
    return parts.length === 2 && VIDEO_PATH_PREFIXES.includes(parts[0])
      ? validId(parts[1])
      : null
  }

  return null
}
