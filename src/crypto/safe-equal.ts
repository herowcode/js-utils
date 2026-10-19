import { utf8 } from "./encoding"

/**
 * Synchronous constant-time string comparison; a length mismatch is folded into the result.
 * @example if (safeEqual(providedToken, expectedToken)) grantAccess()
 */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false
  const left = utf8(a)
  const right = utf8(b)
  const length = Math.max(left.length, right.length)
  let diff = left.length ^ right.length
  for (let i = 0; i < length; i++) {
    diff |= (i < left.length ? left[i] : 0) ^ (i < right.length ? right[i] : 0)
  }
  return diff === 0
}
