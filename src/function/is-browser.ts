/**
 * True when running in a browser-like runtime (`window` and `document` exist).
 * @example if (isBrowser()) localStorage.clear()
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined"
}
