import { herowError } from "../errors/herow-error"

const TRUE_VALUES = new Set(["true", "1", "yes", "y", "on"])
const FALSE_VALUES = new Set(["false", "0", "no", "n", "off", ""])

/**
 * Parses env-style booleans ("true", "1", "yes", "y", "on" and their opposites); otherwise `fallback` or a `HEROW_PARSE_BOOLEAN_INVALID` TypeError.
 * @example parseBoolean(process.env.FEATURE_X, false)
 */
export function parseBoolean(value: unknown, fallback?: boolean): boolean {
  if (typeof value === "boolean") return value
  if (value === 1) return true
  if (value === 0) return false
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (TRUE_VALUES.has(normalized)) return true
    if (FALSE_VALUES.has(normalized)) return false
  }
  if (fallback !== undefined) return fallback
  throw herowError(
    TypeError,
    "HEROW_PARSE_BOOLEAN_INVALID",
    "Value is not a recognizable boolean.",
    "Use one of true/false, 1/0, yes/no, y/n, on/off, or pass a fallback: parseBoolean(value, false).",
  )
}
