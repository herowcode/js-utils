import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { safeStorage } from "./safe-storage"
import { safeStorage as nodeSafeStorage } from "./safe-storage-node-fallback"

const quotaError = () => new DOMException("full", "QuotaExceededError")

describe("safeStorage", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("reads and writes through localStorage", () => {
    const store = safeStorage()
    expect(store.get("k")).toBeNull()
    expect(store.set("k", "v")).toBe(true)
    expect(localStorage.getItem("k")).toBe("v")
    expect(store.get("k")).toBe("v")
    store.remove("k")
    expect(localStorage.getItem("k")).toBeNull()
  })

  it("can use sessionStorage", () => {
    const store = safeStorage("session")
    store.set("k", "v")
    expect(sessionStorage.getItem("k")).toBe("v")
    expect(localStorage.getItem("k")).toBeNull()
  })

  it("round-trips JSON", () => {
    const store = safeStorage()
    expect(store.setJSON("o", { a: [1, 2] })).toBe(true)
    expect(store.getJSON("o")).toEqual({ a: [1, 2] })
    expect(store.getJSON("o", { fallback: {} })).toEqual({ a: [1, 2] })
  })

  it("getJSON returns the fallback for missing keys and keeps invalid raw values", () => {
    const store = safeStorage()
    expect(store.getJSON("missing")).toBeNull()
    expect(store.getJSON("missing", { fallback: 7 })).toBe(7)
    localStorage.setItem("bad", "{oops")
    expect(store.getJSON("bad", { fallback: { ok: false } })).toEqual({
      ok: false,
    })
    expect(store.getJSON("bad")).toBeNull()
    expect(localStorage.getItem("bad")).toBe("{oops")
  })

  it("setJSON returns false for values that cannot be serialized", () => {
    const store = safeStorage()
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    expect(store.setJSON("c", cyclic)).toBe(false)
    expect(store.setJSON("u", undefined)).toBe(false)
    expect(store.setJSON("big", 10n)).toBe(false)
  })

  describe("quota errors", () => {
    it("falls back to memory and returns false", () => {
      const store = safeStorage()
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw quotaError()
      })
      expect(store.set("k", "v")).toBe(false)
      expect(store.get("k")).toBe("v")
      expect(store.setJSON("j", { a: 1 })).toBe(false)
      expect(store.getJSON("j")).toEqual({ a: 1 })
    })

    it("persists again once storage recovers and drops the memory copy", () => {
      const store = safeStorage()
      const spy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw quotaError()
        })
      store.set("k", "old")
      spy.mockRestore()
      expect(store.set("k", "new")).toBe(true)
      localStorage.removeItem("k")
      expect(store.get("k")).toBeNull()
    })

    it("remove clears the memory copy too", () => {
      const store = safeStorage()
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw quotaError()
      })
      store.set("k", "v")
      store.remove("k")
      expect(store.get("k")).toBeNull()
    })

    it("keeps instances independent", () => {
      const a = safeStorage()
      const b = safeStorage()
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw quotaError()
      })
      a.set("k", "v")
      expect(b.get("k")).toBeNull()
    })
  })

  describe("blocked storage", () => {
    const block = () =>
      vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
        throw new DOMException("denied", "SecurityError")
      })

    it("works from memory without throwing", () => {
      block()
      const store = safeStorage()
      expect(store.get("k")).toBeNull()
      expect(store.set("k", "v")).toBe(false)
      expect(store.get("k")).toBe("v")
      expect(store.setJSON("j", [1])).toBe(false)
      expect(store.getJSON("j")).toEqual([1])
      expect(() => store.remove("k")).not.toThrow()
      expect(store.get("k")).toBeNull()
    })

    it("only touches storage when first used", () => {
      const spy = block()
      const store = safeStorage()
      expect(spy).not.toHaveBeenCalled()
      store.get("k")
      expect(spy).toHaveBeenCalledTimes(1)
      store.get("k")
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it("falls back when reads throw", () => {
      const store = safeStorage()
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("denied", "SecurityError")
      })
      expect(store.get("k")).toBeNull()
      expect(store.getJSON("k", { fallback: 1 })).toBe(1)
    })
  })

  describe("SSR", () => {
    it("uses memory when window is undefined", () => {
      vi.stubGlobal("window", undefined)
      const store = safeStorage()
      expect(store.set("k", "v")).toBe(false)
      expect(store.get("k")).toBe("v")
      expect(store.setJSON("j", { a: 1 })).toBe(false)
      expect(store.getJSON("j")).toEqual({ a: 1 })
      store.remove("k")
      expect(store.get("k")).toBeNull()
    })

    it("does not cache the missing window, so it uses storage once it exists", () => {
      vi.stubGlobal("window", undefined)
      const store = safeStorage()
      store.get("k")
      vi.unstubAllGlobals()
      expect(store.set("k", "v")).toBe(true)
      expect(localStorage.getItem("k")).toBe("v")
    })
  })
})

describe("safeStorage node fallback", () => {
  it("is memory-only and never throws", () => {
    const store = nodeSafeStorage()
    expect(store.set("k", "v")).toBe(false)
    expect(store.get("k")).toBe("v")
    expect(store.setJSON("j", { a: 1 })).toBe(false)
    expect(store.getJSON("j")).toEqual({ a: 1 })
    store.remove("k")
    expect(store.get("k")).toBeNull()
  })
})
