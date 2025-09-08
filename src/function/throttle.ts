type TAnyFunction = (...args: unknown[]) => unknown

/**
 * Creates a throttled function that only invokes func at most once per every delay milliseconds
 * @param fn - The function to throttle
 * @param delay - The number of milliseconds to throttle invocations to
 * @returns The throttled function
 */
export function throttle<T extends TAnyFunction>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  if (typeof fn !== "function") {
    throw new Error("First argument must be a function")
  }

  if (typeof delay !== "number" || delay < 0) {
    throw new Error("Delay must be a non-negative number")
  }

  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      fn.apply(this, args)
    } else {
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
}
