import { clampTimerDelay } from "./timer-delay"

/**
 * Resolves after `ms`; rejects with the signal's reason as soon as `signal` aborts.
 * @example await sleep(500, controller.signal)
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal?.reason)
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, clampTimerDelay(ms))
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}
