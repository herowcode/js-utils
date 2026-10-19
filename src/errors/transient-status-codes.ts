/** HTTP statuses worth retrying; the `/api` client builds its default `retry.statusCodes` from this list. */
export const TRANSIENT_STATUS_CODES: readonly number[] = [
  408, 429, 500, 502, 503, 504,
]
