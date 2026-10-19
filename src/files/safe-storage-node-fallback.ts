import { createSafeStorage, type ISafeStorage } from "./safe-storage-core"

export type { ISafeStorage, TSafeStorageKind } from "./safe-storage-core"

/** Node has no Web Storage: the instance is memory-only so SSR code never throws. */
export function safeStorage(_kind?: "local" | "session"): ISafeStorage {
  return createSafeStorage(() => null)
}
