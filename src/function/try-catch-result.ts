export type TTryCatchOk<T> = { ok: true; data: T }
export type TTryCatchFail<E> = { ok: false; error: E }

/**
 * Like `tryCatch`, but returns a discriminated `{ ok }` so `if (!r.ok)` narrows without null checks.
 * @example
 * const r = await tryCatchResult(fetchUser(id))
 * if (!r.ok) return log(r.error)
 * r.data // User
 */
export async function tryCatchResult<T, E = unknown>(
  fn: Promise<T> | (() => Promise<T> | T),
): Promise<TTryCatchOk<T> | TTryCatchFail<E>> {
  try {
    const data = await (typeof fn === "function" ? fn() : fn)
    return { ok: true, data }
  } catch (error) {
    return { ok: false, error: error as E }
  }
}
