export interface ISafeJsonParseOptions<F> {
  /** Returned when parsing fails or the input is not a string. Default `undefined`. */
  fallback?: F
}

/**
 * Parses JSON without throwing; returns `fallback` for invalid or non-string input.
 * @example safeJsonParse<{ a: number }>('{"a":1}', { fallback: { a: 0 } })
 */
export function safeJsonParse<T = unknown, F = undefined>(
  text: string | null | undefined,
  options: ISafeJsonParseOptions<F> = {},
): T | F {
  if (typeof text !== "string") return options.fallback as F
  try {
    return JSON.parse(text) as T
  } catch {
    return options.fallback as F
  }
}
