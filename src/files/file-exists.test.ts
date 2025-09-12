/** biome-ignore-all lint/suspicious/noExplicitAny: Fs mocked */
vi.mock("node:fs/promises", () => ({ default: { access: vi.fn() } }))

import fs from "node:fs/promises"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fileExists } from "./file-exists"

describe("fileExists", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("returns true when fs.access resolves", async () => {
    ;(fs as any).access.mockResolvedValueOnce(undefined)

    const path = "/some/existing/file"
    const result = await fileExists(path)

    expect((fs as any).access).toHaveBeenCalledWith(path)
    expect(result).toBe(true)
  })

  it("returns false when fs.access rejects", async () => {
    ;(fs as any).access.mockRejectedValueOnce(new Error("not found"))

    const path = "/some/missing/file"
    const result = await fileExists(path)

    expect((fs as any).access).toHaveBeenCalledWith(path)
    expect(result).toBe(false)
  })
})
