import { describe, expect, it } from "vitest"
import { extractYouTubeId } from "./extract-youtube-video-id"

describe("extractYouTubeId", () => {
  it("returns null for null input", () => {
    expect(extractYouTubeId(null)).toBeNull()
  })

  it("returns null for empty string", () => {
    expect(extractYouTubeId("")).toBeNull()
  })

  it("extracts id from youtu.be short URL", () => {
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("extracts id from youtu.be URL with params", () => {
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=42")).toBe(
      "dQw4w9WgXcQ",
    )
  })

  it("extracts id from standard watch URL", () => {
    expect(
      extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ")
  })

  it("extracts id from watch URL with multiple query params", () => {
    expect(
      extractYouTubeId(
        "https://youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=Rick",
      ),
    ).toBe("dQw4w9WgXcQ")
  })

  it("extracts id from embed URL", () => {
    expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    )
  })

  it("extracts id from shorts URL", () => {
    expect(
      extractYouTubeId("https://youtube.com/shorts/dQw4w9WgXcQ?feature=share"),
    ).toBe("dQw4w9WgXcQ")
  })

  it("extracts id from URL-like string without protocol using regex fallback", () => {
    expect(extractYouTubeId("www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    )
  })

  it("returns null for plain ID or unrelated strings", () => {
    expect(extractYouTubeId("dQw4w9WgXcQ")).toBeNull()
    expect(extractYouTubeId("not a youtube url")).toBeNull()
  })

  it("extracts id when youtube.com path's last segment is the id", () => {
    expect(
      extractYouTubeId("https://www.youtube.com/some/path/dQw4w9WgXcQ/"),
    ).toBe("dQw4w9WgXcQ")
  })

  it.each([
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    "https://WWW.YOUTUBE.COM/watch?v=dQw4w9WgXcQ",
    "youtu.be/dQw4w9WgXcQ",
    "m.youtube.com/watch?v=dQw4w9WgXcQ",
  ])("accepts %s", (url) => {
    expect(extractYouTubeId(url)).toBe("dQw4w9WgXcQ")
  })

  it.each([
    "https://evilyoutube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be.evil.com/dQw4w9WgXcQ",
    "https://evil.com/watch?v=dQw4w9WgXcQ",
    "https://evil.com/?next=youtube.com/embed/dQw4w9WgXcQ",
    "evil.com/watch?v=dQw4w9WgXcQ",
    "notyoutu.be/dQw4w9WgXcQ",
  ])("rejects lookalike host %s", (url) => {
    expect(extractYouTubeId(url)).toBeNull()
  })

  it.each([
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQextra",
    "https://www.youtube.com/watch?v=dQw4w9Wg<>Q",
    "https://youtu.be/short",
    "https://www.youtube.com/embed/x",
  ])("rejects malformed id in %s", (url) => {
    expect(extractYouTubeId(url)).toBeNull()
  })

  it("does not return path segments that are not ids", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch")).toBeNull()
    expect(
      extractYouTubeId("https://www.youtube.com/playlist?list=PL12345"),
    ).toBeNull()
    expect(extractYouTubeId("https://www.youtube.com/")).toBeNull()
  })
})
