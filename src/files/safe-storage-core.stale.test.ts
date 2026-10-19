import { describe, expect, it } from "vitest"
import { createSafeStorage } from "./safe-storage-core"

describe("createSafeStorage after a failed set", () => {
  it("returns the newer in-memory value, not the stale stored one", () => {
    const data = new Map<string, string>([["k", "old"]])
    let failing = false
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (failing) throw new Error("quota")
        data.set(key, value)
      },
      removeItem: (key: string) => void data.delete(key),
    } as unknown as Storage
    const safe = createSafeStorage(() => storage)

    failing = true
    expect(safe.set("k", "new")).toBe(false)
    expect(safe.get("k")).toBe("new")

    failing = false
    expect(safe.set("k", "newest")).toBe(true)
    expect(safe.get("k")).toBe("newest")
  })
})
