import { clampTimerDelay } from "./timer-delay"

function timeoutReason(): unknown {
  const message = "The operation timed out."
  if (typeof DOMException === "function") {
    return new DOMException(message, "TimeoutError")
  }
  return Object.assign(new Error(message), { name: "TimeoutError" })
}

// Runtimes without AbortSignal.any/timeout: merge by hand and release both sides on settle
function manualTimeout(
  signal: AbortSignal | null | undefined,
  timeoutMs: number,
): AbortSignal {
  const controller = new AbortController()
  if (signal?.aborted) {
    controller.abort(signal.reason)
    return controller.signal
  }
  const onAbort = () => {
    clearTimeout(timer)
    controller.abort(signal?.reason)
  }
  const timer = setTimeout(() => {
    signal?.removeEventListener("abort", onAbort)
    controller.abort(timeoutReason())
  }, clampTimerDelay(timeoutMs))
  signal?.addEventListener("abort", onAbort, { once: true })
  return controller.signal
}

/**
 * Combines an optional signal with a timeout; `timeoutMs` of 0, negative or non-finite means no timeout.
 * @example const signal = withTimeout(userSignal, 5000)
 */
export function withTimeout(
  signal: AbortSignal | null | undefined,
  timeoutMs: number | undefined,
): AbortSignal | null | undefined {
  if (
    timeoutMs === undefined ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  ) {
    return signal
  }
  const ms = Math.ceil(timeoutMs)
  const native =
    typeof AbortSignal.timeout === "function" &&
    (!signal || typeof AbortSignal.any === "function")
  if (!native) return manualTimeout(signal, ms)
  const timeoutSignal = AbortSignal.timeout(ms)
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
}
