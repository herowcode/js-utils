import { afterEach, describe, expect, it, vi } from "vitest"
import { copyToClipboard } from "./copy-to-clipboard"

function stubClipboard(
  writeText: ((text: string) => Promise<void>) | undefined,
) {
  Object.defineProperty(navigator, "clipboard", {
    value: writeText ? { writeText } : undefined,
    configurable: true,
  })
}

describe("copyToClipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    Reflect.deleteProperty(navigator, "clipboard")
  })

  it("uses the async clipboard API", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)
    await expect(copyToClipboard("hello")).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith("hello")
  })

  it("falls back to execCommand when the API is missing", async () => {
    stubClipboard(undefined)
    const exec = vi.fn().mockReturnValue(true)
    document.execCommand = exec
    await expect(copyToClipboard("hello")).resolves.toBe(true)
    expect(exec).toHaveBeenCalledWith("copy")
    expect(document.querySelector("textarea")).toBeNull()
  })

  it("falls back to execCommand when the API rejects", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")))
    document.execCommand = vi.fn().mockReturnValue(true)
    await expect(copyToClipboard("x")).resolves.toBe(true)
  })

  it("resolves false when both paths fail", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")))
    document.execCommand = vi.fn().mockReturnValue(false)
    await expect(copyToClipboard("x")).resolves.toBe(false)
    expect(document.querySelector("textarea")).toBeNull()
  })

  it("resolves false when execCommand throws", async () => {
    stubClipboard(undefined)
    document.execCommand = vi.fn(() => {
      throw new Error("blocked")
    })
    await expect(copyToClipboard("x")).resolves.toBe(false)
    expect(document.querySelector("textarea")).toBeNull()
  })
})
