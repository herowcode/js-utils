import { isBrowser } from "./is-browser"

/**
 * True when there is no DOM (Node, edge workers, SSR).
 * @example if (isServer()) return null
 */
export function isServer(): boolean {
  return !isBrowser()
}
