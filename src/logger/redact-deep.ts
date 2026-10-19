import { compileRedactRules, redactWith } from "./redact"
import { createSecretRedactor, type TSecretPattern } from "./redact-secrets"

export interface IRedactDeepOptions {
  /** Extra keys or paths to redact, same syntax as the logger's `redact` option. */
  keys?: readonly string[]
  /** Extra patterns applied to string values (see `redactSecrets`). */
  patterns?: readonly TSecretPattern[]
  /** Objects nested deeper than this become "[MaxDepth]". Default `8`. */
  maxDepth?: number
}

/**
 * Returns a copy of `value` with secret keys masked and secrets inside strings scrubbed.
 * @example redactDeep({ user: "a", password: "x" }) // { user: "a", password: "[REDACTED]" }
 */
export function redactDeep<T>(
  value: T,
  { keys, patterns, maxDepth = 8 }: IRedactDeepOptions = {},
): T {
  return redactWith(value, {
    ...compileRedactRules(keys),
    maxDepth,
    redactString: createSecretRedactor(patterns),
  })
}
