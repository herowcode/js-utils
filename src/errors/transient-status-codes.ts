/**
 * HTTP statuses worth retrying; the `/api` client builds its default `retry.statusCodes` from this list.
 * @example TRANSIENT_STATUS_CODES.includes(503) // true
 */
export const TRANSIENT_STATUS_CODES: readonly number[] = [
  408, 429, 500, 502, 503, 504,
]
