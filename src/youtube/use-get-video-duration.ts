/** biome-ignore-all lint/suspicious/noExplicitAny: Window is any */
import { useCallback } from "react"
import { formatSecondsToHMS } from "../string"
import { extractYouTubeId } from "./extract-youtube-video-id"

let YtApiLoading: Promise<void> | null = null

function loadYouTubeIFrameAPI(): Promise<void> {
  if ((window as any).YT?.Player) return Promise.resolve()
  if (YtApiLoading) return YtApiLoading

  YtApiLoading = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    )
    if (existing) {
      // Poll until the API is ready
      const poll = setInterval(() => {
        if ((window as any).YT?.Player) {
          clearInterval(poll)
          resolve()
        }
      }, 50)
      return
    }

    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    tag.async = true
    document.body.appendChild(tag)

    ;(window as any).onYouTubeIframeAPIReady = () => {
      resolve()
    }
  })

  return YtApiLoading
}

/**
 * useGetYoutubeVideoDuration
 * Returns a function that accepts a YouTube URL (full or short) and returns a Promise
 * resolving to the video duration formatted as "HH:MM:SS" or null on failure.
 */
export function useGetYoutubeVideoDuration() {
  const getYoutubeVideoDuration = useCallback(
    async (videoUrl: string): Promise<string | null> => {
      const videoId = extractYouTubeId(videoUrl)
      if (!videoId) return null

      try {
        await loadYouTubeIFrameAPI()
      } catch {
        return null
      }

      return await new Promise<string | null>((resolve) => {
        const iframeId = `yt-duration-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const iframe = document.createElement("iframe")
        // create a minimal offscreen iframe for the player
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
          resolve(result)
        }

        // timeout fallback
        cleanupTimeout = window.setTimeout(() => {
          cleanupAndResolve(null)
        }, 10000) // 10s timeout

        document.body.appendChild(iframe)

        // Construct player
        try {
          player = new (window as any).YT.Player(iframeId, {
            events: {
              onReady: (e: any) => {
                try {
                  let duration = e.target.getDuration()
                  if (!duration || duration === 0) {
                    // Sometimes duration is 0 immediately; try a few short retries
                    let attempts = 0
                    const tryInterval = setInterval(() => {
                      attempts += 1
                      try {
                        duration = e.target.getDuration()
                        if (duration && duration > 0) {
                          clearInterval(tryInterval)
                          cleanupAndResolve(formatSecondsToHMS(duration))
                        } else if (attempts >= 8) {
                          clearInterval(tryInterval)
                          cleanupAndResolve(null)
                        }
                      } catch {
                        if (attempts >= 8) {
                          clearInterval(tryInterval)
                          cleanupAndResolve(null)
                        }
                      }
                    }, 300)
                  } else {
                    cleanupAndResolve(formatSecondsToHMS(duration))
                  }
                } catch {
                  cleanupAndResolve(null)
                }
              },
              onError: () => {
                cleanupAndResolve(null)
              },
            },
          })
        } catch {
          cleanupAndResolve(null)
        }
      })
    },
    [],
  )

  return getYoutubeVideoDuration
}
