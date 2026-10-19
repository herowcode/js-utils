export type TSafeStorageKind = "local" | "session"

export interface ISafeStorage {
  /** The stored string, or `null` when missing. */
  get(key: string): string | null
  /** `true` when persisted; `false` when it only fits in memory (blocked storage, quota). */
  set(key: string, value: string): boolean
  /** Removes the key from storage and memory; never throws. */
  remove(key: string): void
  /** Parsed value; missing key or invalid JSON gives `fallback` (default `null`) and keeps the raw value. */
  getJSON<T>(key: string, options: { fallback: T }): T
  getJSON<T = unknown>(key: string): T | null
  /** `JSON.stringify` + `set`; `false` when the value cannot be serialized or persisted. */
  setJSON(key: string, value: unknown): boolean
}

const PROBE_KEY = "__herowcode_probe__"

export function createSafeStorage(resolve: () => Storage | null): ISafeStorage {
  const memory = new Map<string, string>()
  let storage: Storage | null = null
  let blocked = false

  // Looked up on first use: touching window.localStorage throws when storage is blocked.
  // A missing window (SSR) is not cached, so the same instance can use storage once it exists.
  const backend = (): Storage | null => {
    if (storage || blocked) return storage
    try {
      storage = resolve()
      storage?.getItem(PROBE_KEY)
    } catch {
      storage = null
      blocked = true
    }
    return storage
  }

  const get = (key: string): string | null => {
    // A failed set leaves the newer value in memory and an older one in storage
    const pending = memory.get(key)
    if (pending !== undefined) return pending
    try {
      const value = backend()?.getItem(key)
      if (value != null) return value
    } catch {
      // Fall through to the in-memory copy
    }
    return null
  }

  const set = (key: string, value: string): boolean => {
    try {
      const store = backend()
      if (store) {
        store.setItem(key, value)
        memory.delete(key)
        return true
      }
    } catch {
      // Quota or security error: keep the value for this session
    }
    memory.set(key, value)
    return false
  }

  return {
    get,
    set,
    remove(key) {
      memory.delete(key)
      try {
        backend()?.removeItem(key)
      } catch {
        // Nothing left to remove from
      }
    },
    getJSON<T>(key: string, options?: { fallback: T }) {
      const fallback = options ? options.fallback : null
      const raw = get(key)
      if (raw === null) return fallback
      try {
        return JSON.parse(raw) as T
      } catch {
        return fallback
      }
    },
    setJSON(key, value) {
      try {
        const text = JSON.stringify(value)
        return text === undefined ? false : set(key, text)
      } catch {
        return false
      }
    },
  }
}
