export interface IGetErrorMessageOptions {
  /** Returned when no message is found. Defaults to "Unknown error". */
  fallback?: string
  /** Keys to try, in order. Defaults to `["message", "error", "detail"]`. */
  keys?: readonly string[]
}

function pick(source: object, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = (source as Record<string, unknown>)[key]
    if (typeof value === "string" && value.trim() !== "") return value
  }
  return undefined
}

/**
 * Extracts a human-readable message from an Error, API error shape, string or unknown value.
 * @example getErrorMessage({ error: { message: "Nope" } }) // "Nope"
 */
export function getErrorMessage(
  err: unknown,
  {
    fallback = "Unknown error",
    keys = ["message", "error", "detail"],
  }: IGetErrorMessageOptions = {},
): string {
  if (typeof err === "string") return err.trim() === "" ? fallback : err
  if (typeof err !== "object" || err === null) return fallback

  const direct = pick(err, keys)
  if (direct !== undefined) return direct

  for (const key of keys) {
    const nested = (err as Record<string, unknown>)[key]
    if (typeof nested === "object" && nested !== null) {
      const message = pick(nested, keys)
      if (message !== undefined) return message
    }
  }
  return fallback
}
