import { formatHMSToSeconds, formatSecondsToFragment } from "../string"
import { extractYouTubeId } from "./extract-youtube-video-id"

type TCreateYoutubeLinkOptions = {
  videoURL: string
  // start / end can be seconds (number) or strings like "90", "01:30", "1:02:03"
  start?: number | string
  end?: number | string
  // choose output form
  embed?: boolean
  short?: boolean // youtu.be
  useFragment?: boolean // use #t=1m2s style fragment for timestamps
  // common embed/watch params
  autoplay?: boolean
  controls?: 0 | 1
  rel?: 0 | 1
  loop?: boolean
  mute?: boolean
  modestbranding?: 0 | 1
  origin?: string
  playlist?: string
  // allow arbitrary extra params (string/number/boolean)
  params?: Record<string, string | number | boolean>
}

export const generateYoutubeURL = (
  opts: TCreateYoutubeLinkOptions,
): string | null => {
  const {
    videoURL,
    start,
    end,
    embed = false,
    short = false,
    useFragment = false,
    autoplay,
    controls,
    rel,
    loop,
    mute,
    modestbranding,
    origin,
    playlist,
    params = {},
  } = opts

  const videoId = extractYouTubeId(videoURL)
  if (!videoId) return null

  const startSec = formatHMSToSeconds(start)
  const endSec = formatHMSToSeconds(end)

  // base url
  const base = embed
    ? `https://www.youtube.com/embed/${videoId}`
    : short
      ? `https://youtu.be/${videoId}`
      : "https://www.youtube.com/watch"

  const search = new URLSearchParams()

  // Add video ID for watch URLs
  if (!embed && !short) {
    search.set("v", videoId)
  }

  // Standard param names for watch/embed
  if (!useFragment) {
    if (startSec != null) {
      // youtu.be historically uses "t" as a query param, but "start" is widely supported.
      // Use "t" for short links, otherwise "start".
      search.set(short ? "t" : "start", String(startSec))
    }
    if (endSec != null) {
      search.set("end", String(endSec))
    }
  }

  // embed / player related params
  if (typeof autoplay !== "undefined")
    search.set("autoplay", autoplay ? "1" : "0")
  if (typeof controls !== "undefined") search.set("controls", String(controls))
  if (typeof rel !== "undefined") search.set("rel", String(rel))
  if (typeof modestbranding !== "undefined")
    search.set("modestbranding", String(modestbranding))
  if (typeof origin !== "undefined") search.set("origin", origin)
  if (typeof mute !== "undefined") search.set("mute", mute ? "1" : "0")

  // loop requires playlist param when embedding a single video
  if (loop) {
    search.set("loop", "1")
    if (playlist) {
      search.set("playlist", playlist)
    } else if (embed) {
      // for embed+loop, YouTube expects &playlist=VIDEO_ID
      search.set("playlist", videoId)
    }
  } else if (playlist) {
    search.set("playlist", playlist)
  }

  // merge custom params (allow overriding)
  Object.entries(params).forEach(([k, v]) => {
    if (v === false) search.set(k, "0")
    else if (v === true) search.set(k, "1")
    else search.set(k, String(v))
  })

  const qs = search.toString() ? `?${search.toString()}` : ""

  // fragment handling (e.g. #t=1m2s)
  let fragment = ""
  if (useFragment && startSec != null) {
    fragment = `#t=${formatSecondsToFragment(startSec)}`
  }

  // For short links, people often prefer the short host and start as query or fragment.
  if (short) {
    // prefer fragment if requested, otherwise use search params (t)
    return `${base}${qs}${fragment}`
  }

  // watch/embed links
  return `${base}${qs}${fragment}`
}
