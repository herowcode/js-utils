/**
 * Wraps `fn` so concurrent calls share one in-flight promise; a call after it settles starts fresh.
 * @example const refresh = createSingleFlight(() => refreshToken()); await Promise.all([refresh(), refresh()])
 */
export function createSingleFlight<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult | Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  let inFlight: Promise<TResult> | undefined

  return (...args) => {
    if (inFlight) return inFlight
    // Wrapping in a promise turns a synchronous throw into a rejection
    const current = new Promise<TResult>((resolve) => resolve(fn(...args)))
    inFlight = current
    // Registered before any caller's continuation, so the slot is free when waiters resume
    const clear = () => {
      if (inFlight === current) inFlight = undefined
    }
    current.then(clear, clear)
    return current
  }
}
