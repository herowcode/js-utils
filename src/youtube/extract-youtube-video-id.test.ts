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
})
