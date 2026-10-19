import { DEFAULT_REDACT_KEYS, REDACTED } from "./redact"

export type TSecretPattern = RegExp | string

export interface IRedactSecretsOptions {
  /** Extra patterns whose matches are replaced entirely; strings match literally. */
  extraPatterns?: readonly TSecretPattern[]
}

const KEY_NAMES = Array.from(DEFAULT_REDACT_KEYS, (key) =>
  key === "apikey" ? "api[_-]?key" : key,
).join("|")

// Lookbehinds keep every pattern anchored to token starts, so scans stay linear on adversarial input
const KEY_VALUE = new RegExp(
  `(?<![A-Za-z0-9])(${KEY_NAMES})(["']?\\s*[:=]\\s*)(?:(?:bearer|basic)\\s+)?("[^"]*"|'[^']*'|[^\\s,&}"']+)`,
  "gi",
)
const COOKIE_HEADER = /(?<![A-Za-z0-9])(cookie\s*:\s*)[^\r\n]+/gi
const BEARER = /(?<![\w-])(bearer\s+)[\w.~+/=-]+/gi
const JWT = /(?<![\w-])eyJ[\w-]{4,}\.[\w-]{4,}\.[\w-]*/g
const KEY_PREFIXES =
  /(?<![\w-])(?:sk-[\w-]{16,}|(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_\w{20,}|xox[abprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|AIza[\w-]{35,})/g

function escapeLiteral(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function toGlobal(pattern: TSecretPattern): RegExp {
  if (typeof pattern === "string")
    return new RegExp(escapeLiteral(pattern), "g")
  return pattern.global
    ? pattern
    : new RegExp(pattern.source, `${pattern.flags}g`)
}

export function createSecretRedactor(
  extraPatterns: readonly TSecretPattern[] = [],
): (text: string) => string {
  const extras = extraPatterns.filter((p) => p !== "").map(toGlobal)
  return (text) => {
    let out = text
      .replace(COOKIE_HEADER, `$1${REDACTED}`)
      .replace(KEY_VALUE, (_m, key: string, sep: string, value: string) => {
        const quote = value[0] === '"' || value[0] === "'" ? value[0] : ""
        return `${key}${sep}${quote}${REDACTED}${quote}`
      })
      .replace(BEARER, `$1${REDACTED}`)
      .replace(JWT, REDACTED)
      .replace(KEY_PREFIXES, REDACTED)
    for (const pattern of extras) out = out.replace(pattern, REDACTED)
    return out
  }
}

/**
 * Masks bearer tokens, JWTs, `key=value` secrets and common API-key prefixes in free text.
 * @example redactSecrets("Authorization: Bearer abc.def") // "Authorization: [REDACTED]"
 */
export function redactSecrets(
  text: string,
  { extraPatterns }: IRedactSecretsOptions = {},
): string {
  return typeof text === "string"
    ? createSecretRedactor(extraPatterns)(text)
    : ""
}
