import { describe, expect, it } from "vitest"
import { generateYoutubeURL } from "./generate-youtube-url"

describe("generateYoutubeURL", () => {
  const watchUrl = "https://www.youtube.com/watch?v=abc123"
  const shortUrl = "https://youtu.be/abc123"

  it("returns null for non-youtube URL", () => {
    const res = generateYoutubeURL({ videoURL: "https://example.com" })
    expect(res).toBeNull()
  })

  it("creates standard watch link when no options", () => {
    const res = generateYoutubeURL({ videoURL: watchUrl })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.hostname).toBe("www.youtube.com")
    expect(url.pathname).toBe("/watch")
    expect(url.searchParams.get("v")).toBe("abc123")
    expect(url.hash).toBe("")
  })

  it("creates standard watch link from short URL when no options", () => {
    const res = generateYoutubeURL({ videoURL: shortUrl })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.hostname).toBe("www.youtube.com")
    expect(url.pathname).toBe("/watch")
    expect(url.searchParams.get("v")).toBe("abc123")
    expect(url.hash).toBe("")
  })

  it("short link uses 't' query param for start when not using fragment", () => {
    const res = generateYoutubeURL({
      videoURL: shortUrl,
      short: true,
      start: 90,
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.hostname).toBe("youtu.be")
    expect(url.pathname).toBe("/abc123")
    expect(url.searchParams.get("t")).toBe("90")
    expect(url.hash).toBe("")
  })

  it("watch URL uses 'start' query param for start when not using fragment", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      start: 90,
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.hostname).toBe("www.youtube.com")
    expect(url.pathname).toBe("/watch")
    expect(url.searchParams.get("start")).toBe("90")
    expect(url.searchParams.get("v")).toBe("abc123")
    expect(url.hash).toBe("")
  })

  it("useFragment produces #t=... fragment (formatted) and no start query", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      start: "1:02",
      useFragment: true,
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    // fragment should be present and formatted as minutes+seconds
    expect(url.hash).toBe("#t=1m2s")
    // no start query param when using fragment
    expect(url.searchParams.get("start")).toBeNull()
    expect(url.searchParams.get("t")).toBeNull()
  })

  it("embed URL structure", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      embed: true,
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.hostname).toBe("www.youtube.com")
    expect(url.pathname).toBe("/embed/abc123")
    expect(url.searchParams.get("v")).toBeNull() // embed URLs don't use v param
  })

  it("embed + loop sets loop=1 and playlist=VIDEO_ID when playlist not provided", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      embed: true,
      loop: true,
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.hostname).toBe("www.youtube.com")
    expect(url.pathname).toBe("/embed/abc123")
    expect(url.searchParams.get("loop")).toBe("1")
    expect(url.searchParams.get("playlist")).toBe("abc123")
  })

  it("explicit playlist is preserved when provided with loop", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      embed: true,
      loop: true,
      playlist: "mylist123",
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.searchParams.get("loop")).toBe("1")
    expect(url.searchParams.get("playlist")).toBe("mylist123")
  })

  it("custom params override built-in params", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      autoplay: true, // will set autoplay=1
      params: { autoplay: false, foo: "bar" }, // should override to autoplay=0 and add foo
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.searchParams.get("autoplay")).toBe("0") // overridden
    expect(url.searchParams.get("foo")).toBe("bar")
  })

  it("end time accepts H:M:S and becomes seconds", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      end: "02:00",
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.searchParams.get("end")).toBe("120")
  })

  it("start time string formats work correctly", () => {
    // Test MM:SS format
    const res1 = generateYoutubeURL({
      videoURL: watchUrl,
      start: "01:30",
    })
    expect(res1).not.toBeNull()
    const url1 = new URL(res1 as string)
    expect(url1.searchParams.get("start")).toBe("90")

    // Test HH:MM:SS format
    const res2 = generateYoutubeURL({
      videoURL: watchUrl,
      start: "1:02:03",
    })
    expect(res2).not.toBeNull()
    const url2 = new URL(res2 as string)
    expect(url2.searchParams.get("start")).toBe("3723")
  })

  it("autoplay parameter works correctly", () => {
    const res1 = generateYoutubeURL({
      videoURL: watchUrl,
      autoplay: true,
    })
    expect(res1).not.toBeNull()
    const url1 = new URL(res1 as string)
    expect(url1.searchParams.get("autoplay")).toBe("1")

    const res2 = generateYoutubeURL({
      videoURL: watchUrl,
      autoplay: false,
    })
    expect(res2).not.toBeNull()
    const url2 = new URL(res2 as string)
    expect(url2.searchParams.get("autoplay")).toBe("0")
  })

  it("controls parameter works correctly", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      controls: 0,
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.searchParams.get("controls")).toBe("0")
  })

  it("mute parameter works correctly", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      mute: true,
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.searchParams.get("mute")).toBe("1")
  })

  it("origin parameter works correctly", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      embed: true,
      origin: "https://example.com",
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.searchParams.get("origin")).toBe("https://example.com")
  })

  it("useFragment works with short URLs", () => {
    const res = generateYoutubeURL({
      videoURL: shortUrl,
      short: true,
      start: "1:30",
      useFragment: true,
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.hostname).toBe("youtu.be")
    expect(url.pathname).toBe("/abc123")
    expect(url.hash).toBe("#t=1m30s")
    expect(url.searchParams.get("t")).toBeNull() // no query param when using fragment
  })

  it("loop without embed sets loop parameter but not playlist", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      loop: true,
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.searchParams.get("loop")).toBe("1")
    expect(url.searchParams.get("playlist")).toBeNull() // only set for embed
  })

  it("playlist parameter without loop", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      playlist: "myplaylist",
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    expect(url.searchParams.get("playlist")).toBe("myplaylist")
    expect(url.searchParams.get("loop")).toBeNull()
  })

  it("handles invalid start/end times gracefully", () => {
    const res = generateYoutubeURL({
      videoURL: watchUrl,
      start: "invalid",
      end: "also_invalid",
    })
    expect(res).not.toBeNull()
    const url = new URL(res as string)
    // Invalid times should result in null from formatHMSToSeconds, so no params set
    expect(url.searchParams.get("start")).toBeNull()
    expect(url.searchParams.get("end")).toBeNull()
  })
})
