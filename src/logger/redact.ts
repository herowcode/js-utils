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

export const DEFAULT_REDACT_KEYS: ReadonlySet<string> = new Set([
  "password",
  "token",
  "apikey",
  "authorization",
  "cookie",
  "secret",
  "passwd",
  "refreshtoken",
  "accesstoken",
  "privatekey",
  "setcookie",
  "xapikey",
  "clientsecret",
])

export const REDACTED = "[REDACTED]"

export interface IRedactRules {
  keys: Set<string>
  paths: string[][]
  /** Objects nested deeper than this are replaced by "[MaxDepth]" (fails closed). */
  maxDepth?: number
  /** Applied to every string value that is not redacted by key. */
  redactString?: (text: string) => string
}

const PATH_SEGMENT = /\[(?:"([^"]*)"|'([^']*)'|([^\]]*))\]|([^.[\]]+)/g

// Same syntax as pino/fast-redact: `a.b`, `a["b-c"]`, `a[0]`, `*` / `[*]` for one segment
function parsePath(path: string): string[] {
  return Array.from(path.matchAll(PATH_SEGMENT), (m) =>
    (m[1] ?? m[2] ?? m[3]?.trim() ?? m[4]).toLowerCase(),
  )
}

// Plain keys match at any depth (broader than pino's top-level only); entries with `.`, `[` or `*` are paths from the root
export function compileRedactRules(extra?: readonly string[]): IRedactRules {
  const rules: IRedactRules = { keys: new Set(DEFAULT_REDACT_KEYS), paths: [] }
  for (const entry of extra ?? []) {
    if (/[.[*]/.test(entry)) rules.paths.push(parsePath(entry))
    else rules.keys.add(entry.toLowerCase())
  }
  return rules
}

export function redactWith<T>(value: T, rules: IRedactRules): T {
  return walk(value, rules, [], new WeakSet()) as T
}

export function browserRedact<T>(value: T, extra?: readonly string[]): T {
  return redactWith(value, compileRedactRules(extra))
}

// Path segments are lowercased when built, matching the compiled rules
function isRedacted(rules: IRedactRules, path: string[]): boolean {
  const last = path[path.length - 1]
  if (rules.keys.has(last)) return true
  // camelCase, snake_case and kebab-case variants: `refresh_token`, `x-api-key`, `userPassword`
  const flat = last.replace(/[_.-]/g, "")
  if (rules.keys.has(flat)) return true
  for (const key of DEFAULT_REDACT_KEYS) if (flat.endsWith(key)) return true
  return rules.paths.some(
    (pattern) =>
      pattern.length === path.length &&
      pattern.every((seg, i) => seg === "*" || seg === path[i]),
  )
}

function walkChild(
  key: string,
  value: unknown,
  rules: IRedactRules,
  path: string[],
  ancestors: WeakSet<object>,
): unknown {
  const childPath = [...path, key.toLowerCase()]
  return isRedacted(rules, childPath)
    ? REDACTED
    : walk(value, rules, childPath, ancestors)
}

function walkEntries(
  entries: Iterable<[string, unknown]>,
  rules: IRedactRules,
  path: string[],
  ancestors: WeakSet<object>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of entries) {
    // defineProperty keeps a "__proto__" key as data instead of setting the prototype
    Object.defineProperty(out, k, {
      value: walkChild(k, v, rules, path, ancestors),
      enumerable: true,
      writable: true,
      configurable: true,
    })
  }
  return out
}

function walkArray(
  values: unknown[],
  rules: IRedactRules,
  path: string[],
  ancestors: WeakSet<object>,
): unknown[] {
  return values.map((v, i) => walkChild(String(i), v, rules, path, ancestors))
}

function walk(
  value: unknown,
  rules: IRedactRules,
  path: string[],
  ancestors: WeakSet<object>,
): unknown {
  if (typeof value === "string") {
    return rules.redactString ? rules.redactString(value) : value
  }
  if (value === null || typeof value !== "object") return value
  if (ancestors.has(value)) return "[Circular]"
  if (rules.maxDepth !== undefined && path.length > rules.maxDepth) {
    return "[MaxDepth]"
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString()
  }
  if (value instanceof RegExp) return String(value)

  ancestors.add(value)
  try {
    if (Array.isArray(value)) return walkArray(value, rules, path, ancestors)
    if (value instanceof Set) {
      return walkArray(Array.from(value), rules, path, ancestors)
    }
    if (value instanceof Map) {
      return walkEntries(
        Array.from(value, ([k, v]): [string, unknown] => [String(k), v]),
        rules,
        path,
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
      return walkEntries(entries, rules, path, ancestors)
    }
    const toJSON = (value as { toJSON?: unknown }).toJSON
    if (typeof toJSON === "function") {
      return walk(toJSON.call(value), rules, path, ancestors)
    }
    return walkEntries(Object.entries(value), rules, path, ancestors)
  } finally {
    ancestors.delete(value)
  }
}
