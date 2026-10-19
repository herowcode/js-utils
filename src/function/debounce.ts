export type TDebounced<A extends unknown[]> = ((...args: A) => void) & {
  /** Drops the pending call, if any. */
  cancel(): void
  /** Runs the pending call now; no-op when none is pending. */
  flush(): void
}

/**
 * Creates a debounced function that delays invoking func until after delay milliseconds
 * have elapsed since the last time the debounced function was invoked
 * @param fn - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns The debounced function, with `cancel()` and `flush()`
 * @example
 * const save = debounce(persist, 300)
 * save(draft)
 * save.flush() // persist(draft) now, e.g. before navigating away
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => unknown,
  delay: number,
): TDebounced<A> {
  if (typeof fn !== "function") {
    throw new Error("First argument must be a function")
  }

  if (typeof delay !== "number" || delay < 0) {
    throw new Error("Delay must be a non-negative number")
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let pending: (() => void) | undefined

  const debounced = function (this: unknown, ...args: A) {
    clearTimeout(timeoutId)
    pending = () => {
      pending = undefined
      fn.apply(this, args)
    }
    timeoutId = setTimeout(pending, delay)
  } as TDebounced<A>

  debounced.cancel = () => {
    clearTimeout(timeoutId)
    pending = undefined
  }

  debounced.flush = () => {
    clearTimeout(timeoutId)
    pending?.()
  }

  return debounced
}
