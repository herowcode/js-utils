export const DEFAULT_REDACT_PATHS: readonly string[] = [
  "password",
  "token",
  "apiKey",
  "authorization",
  "cookie",
  "*.password",
  "*.token",
  "*.apiKey",
  "*.authorization",
  "*.cookie",
  "req.headers.authorization",
  "req.headers.cookie",
  "headers.authorization",
  "headers.cookie",
]

const DEFAULT_REDACT_KEYS = new Set([
  "password",
  "token",
  "apikey",
  "authorization",
  "cookie",
  "secret",
])

const REDACTED = "[REDACTED]"

export function browserRedact<T>(value: T, extra?: readonly string[]): T {
  const keys = new Set(DEFAULT_REDACT_KEYS)
  if (extra) for (const k of extra) keys.add(k.toLowerCase())
  return walk(value, keys) as T
}

function walk(value: unknown, keys: Set<string>): unknown {
  if (value === null || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map((v) => walk(v, keys))

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value)) {
    if (keys.has(k.toLowerCase())) {
      out[k] = REDACTED
    } else {
      out[k] = walk(v, keys)
    }
  }
  return out
}
