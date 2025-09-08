type TAnyFunction = (...args: unknown[]) => unknown

/**
 * Creates a debounced function that delays invoking func until after delay milliseconds
 * have elapsed since the last time the debounced function was invoked
 * @param fn - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns The debounced function
 */
export function debounce<T extends TAnyFunction>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  if (typeof fn !== "function") {
    throw new Error("First argument must be a function")
  }

  if (typeof delay !== "number" || delay < 0) {
    throw new Error("Delay must be a non-negative number")
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}
