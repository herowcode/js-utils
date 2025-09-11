import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useGetYoutubeVideoDuration } from './use-get-video-duration'

// Mock the string utility function
vi.mock('../string', () => ({
  formatSecondsToHMS: vi.fn((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })
}))

// Mock the YouTube ID extraction function
vi.mock('./extract-youtube-video-id', () => ({
  extractYouTubeId: vi.fn((url: string) => {
    if (url.includes('dQw4w9WgXcQ')) return 'dQw4w9WgXcQ'
    if (url.includes('invalid')) return null
    if (url.includes('test1')) return 'test1'
    if (url.includes('test2')) return 'test2'
    return 'test-video-id'
  })
}))

describe('useGetYoutubeVideoDuration', () => {
  let mockYTPlayer: any
  let mockYTAPI: any
  let originalYT: any

  beforeEach(() => {
    // Clear any existing scripts
    const existingScripts = document.querySelectorAll('script[src*="youtube.com/iframe_api"]')
    existingScripts.forEach(script => script.remove())

    // Clear any existing iframes
    const existingIframes = document.querySelectorAll('iframe[id^="yt-duration-"]')
    existingIframes.forEach(iframe => iframe.remove())

    // Store original YT if it exists
    originalYT = (window as any).YT

    // Mock YT Player
    mockYTPlayer = {
      getDuration: vi.fn(() => 195), // 3:15 duration
      destroy: vi.fn()
    }

    // Mock YT API
    mockYTAPI = {
      Player: vi.fn().mockImplementation((elementId: string, config: any) => {
        // Simulate async ready event
        setTimeout(() => {
          if (config.events?.onReady) {
            config.events.onReady({ target: mockYTPlayer })
          }
        }, 50)
        return mockYTPlayer
      })
    }

    // Set up the global YT object
    ;(window as any).YT = mockYTAPI
    ;(window as any).onYouTubeIframeAPIReady = undefined

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000'
      },
      writable: true
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
    iframes.forEach(iframe => iframe.remove())

    // Clean up scripts
    const scripts = document.querySelectorAll('script[src*="youtube.com/iframe_api"]')
    scripts.forEach(script => script.remove())
  })

  it('should return a function when called', () => {
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    expect(typeof result.current).toBe('function')
  })

  it('should return formatted duration for valid YouTube URL', async () => {
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    const duration = await result.current('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    
    expect(duration).toBe('00:03:15')
  })

  it('should return null for invalid YouTube URL', async () => {
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    const duration = await result.current('https://invalid-url.com')
    
    expect(duration).toBe(null)
  })

  it('should handle YouTube API loading', async () => {
    // Remove YT from window to simulate API not loaded
    delete (window as any).YT
    
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    // Start the function call
    const promise = result.current('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    
    // Simulate API loading
    setTimeout(() => {
      ;(window as any).YT = mockYTAPI
      if ((window as any).onYouTubeIframeAPIReady) {
        ;(window as any).onYouTubeIframeAPIReady()
      }
    }, 100)
    
    const duration = await promise
    expect(duration).toBe('00:03:15')
  })

  it('should create and cleanup iframe properly', async () => {
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    const promise = result.current('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    
    // Check that iframe is created
    await waitFor(() => {
      const iframe = document.querySelector('iframe[id^="yt-duration-"]') as HTMLIFrameElement
      expect(iframe).toBeTruthy()
      expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ')
      expect(iframe?.src).toContain('enablejsapi=1')
      expect(iframe?.src).toContain('origin=http%3A%2F%2Flocalhost%3A3000')
    })
    
    await promise
    
    // Check that iframe is cleaned up
    await waitFor(() => {
      const iframe = document.querySelector('iframe[id^="yt-duration-"]')
      expect(iframe).toBeFalsy()
    })
  })

  it('should handle player errors gracefully', async () => {
    // Mock player to trigger error
    mockYTAPI.Player = vi.fn().mockImplementation((elementId: string, config: any) => {
      setTimeout(() => {
        if (config.events?.onError) {
          config.events.onError()
        }
      }, 50)
      return mockYTPlayer
    })
    
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    const duration = await result.current('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    
    expect(duration).toBe(null)
  })

  it('should handle zero duration with retry logic', async () => {
    let callCount = 0
    mockYTPlayer.getDuration = vi.fn(() => {
      callCount++
      if (callCount <= 3) return 0 // Return 0 for first few calls
      return 195 // Then return actual duration
    })
    
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    const duration = await result.current('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    
    expect(duration).toBe('00:03:15')
    expect(mockYTPlayer.getDuration).toHaveBeenCalledTimes(4)
  })

  it('should timeout after 10 seconds', async () => {
    // Mock player that never calls onReady (simulates network/API issues)
    mockYTAPI.Player = vi.fn().mockImplementation(() => {
      // Return player but never trigger onReady
      return {
        getDuration: vi.fn(() => 195),
        destroy: vi.fn()
      }
    })
    
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    // This should timeout and return null
    const duration = await result.current('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    
    expect(duration).toBe(null)
  }, 12000)

  it('should handle player construction errors', async () => {
    // Mock YT.Player constructor to throw
    mockYTAPI.Player = vi.fn().mockImplementation(() => {
      throw new Error('Player construction failed')
    })
    
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    const duration = await result.current('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    
    expect(duration).toBe(null)
  })

  it('should handle getDuration exceptions during retry', async () => {
    let callCount = 0
    const mockPlayerWithErrors = {
      getDuration: vi.fn(() => {
        callCount++
        if (callCount === 1) {
          // First call returns 0 to trigger retry logic
          return 0
        }
        // Subsequent calls in retry interval throw errors
        throw new Error('getDuration failed')
      }),
      destroy: vi.fn()
    }

    mockYTAPI.Player = vi.fn().mockImplementation((elementId: string, config: any) => {
      setTimeout(() => {
        if (config.events?.onReady) {
          config.events.onReady({ target: mockPlayerWithErrors })
        }
      }, 50)
      return mockPlayerWithErrors
    })
    
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    const duration = await result.current('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    
    expect(duration).toBe(null) // Should give up after 8 attempts
    expect(callCount).toBe(9) // Initial call + 8 retry attempts
  }, 5000)

  it('should reuse existing script tag if present', async () => {
    // Add existing script tag to DOM
    const existingScript = document.createElement('script')
    existingScript.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(existingScript)
    
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    const duration = await result.current('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    
    expect(duration).toBe('00:03:15')
    
    // Should not have added another script
    const scripts = document.querySelectorAll('script[src*="youtube.com/iframe_api"]')
    expect(scripts.length).toBe(1)
  })

  it('should handle destroy method not being a function', async () => {
    // Create a player with non-function destroy method
    const mockPlayerWithBadDestroy = {
      getDuration: vi.fn(() => 195),
      destroy: 'not-a-function' // Invalid destroy method
    }
    
    mockYTAPI.Player = vi.fn().mockImplementation((elementId: string, config: any) => {
      setTimeout(() => {
        if (config.events?.onReady) {
          config.events.onReady({ target: mockPlayerWithBadDestroy })
        }
      }, 50)
      return mockPlayerWithBadDestroy
    })
    
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    // Should not throw error during cleanup and should still return duration
    const duration = await result.current('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    
    expect(duration).toBe('00:03:15')
  })

  it('should generate unique iframe IDs for concurrent calls', async () => {
    const { result } = renderHook(() => useGetYoutubeVideoDuration())
    
    let createdPlayerCount = 0
    mockYTAPI.Player = vi.fn().mockImplementation((elementId: string, config: any) => {
      const playerIndex = createdPlayerCount++
      const player = {
        getDuration: vi.fn(() => 195),
        destroy: vi.fn()
      }
      
      // Stagger the onReady calls slightly to simulate real-world timing
      setTimeout(() => {
        if (config.events?.onReady) {
          config.events.onReady({ target: player })
        }
      }, 50 + (playerIndex * 25))
      
      return player
    })
    
    // Make multiple concurrent calls
    const promises = [
      result.current('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      result.current('https://www.youtube.com/watch?v=test1'),
      result.current('https://www.youtube.com/watch?v=test2')
    ]
    
    // Check that multiple iframes are created with unique IDs
    await waitFor(() => {
      const iframes = document.querySelectorAll('iframe[id^="yt-duration-"]')
      expect(iframes.length).toBe(3)
      
      const ids = Array.from(iframes).map(iframe => iframe.id)
      const uniqueIds = [...new Set(ids)]
      expect(uniqueIds.length).toBe(3) // All IDs should be unique
    }, { timeout: 2000 })
    
    const results = await Promise.all(promises)
    results.forEach(duration => {
      expect(duration).toBe('00:03:15')
    })
    
    // Verify Player was called 3 times
    expect(mockYTAPI.Player).toHaveBeenCalledTimes(3)
  })

  it('should return the same function reference on re-renders', () => {
    const { result, rerender } = renderHook(() => useGetYoutubeVideoDuration())
    
    const firstFunction = result.current
    
    rerender()
    
    const secondFunction = result.current
    
    expect(firstFunction).toBe(secondFunction)
  })
})