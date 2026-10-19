import { walkCause } from "./walk-cause"

/**
 * Returns the last link of the `cause` chain (the error itself when it has no cause).
 * @example getRootCause(new Error("a", { cause: new Error("b") })) // Error("b")
 */
export function getRootCause(err: unknown): unknown {
  return walkCause(err).at(-1)
}
