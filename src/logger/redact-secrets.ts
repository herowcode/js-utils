import { escapeRegExp } from "../string/escape-reg-exp"
import { DEFAULT_REDACT_KEYS, REDACTED } from "./redact"

export type TSecretPattern = RegExp | string

export interface IRedactSecretsOptions {
  /** Extra patterns whose matches are replaced entirely; strings match literally. */
  extraPatterns?: readonly TSecretPattern[]
}

const KEY_SPELLINGS: Record<string, string> = {
  apikey: "api[_-]?key",
  xapikey: "x[_-]?api[_-]?key",
  privatekey: "private[_-]?key",
  setcookie: "set[_-]?cookie",
}
const KEY_NAMES = Array.from(
  DEFAULT_REDACT_KEYS,
  (key) => KEY_SPELLINGS[key] ?? key,
).join("|")

// Lookbehinds anchor patterns to token starts and the key prefix is bounded, so scans stay linear on adversarial input
const KEY_VALUE = new RegExp(
  `(?<![\\w-])([\\w-]{0,40}(?:${KEY_NAMES}))(["']?\\s*[:=]\\s*)(?:(?:bearer|basic)\\s+)?("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|[^\\s,&}"']+)`,
  "gi",
)
const AUTHORIZATION =
  /(?<![\w-])([\w-]{0,40}authorization["']?\s*[:=]\s*)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|(?:[a-z][\w-]*[ \t]+)?[^\s,&}"']+)/gi
const URL_PASSWORD = /(?<=:\/\/[^\s:@/]*:)[^\s@/]+(?=@)/g
const COOKIE_HEADER = /(?<![A-Za-z0-9])(cookie\s*:\s*)[^\r\n]+/gi
const BEARER = /(?<![\w-])(bearer\s+)[\w.~+/=-]+/gi
const JWT = /(?<![\w-])eyJ[\w-]{4,}\.[\w-]{4,}\.[\w-]*/g
const KEY_PREFIXES =
  /(?<![\w-])(?:sk-[\w-]{16,}|(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_\w{20,}|xox[abprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|AIza[\w-]{35,})/g

function keepQuote(prefix: string, value: string): string {
  const quote = value[0] === '"' || value[0] === "'" ? value[0] : ""
  return `${prefix}${quote}${REDACTED}${quote}`
}

function toGlobal(pattern: TSecretPattern): RegExp {
  if (typeof pattern === "string") return new RegExp(escapeRegExp(pattern), "g")
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
      .replace(URL_PASSWORD, REDACTED)
      .replace(AUTHORIZATION, (_m, head: string, value: string) =>
        keepQuote(head, value),
      )
      .replace(KEY_VALUE, (_m, key: string, sep: string, value: string) =>
        keepQuote(key + sep, value),
      )
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
