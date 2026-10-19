import { decodeJWT } from "./decode-jwt"

/**
 * Reads the `exp` claim (seconds since epoch) without verifying the signature; null when missing or not a number.
 * @example getJWTExp(token) // 1767225600
 */
export function getJWTExp(token: string): number | null {
  const exp = decodeJWT(token)?.exp
  return typeof exp === "number" && Number.isFinite(exp) ? exp : null
}
