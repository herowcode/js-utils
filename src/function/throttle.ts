export interface IThrottleOptions {
  /** Invoke on the first call of a window; default true. */
  leading?: boolean
  /** Invoke once more at the window end with the last arguments; default true. */
  trailing?: boolean
}

/**
 * Creates a throttled function that only invokes func at most once per every delay milliseconds
 * @param fn - The function to throttle
 * @param delay - The number of milliseconds to throttle invocations to
 * @param options - `leading` and `trailing` edges, both true by default
 * @returns The throttled function
 * @example
 * const onScroll = throttle(update, 100, { trailing: false })
 */
export function throttle<A extends unknown[]>(
  fn: (...args: A) => unknown,
  delay: number,
  options?: IThrottleOptions,
): (...args: A) => void {
  if (typeof fn !== "function") {
    throw new Error("First argument must be a function")
  }

  if (typeof delay !== "number" || delay < 0) {
    throw new Error("Delay must be a non-negative number")
  }

  const leading = options?.leading ?? true
  const trailing = options?.trailing ?? true

  if (!leading && !trailing) {
    throw new Error("At least one of leading or trailing must be enabled")
  }

  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return function (this: unknown, ...args: A) {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      if (leading) {
        fn.apply(this, args)
        return
      }
    }

    if (!trailing) return
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(
      () => {
        lastCall = Date.now()
        fn.apply(this, args)
      },
      delay - (now - lastCall),
    )
  }
}
