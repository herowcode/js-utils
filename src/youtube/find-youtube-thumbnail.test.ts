import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { findYoutubeThumbnail } from "./find-youtube-thumbnail"

type TBehavior = "load" | "error" | "hang"

const behaviors = new Map<string, { kind: TBehavior; naturalWidth?: number }>()
const requested: string[] = []

const url = (quality: string) => `https://img.youtube.com/vi/vid/${quality}.jpg`

describe("findYoutubeThumbnail", () => {
  beforeEach(() => {
    behaviors.clear()
    requested.length = 0
    vi.stubGlobal(
      "Image",
      class {
        onload?: () => void
        onerror?: () => void
        naturalWidth = 0
        set src(v: string) {
          requested.push(v)
          const b = behaviors.get(v) ?? { kind: "error" }
          if (b.kind === "hang") return
          this.naturalWidth = b.naturalWidth ?? 480
          queueMicrotask(() =>
            b.kind === "load" ? this.onload?.() : this.onerror?.(),
          )
        }
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("returns the first thumbnail that loads, preferring higher quality", async () => {
    behaviors.set(url("maxresdefault"), { kind: "load" })
    behaviors.set(url("hqdefault"), { kind: "load" })

    await expect(findYoutubeThumbnail("vid")).resolves.toBe(
      url("maxresdefault"),
    )
  })

  it("treats the 120px placeholder YouTube serves for missing thumbnails as missing", async () => {
    behaviors.set(url("maxresdefault"), { kind: "load", naturalWidth: 120 })
    behaviors.set(url("hqdefault"), { kind: "load", naturalWidth: 480 })

    await expect(findYoutubeThumbnail("vid")).resolves.toBe(url("hqdefault"))
  })

  it("returns null when every candidate is missing or a placeholder", async () => {
    behaviors.set(url("hqdefault"), { kind: "load", naturalWidth: 120 })

    await expect(findYoutubeThumbnail("vid")).resolves.toBeNull()
  })

  it("moves on when an image never settles", async () => {
    vi.useFakeTimers()
    behaviors.set(url("maxresdefault"), { kind: "hang" })
    behaviors.set(url("hqdefault"), { kind: "load" })

    const result = findYoutubeThumbnail("vid")
    await vi.advanceTimersByTimeAsync(10000)

    await expect(result).resolves.toBe(url("hqdefault"))
  })

  it("returns null when Image is unavailable (Node)", async () => {
    vi.stubGlobal("Image", undefined)

    await expect(findYoutubeThumbnail("vid")).resolves.toBeNull()
  })
})
