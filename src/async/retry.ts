import {
  getErrorStatus,
  isTransientNetworkError,
  isTransientStatus,
} from "../errors"
import { backoffDelay } from "./backoff-delay"
import { parseRetryAfterMs } from "./parse-retry-after-ms"
import { sleep } from "./sleep"
import { MAX_TIMER_DELAY } from "./timer-delay"

export interface IAsyncRetryOptions {
  /** Total tries, first call included. Defaults to 3. */
  attempts?: number
  /** Base backoff in ms. Defaults to 100. */
  baseMs?: number
  /** Backoff cap in ms. Defaults to 3000. */
  maxMs?: number
  /** Longest Retry-After in ms to honour; longer values are capped. Defaults to 30000. */
  maxRetryAfterMs?: number
  /** Defaults to transient network errors and transient HTTP statuses only. */
  shouldRetry?: (error: unknown, attempt: number) => boolean
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void
  signal?: AbortSignal
}

function isAbortError(error: unknown): boolean {
  return (error as { name?: unknown } | null | undefined)?.name === "AbortError"
}

function retryAfterMs(error: unknown): number | undefined {
  const source = error as {
    retryAfterSeconds?: unknown
    headers?: { get?: (name: string) => string | null }
    response?: { headers?: { get?: (name: string) => string | null } }
  } | null
  if (typeof source !== "object" || source === null) return undefined
  const seconds = source.retryAfterSeconds
  if (typeof seconds === "number" && Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000
  }
  const headers = source.headers ?? source.response?.headers
  return typeof headers?.get === "function"
    ? parseRetryAfterMs(headers.get("Retry-After"))
    : undefined
}

function defaultShouldRetry(error: unknown): boolean {
  return (
    isTransientNetworkError(error) || isTransientStatus(getErrorStatus(error))
  )
}

/**
 * Retries `fn` when it throws a transient error; AbortError is never retried and Retry-After wins over backoff.
 * @example const data = await retry(() => fetchJson(url), { attempts: 4 })
 */
export async function retry<T>(
  fn: (attempt: number) => T | Promise<T>,
  options: IAsyncRetryOptions = {},
): Promise<T> {
  const {
    attempts = 3,
    baseMs,
    maxMs,
    maxRetryAfterMs = 30_000,
    shouldRetry = defaultShouldRetry,
    onRetry,
    signal,
  } = options

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn(attempt)
    } catch (error) {
      if (
        attempt >= attempts ||
        isAbortError(error) ||
        signal?.aborted ||
        !shouldRetry(error, attempt)
      ) {
        throw error
      }
      const hinted = retryAfterMs(error)
      const delayMs =
        hinted === undefined
          ? backoffDelay(attempt, { baseMs, maxMs })
          : Math.min(hinted, maxRetryAfterMs, MAX_TIMER_DELAY)
      onRetry?.(error, attempt, delayMs)
      await sleep(delayMs, signal)
    }
  }
}
