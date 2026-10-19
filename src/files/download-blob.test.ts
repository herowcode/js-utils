import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { downloadBlob } from "./download-blob"

describe("downloadBlob", () => {
  const originalCreateObjectURL = window.URL.createObjectURL
  const originalRevokeObjectURL = window.URL.revokeObjectURL
  let clicked: HTMLAnchorElement | undefined

  beforeEach(() => {
    vi.useFakeTimers()
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:url")
    window.URL.revokeObjectURL = vi.fn()
    clicked = undefined
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked = this
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    window.URL.createObjectURL = originalCreateObjectURL
    window.URL.revokeObjectURL = originalRevokeObjectURL
  })

  it("clicks a temporary link with the filename and removes it", () => {
    const blob = new Blob(["a,b"], { type: "text/csv" })
    expect(downloadBlob(blob, "data.csv")).toBe(true)
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob)
    expect(clicked?.download).toBe("data.csv")
    expect(clicked?.getAttribute("href")).toBe("blob:url")
    expect(document.body.contains(clicked ?? null)).toBe(false)
  })

  it("revokes the object URL only after a delay", () => {
    downloadBlob(new Blob(["x"]), "x.txt")
    expect(window.URL.revokeObjectURL).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:url")
  })

  it("returns false and cleans up when the download fails", () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      throw new Error("click failed")
    })
    expect(downloadBlob(new Blob(["x"]), "x.txt")).toBe(false)
    expect(document.querySelector("a[download]")).toBeNull()
    vi.runAllTimers()
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:url")
  })

  it("returns false when object URLs are unavailable", () => {
    window.URL.createObjectURL = vi.fn(() => {
      throw new Error("unsupported")
    })
    expect(downloadBlob(new Blob(["x"]), "x.txt")).toBe(false)
  })
})
