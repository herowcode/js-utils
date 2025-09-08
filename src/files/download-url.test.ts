import { downloadUrl } from "./download-url"

describe("downloadUrl", () => {
  const originalFetch = global.fetch
  const originalCreateElement = document.createElement
  const originalAppendChild = document.body.appendChild
  const originalRemoveChild = document.body.removeChild
  const originalCreateObjectURL = window.URL.createObjectURL

  beforeEach(() => {
    // Mock fetch to return a blob
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest
        .fn()
        .mockResolvedValue(new Blob(["test content"], { type: "text/plain" })),
      // biome-ignore lint/suspicious/noExplicitAny: fetch mock
    }) as any

    // Mock <a> element and its click
    document.createElement = jest.fn().mockImplementation((tag: string) => {
      if (tag === "a") {
        return {
          href: "",
          download: "",
          click: jest.fn(),
        }
      }
      return originalCreateElement.call(document, tag)
    })

    // Mock appendChild and removeChild
    document.body.appendChild = jest.fn()
    document.body.removeChild = jest.fn()

    // Mock createObjectURL
    window.URL.createObjectURL = jest.fn().mockReturnValue("blob:url")
  })

  afterEach(() => {
    global.fetch = originalFetch
    document.createElement = originalCreateElement
    document.body.appendChild = originalAppendChild
    document.body.removeChild = originalRemoveChild
    window.URL.createObjectURL = originalCreateObjectURL
    jest.clearAllMocks()
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
    const consoleErrorSpy = jest
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
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"))
    const url = "https://example.com/files/test.txt"
    const consoleErrorSpy = jest
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
})
