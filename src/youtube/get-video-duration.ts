/** biome-ignore-all lint/suspicious/noExplicitAny: Window is any */
import { formatSecondsToHMS } from "../string"
import { extractYouTubeId } from "./extract-youtube-video-id"
import { validateYoutubeLink } from "./validate-youtube-link"
import {
  type IYouTubeErrorOptions,
  reportInvalidUrl,
  reportYouTubeError,
} from "./youtube-error"

const API_SRC = "https://www.youtube.com/iframe_api"
const API_LOAD_TIMEOUT_MS = 10000

let YtApiLoading: Promise<void> | null = null

function loadYouTubeIFrameAPI(): Promise<void> {
  if ((window as any).YT?.Player) return Promise.resolve()
  if (YtApiLoading) return YtApiLoading

  YtApiLoading = new Promise<void>((resolve, reject) => {
    const previousReady = (window as any).onYouTubeIframeAPIReady
    let poll: ReturnType<typeof setInterval> | undefined
    const existing = document.querySelector(`script[src="${API_SRC}"]`)
    const tag = existing ? undefined : document.createElement("script")

    const timer = setTimeout(
      () => fail(new Error("YouTube IFrame API load timed out")),
      API_LOAD_TIMEOUT_MS,
    )

    function settle() {
      clearTimeout(timer)
      if (poll) clearInterval(poll)
    }

    function fail(error: Error) {
      settle()
      // Drop our own tag so the next attempt injects a fresh one instead of waiting on a dead script
      tag?.remove()
      ;(window as any).onYouTubeIframeAPIReady = previousReady
      YtApiLoading = null
      reject(error)
    }

    if (!tag) {
      poll = setInterval(() => {
        if ((window as any).YT?.Player) {
          settle()
          resolve()
        }
      }, 50)
      return
    }

    tag.src = API_SRC
    tag.async = true
    tag.onerror = () => fail(new Error("Failed to load the YouTube IFrame API"))

    ;(window as any).onYouTubeIframeAPIReady = () => {
      previousReady?.()
      settle()
      resolve()
    }
    document.body.appendChild(tag)
  })

  return YtApiLoading
}

/** Resolves to the duration ("MM:SS", or "HH:MM:SS" past an hour), or null when the video or the IFrame API fails. */
export async function getYoutubeVideoDuration(
  videoUrl: string,
  options?: IYouTubeErrorOptions,
): Promise<string | null> {
  const videoId = extractYouTubeId(videoUrl)
  if (!videoId) {
    reportInvalidUrl(options)
    return null
  }

  const videoIsValid = await validateYoutubeLink(videoUrl)
  if (!videoIsValid) {
    reportYouTubeError(options, {
      source: "validation",
      message: "video not found or unreachable",
    })
    return null
  }

  try {
    await loadYouTubeIFrameAPI()
  } catch (error) {
    reportYouTubeError(options, {
      source: "iframe-api",
      message: (error as Error).message,
      cause: error,
    })
    return null
  }

  return await new Promise<string | null>((resolve) => {
    const iframeId = `yt-duration-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const iframe = document.createElement("iframe")
    iframe.id = iframeId
    iframe.style.position = "fixed"
    iframe.style.left = "-9999px"
    iframe.style.width = "1px"
    iframe.style.height = "1px"
    iframe.style.opacity = "0"
    iframe.style.pointerEvents = "none"

    // embed URL with enablejsapi so we can construct YT.Player
    const origin = window.location.origin
    iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?enablejsapi=1&origin=${encodeURIComponent(origin)}`

    let resolved = false
    let player: any = null
    let cleanupTimeout: number | null = null
    let retryInterval: ReturnType<typeof setInterval> | undefined

    function failAndResolve(
      message: string,
      extra?: { status?: number; cause?: unknown },
    ) {
      if (!resolved) {
        reportYouTubeError(options, { source: "player", message, ...extra })
      }
      cleanupAndResolve(null)
    }

    function cleanupAndResolve(result: string | null) {
      if (resolved) return
      resolved = true
      try {
        if (player && typeof player.destroy === "function") player.destroy()
      } catch {
        /* ignore */
      }
      try {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
      } catch {
        /* ignore */
      }
      if (cleanupTimeout) window.clearTimeout(cleanupTimeout)
      if (retryInterval) clearInterval(retryInterval)
      resolve(result)
    }

    cleanupTimeout = window.setTimeout(() => {
      failAndResolve("player timed out after 10s")
    }, 10000)

    document.body.appendChild(iframe)

    try {
      player = new (window as any).YT.Player(iframeId, {
        events: {
          onReady: (e: any) => {
            try {
              let duration = e.target.getDuration()
              if (!duration || duration === 0) {
                // Sometimes duration is 0 immediately; try a few short retries
                let attempts = 0
                retryInterval = setInterval(() => {
                  attempts += 1
                  try {
                    duration = e.target.getDuration()
                    if (duration && duration > 0) {
                      clearInterval(retryInterval)
                      cleanupAndResolve(formatSecondsToHMS(duration))
                    } else if (attempts >= 8) {
                      clearInterval(retryInterval)
                      failAndResolve("player reported no duration")
                    }
                  } catch (error) {
                    if (attempts >= 8) {
                      clearInterval(retryInterval)
                      failAndResolve("getDuration failed", { cause: error })
                    }
                  }
                }, 300)
              } else {
                cleanupAndResolve(formatSecondsToHMS(duration))
              }
            } catch (error) {
              failAndResolve("getDuration failed", { cause: error })
            }
          },
          onError: (e: any) => {
            const code = typeof e?.data === "number" ? e.data : undefined
            failAndResolve(`player error ${code ?? "unknown"}`, {
              status: code,
            })
          },
        },
      })
    } catch (error) {
      failAndResolve("could not create the player", { cause: error })
    }
  })
}
