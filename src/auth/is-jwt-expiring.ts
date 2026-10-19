import { getJWTExp } from "./get-jwt-exp"

export interface IIsJWTExpiringOptions {
  /** Seconds before `exp` that already count as expiring. Defaults to 30. */
  marginSeconds?: number
}

/**
 * True when the unverified `exp` is within `marginSeconds` (default 30); fails closed (true) for malformed tokens.
 * @example if (isJWTExpiring(token, { marginSeconds: 60 })) await refresh()
 */
export function isJWTExpiring(
  token: string,
  { marginSeconds = 30 }: IIsJWTExpiringOptions = {},
): boolean {
  const exp = getJWTExp(token)
  if (exp === null) return true
  const margin = Number.isFinite(marginSeconds)
    ? Math.max(marginSeconds, 0)
    : 30
  return exp * 1000 - margin * 1000 <= Date.now()
}
