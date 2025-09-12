/** biome-ignore-all lint/suspicious/noExplicitAny: Mocked functions */
vi.mock("node:fs/promises", () => ({ default: { rm: vi.fn() } }))
vi.mock("./file-exists", () => ({ fileExists: vi.fn() }))

import fs from "node:fs/promises"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fileDelete } from "./file-delete"
import { fileExists } from "./file-exists"

describe("fileDelete", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("calls fs.rm when fileExists returns true", async () => {
    ;(fileExists as any).mockResolvedValueOnce(true)
    ;(fs as any).rm.mockResolvedValueOnce(undefined)

    const path = "/tmp/existing-file.txt"
    await fileDelete(path)

    expect(fileExists as any).toHaveBeenCalledWith(path)
    expect((fs as any).rm).toHaveBeenCalledWith(path)
  })

  it("does not call fs.rm when fileExists returns false", async () => {
    ;(fileExists as any).mockResolvedValueOnce(false)

    const path = "/tmp/missing-file.txt"
    await fileDelete(path)

    expect(fileExists as any).toHaveBeenCalledWith(path)
    expect((fs as any).rm).not.toHaveBeenCalled()
  })

  it("catches and logs when fs.rm throws", async () => {
    ;(fileExists as any).mockResolvedValueOnce(true)
    const rmError = new Error("rm failed")
    ;(fs as any).rm.mockRejectedValueOnce(rmError)
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const path = "/tmp/error-file.txt"
    await expect(fileDelete(path)).resolves.toBeUndefined()

    expect((fs as any).rm).toHaveBeenCalledWith(path)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("catches and logs when fileExists throws", async () => {
    const existsError = new Error("exists failed")
    ;(fileExists as any).mockRejectedValueOnce(existsError)
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const path = "/tmp/exists-error.txt"
    await expect(fileDelete(path)).resolves.toBeUndefined()

    expect(fileExists as any).toHaveBeenCalledWith(path)
    expect((fs as any).rm).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
