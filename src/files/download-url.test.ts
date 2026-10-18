import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { downloadUrl } from "./download-url"

describe("downloadUrl", () => {
  const originalFetch = global.fetch
  const originalCreateElement = document.createElement
  const originalAppendChild = document.body.appendChild
  const originalRemoveChild = document.body.removeChild
  const originalCreateObjectURL = window.URL.createObjectURL
  const originalRevokeObjectURL = window.URL.revokeObjectURL
  let link: { href: string; download: string; click: () => void }

  beforeEach(() => {
    // Mock fetch to return a blob
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi
        .fn()
        .mockResolvedValue(new Blob(["test content"], { type: "text/plain" })),
      // biome-ignore lint/suspicious/noExplicitAny: fetch mock
    }) as any

    // Mock <a> element and its click
    document.createElement = vi.fn().mockImplementation((tag: string) => {
      if (tag === "a") {
        link = { href: "", download: "", click: vi.fn() }
        return link
      }
      return originalCreateElement.call(document, tag)
    })

    // Mock appendChild and removeChild
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()

    // Mock createObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:url")
    window.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    document.createElement = originalCreateElement
    document.body.appendChild = originalAppendChild
    document.body.removeChild = originalRemoveChild
    window.URL.createObjectURL = originalCreateObjectURL
    window.URL.revokeObjectURL = originalRevokeObjectURL
    vi.clearAllMocks()
  })

  it("downloads a file with the correct filename", async () => {
    const url = "https://example.com/files/test.txt"
    const result = await downloadUrl(url)

    expect(global.fetch).toHaveBeenCalledWith(url, { mode: "cors" })
    expect(document.createElement).toHaveBeenCalledWith("a")
    expect(window.URL.createObjectURL).toHaveBeenCalled()
    expect(document.body.appendChild).toHaveBeenCalled()
    expect(document.body.removeChild).toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it("returns false and logs error if URL does not contain a filename", async () => {
    const url = "https://example.com/files"
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})

    const result = await downloadUrl(url)

    expect(consoleErrorSpy).toHaveBeenCalled()
    const [msg, err] = consoleErrorSpy.mock.calls[0]
    expect(msg).toBe("Error downloading the file")
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe("URL does not contain a valid filename")
    expect(result).toBe(false)

    consoleErrorSpy.mockRestore()
  })

  it("returns false and logs error if fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))
    const url = "https://example.com/files/test.txt"
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})

    const result = await downloadUrl(url)

    expect(result).toBe(false)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error downloading the file",
      expect.any(Error),
    )

    consoleErrorSpy.mockRestore()
  })

  it("revokes the object URL and removes the anchor after download", async () => {
    await downloadUrl("https://example.com/files/test.txt")

    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:url")
    expect(document.body.removeChild).toHaveBeenCalledWith(link)
  })

  it("returns false on a non-2xx response without creating a link", async () => {
    const blob = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, blob })
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})

    const result = await downloadUrl("https://example.com/files/test.txt")

    expect(result).toBe(false)
    expect(blob).not.toHaveBeenCalled()
    expect(window.URL.createObjectURL).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it("cleans up even when the click fails", async () => {
    document.createElement = vi.fn().mockImplementation(() => {
      link = {
        href: "",
        download: "",
        click: vi.fn(() => {
          throw new Error("click failed")
        }),
      }
      return link
    })
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})

    const result = await downloadUrl("https://example.com/files/test.txt")

    expect(result).toBe(false)
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:url")
    expect(document.body.removeChild).toHaveBeenCalledWith(link)
    consoleErrorSpy.mockRestore()
  })

  it("decodes percent-encoded filenames", async () => {
    await downloadUrl("https://example.com/files/meu%20relat%C3%B3rio.pdf")

    expect(link.download).toBe("meu relatório.pdf")
  })
})
