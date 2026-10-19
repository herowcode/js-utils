import { withTimeout } from "../async/with-timeout"

export interface IFetchWithTimeoutOptions {
  /** Aborts with a `TimeoutError` after this many milliseconds; 0 or unset means no timeout. */
  timeoutMs?: number
}

/**
 * `fetch` that also aborts after `timeoutMs`, keeping any `signal` you pass in `init`.
 * @example const res = await fetchWithTimeout(url, { method: "POST" }, { timeoutMs: 5000 })
 */
export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  { timeoutMs }: IFetchWithTimeoutOptions = {},
): Promise<Response> {
  const signal = withTimeout(init.signal, timeoutMs)
  return fetch(input, signal === init.signal ? init : { ...init, signal })
}
