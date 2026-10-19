import {
  createSafeStorage,
  type ISafeStorage,
  type TSafeStorageKind,
} from "./safe-storage-core"

export type { ISafeStorage, TSafeStorageKind } from "./safe-storage-core"

/**
 * Node has no Web Storage: the instance is memory-only so SSR code never throws.
 * @example safeStorage().setJSON("prefs", { theme: "dark" }) // true, kept in memory
 */
export function safeStorage(_kind?: TSafeStorageKind): ISafeStorage {
  return createSafeStorage(() => null)
}
