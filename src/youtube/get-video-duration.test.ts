/** biome-ignore-all lint/suspicious/noExplicitAny: Mocked data can be any */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest"
import { getYoutubeVideoDuration } from "./get-video-duration"

vi.mock("./validate-youtube-link", () => ({
  validateYoutubeLink: vi.fn(),
}))

import { validateYoutubeLink } from "./validate-youtube-link"

async function waitForCondition(
  assertion: () => undefined | boolean,
  { timeout = 2000, interval = 10 } = {},
): Promise<void> {
  const start = Date.now()

  return new Promise((resolve, reject) => {
    const check = () => {
      try {
        const result = assertion()
        if (result === undefined || result === true) {
          resolve()
          return
        }
      } catch (error) {
        if (Date.now() - start >= timeout) {
          reject(error)
          return
        }
      }

      if (Date.now() - start >= timeout) {
        reject(new Error("waitForCondition timed out"))
        return
      }

      setTimeout(check, interval)
    }

    check()
  })
}

describe("getYoutubeVideoDuration", () => {
  let mockYTPlayer: any
  let mockYTAPI: any
  let originalYT: any

  beforeEach(() => {
    // Ensure validateYoutubeLink defaults to success unless overridden in a test
    ;(validateYoutubeLink as unknown as Mock).mockResolvedValue(true)

    // Clear any existing scripts
    const existingScripts = document.querySelectorAll(
      'script[src*="youtube.com/iframe_api"]',
    )
    existingScripts.forEach((script) => {
      script.remove()
    })

    // Clear any existing iframes
    const existingIframes = document.querySelectorAll(
      'iframe[id^="yt-duration-"]',
    )
    existingIframes.forEach((iframe) => {
      iframe.remove()
    })

    // Store original YT if it exists
    originalYT = (window as any).YT

    // Mock YT Player
    mockYTPlayer = {
      getDuration: vi.fn(() => 195), // 3:15 duration
      destroy: vi.fn(),
    }

    // Mock YT API
    mockYTAPI = {
      Player: vi.fn().mockImplementation((_elementId: string, config: any) => {
        // Simulate async ready event
        setTimeout(() => {
          if (config.events?.onReady) {
            config.events.onReady({ target: mockYTPlayer })
          }
        }, 50)
        return mockYTPlayer
      }),
    }

    // Set up the global YT object
    ;(window as any).YT = mockYTAPI
    ;(window as any).onYouTubeIframeAPIReady = undefined

    // Mock window.location.origin
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
      },
      writable: true,
    })

    // Clear all timers to prevent interference
    vi.clearAllTimers()
  })

  afterEach(() => {
    // Restore original YT
    ;(window as any).YT = originalYT

    // Clear timers
    vi.clearAllTimers()

    // Clean up DOM
    const iframes = document.querySelectorAll('iframe[id^="yt-duration-"]')
    iframes.forEach((iframe) => {
      iframe.remove()
    })

    // Clean up scripts
    const scripts = document.querySelectorAll(
      'script[src*="youtube.com/iframe_api"]',
    )
    scripts.forEach((script) => {
      script.remove()
    })

    // reset validateYoutubeLink mock
    vi.clearAllMocks()
  })

  it("should return a function when called", () => {
    expect(typeof getYoutubeVideoDuration).toBe("function")
  })

  it("should return formatted duration for valid YouTube URL", async () => {
    const duration = await getYoutubeVideoDuration(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    )

    expect(duration).toBe("03:15")
  })

  it("should return null for invalid YouTube URL", async () => {
    const duration = await getYoutubeVideoDuration("https://invalid-url.com")

    expect(duration).toBe(null)
  })

  it("should return null when validateYoutubeLink returns false", async () => {
    // ensure validator returns false for this call
    ;(validateYoutubeLink as unknown as Mock).mockResolvedValueOnce(false)

    const duration = await getYoutubeVideoDuration(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    )

    expect(duration).toBe(null)
    expect(validateYoutubeLink as unknown as Mock).toHaveBeenCalled()
  })

  it("should handle YouTube API loading", async () => {
    // Remove YT from window to simulate API not loaded
    delete (window as any).YT

    // Start the function call
    const promise = getYoutubeVideoDuration(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    )

    // Simulate API loading
    setTimeout(() => {
      ;(window as any).YT = mockYTAPI
      if ((window as any).onYouTubeIframeAPIReady) {
        ;(window as any).onYouTubeIframeAPIReady()
      }
    }, 100)

    const duration = await promise
    expect(duration).toBe("03:15")
  })

  it("should create and cleanup iframe properly", async () => {
    const promise = getYoutubeVideoDuration(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    )

    // Check that iframe is created
    await waitForCondition(() => {
      const iframe = document.querySelector(
        'iframe[id^="yt-duration-"]',
      ) as HTMLIFrameElement
      if (!iframe) return false
      expect(iframe.src).toContain("youtube.com/embed/dQw4w9WgXcQ")
      expect(iframe.src).toContain("enablejsapi=1")
      expect(iframe.src).toContain("origin=http%3A%2F%2Flocalhost%3A3000")
      return true
    })

    await promise

    // Check that iframe is cleaned up
    await waitForCondition(() => {
      const iframe = document.querySelector('iframe[id^="yt-duration-"]')
      return !iframe
    })
  })

  it("should handle player errors gracefully", async () => {
    // Mock player to trigger error
    mockYTAPI.Player = vi
      .fn()
      .mockImplementation((_elementId: string, config: any) => {
        setTimeout(() => {
          if (config.events?.onError) {
            config.events.onError()
          }
        }, 50)
        return mockYTPlayer
      })

    const duration = await getYoutubeVideoDuration(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    )

    expect(duration).toBe(null)
  })

  it("should handle zero duration with retry logic", async () => {
    let callCount = 0
    mockYTPlayer.getDuration = vi.fn(() => {
      callCount++
      if (callCount <= 3) return 0 // Return 0 for first few calls
      return 195 // Then return actual duration
    })

    const duration = await getYoutubeVideoDuration(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    )

    expect(duration).toBe("03:15")
    expect(mockYTPlayer.getDuration).toHaveBeenCalledTimes(4)
  })

  it("should timeout after 10 seconds", async () => {
    // Mock player that never calls onReady (simulates network/API issues)
    mockYTAPI.Player = vi.fn().mockImplementation(() => {
      // Return player but never trigger onReady
      return {
        getDuration: vi.fn(() => 195),
        destroy: vi.fn(),
      }
    })

    // This should timeout and return null
    const duration = await getYoutubeVideoDuration(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    )

    expect(duration).toBe(null)
  }, 12000)

  it("should handle player construction errors", async () => {
    // Mock YT.Player constructor to throw
    mockYTAPI.Player = vi.fn().mockImplementation(() => {
      throw new Error("Player construction failed")
    })

    const duration = await getYoutubeVideoDuration(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    )

    expect(duration).toBe(null)
  })

  it("should handle getDuration exceptions during retry", async () => {
    let callCount = 0
    const mockPlayerWithErrors = {
      getDuration: vi.fn(() => {
        callCount++
        if (callCount === 1) {
          // First call returns 0 to trigger retry logic
          return 0
        }
        // Subsequent calls in retry interval throw errors
        throw new Error("getDuration failed")
      }),
      destroy: vi.fn(),
    }

    mockYTAPI.Player = vi
      .fn()
      .mockImplementation((_elementId: string, config: any) => {
        setTimeout(() => {
          if (config.events?.onReady) {
            config.events.onReady({ target: mockPlayerWithErrors })
          }
        }, 50)
        return mockPlayerWithErrors
      })

    const duration = await getYoutubeVideoDuration(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    )

    expect(duration).toBe(null) // Should give up after 8 attempts
    expect(callCount).toBe(9) // Initial call + 8 retry attempts
  }, 5000)

  it("should reuse existing script tag if present", async () => {
    // Add existing script tag to DOM
    const existingScript = document.createElement("script")
    existingScript.src = "https://www.youtube.com/iframe_api"
    document.body.appendChild(existingScript)

    const duration = await getYoutubeVideoDuration(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    )

    expect(duration).toBe("03:15")

    // Should not have added another script
    const scripts = document.querySelectorAll(
      'script[src*="youtube.com/iframe_api"]',
    )
    expect(scripts.length).toBe(1)
  })

  it("should handle destroy method not being a function", async () => {
    // Create a player with non-function destroy method
    const mockPlayerWithBadDestroy = {
      getDuration: vi.fn(() => 195),
      destroy: "not-a-function", // Invalid destroy method
    }

    mockYTAPI.Player = vi
      .fn()
      .mockImplementation((_elementId: string, config: any) => {
        setTimeout(() => {
          if (config.events?.onReady) {
            config.events.onReady({ target: mockPlayerWithBadDestroy })
          }
        }, 50)
        return mockPlayerWithBadDestroy
      })

    // Should not throw error during cleanup and should still return duration
    const duration = await getYoutubeVideoDuration(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    )

    expect(duration).toBe("03:15")
  })

  it("should generate unique iframe IDs for concurrent calls", async () => {
    let createdPlayerCount = 0
    mockYTAPI.Player = vi
      .fn()
      .mockImplementation((_elementId: string, config: any) => {
        const playerIndex = createdPlayerCount++
        const player = {
          getDuration: vi.fn(() => 195),
          destroy: vi.fn(),
        }

        // Stagger the onReady calls slightly to simulate real-world timing
        setTimeout(
          () => {
            if (config.events?.onReady) {
              config.events.onReady({ target: player })
            }
          },
          50 + playerIndex * 25,
        )

        return player
      })

    // Make multiple concurrent calls
    const promises = [
      getYoutubeVideoDuration("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      getYoutubeVideoDuration("https://www.youtube.com/watch?v=test1"),
      getYoutubeVideoDuration("https://www.youtube.com/watch?v=test2"),
    ]

    // Check that multiple iframes are created with unique IDs
    await waitForCondition(
      () => {
        const iframes = document.querySelectorAll('iframe[id^="yt-duration-"]')
        if (iframes.length !== 3) return false
        const ids = Array.from(iframes).map((iframe) => iframe.id)
        const uniqueIds = [...new Set(ids)]
        expect(uniqueIds.length).toBe(3)
        return true
      },
      { timeout: 2000 },
    )

    const results = await Promise.all(promises)
    results.forEach((duration) => {
      expect(duration).toBe("03:15")
    })

    // Verify Player was called 3 times
    expect(mockYTAPI.Player).toHaveBeenCalledTimes(3)
  })

  it("should return a stable function across calls", () => {
    expect(typeof getYoutubeVideoDuration).toBe("function")
    expect(typeof getYoutubeVideoDuration).toBe("function")
  })
})
