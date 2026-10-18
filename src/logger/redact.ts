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
  return walk(value, keys, new WeakSet()) as T
}

function walkEntries(
  entries: Iterable<[string, unknown]>,
  keys: Set<string>,
  ancestors: WeakSet<object>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of entries) {
    out[k] = keys.has(k.toLowerCase()) ? REDACTED : walk(v, keys, ancestors)
  }
  return out
}

function walk(
  value: unknown,
  keys: Set<string>,
  ancestors: WeakSet<object>,
): unknown {
  if (value === null || typeof value !== "object") return value
  if (ancestors.has(value)) return "[Circular]"

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString()
  }
  if (value instanceof RegExp) return String(value)

  ancestors.add(value)
  try {
    if (Array.isArray(value)) return value.map((v) => walk(v, keys, ancestors))
    if (value instanceof Set) {
      return Array.from(value, (v) => walk(v, keys, ancestors))
    }
    if (value instanceof Map) {
      return walkEntries(
        Array.from(value, ([k, v]): [string, unknown] => [String(k), v]),
        keys,
        ancestors,
      )
    }
    if (value instanceof Error) {
      const entries: [string, unknown][] = [
        ["name", value.name],
        ["message", value.message],
        ["stack", value.stack],
        ...Object.entries(value),
      ]
      if ("cause" in value) entries.push(["cause", value.cause])
      return walkEntries(entries, keys, ancestors)
    }
    const toJSON = (value as { toJSON?: unknown }).toJSON
    if (typeof toJSON === "function") {
      return walk(toJSON.call(value), keys, ancestors)
    }
    return walkEntries(Object.entries(value), keys, ancestors)
  } finally {
    ancestors.delete(value)
  }
}
