/** biome-ignore-all lint/suspicious/noExplicitAny: Mocked functions */
vi.mock("node:fs/promises", () => ({ default: { rm: vi.fn() } }))

import fs from "node:fs/promises"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fileDelete } from "./file-delete"

const errno = (code: string) =>
  Object.assign(new Error(code), { code }) as NodeJS.ErrnoException

describe("fileDelete", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("removes the path with force", async () => {
    ;(fs as any).rm.mockResolvedValueOnce(undefined)

    const path = "/tmp/existing-file.txt"
    await expect(fileDelete(path)).resolves.toBeUndefined()

    expect((fs as any).rm).toHaveBeenCalledWith(path, { force: true })
  })

  it("ignores ENOENT", async () => {
    ;(fs as any).rm.mockRejectedValueOnce(errno("ENOENT"))

    await expect(fileDelete("/tmp/missing.txt")).resolves.toBeUndefined()
  })

  it.each(["EACCES", "EISDIR", "EPERM"])("rethrows %s", async (code) => {
    const error = errno(code)
    ;(fs as any).rm.mockRejectedValueOnce(error)

    await expect(fileDelete("/tmp/locked.txt")).rejects.toBe(error)
  })
})
