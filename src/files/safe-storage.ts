import {
  createSafeStorage,
  type ISafeStorage,
  type TSafeStorageKind,
} from "./safe-storage-core"

export type { ISafeStorage, TSafeStorageKind } from "./safe-storage-core"

/**
 * localStorage/sessionStorage that never throws: blocked storage, quota errors and SSR fall back to memory.
 * @example const prefs = safeStorage(); prefs.setJSON("prefs", { dark: true })
 */
export function safeStorage(kind: TSafeStorageKind = "local"): ISafeStorage {
  return createSafeStorage(() =>
    typeof window === "undefined"
      ? null
      : kind === "session"
        ? window.sessionStorage
        : window.localStorage,
  )
}
