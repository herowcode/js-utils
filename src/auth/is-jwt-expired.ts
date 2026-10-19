import { getJWTExp } from "./get-jwt-exp"

/**
 * True when the unverified `exp` has passed; fails closed (true) for malformed tokens or a missing `exp`.
 * @example if (isJWTExpired(token)) redirectToLogin()
 */
export function isJWTExpired(token: string): boolean {
  const exp = getJWTExp(token)
  return exp === null || exp * 1000 <= Date.now()
}
