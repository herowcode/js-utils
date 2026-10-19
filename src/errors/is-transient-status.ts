import { TRANSIENT_STATUS_CODES } from "./transient-status-codes"

/**
 * True for 408, 429, 500, 502, 503 and 504.
 * @example isTransientStatus(503) // true
 */
export function isTransientStatus(status: unknown): boolean {
  return typeof status === "number" && TRANSIENT_STATUS_CODES.includes(status)
}
