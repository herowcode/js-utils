import { walkCause } from "./walk-cause"

const TRANSIENT_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "EAI_AGAIN",
  "ENOTFOUND",
  "UND_ERR_SOCKET",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
])

// Browsers throw a bare TypeError with no cause; these are their network-failure messages
const BROWSER_FETCH_MESSAGES = new Set([
  "Failed to fetch",
  "NetworkError when attempting to fetch resource.",
  "Load failed",
])

export interface IIsTransientNetworkErrorOptions {
  /** Also treat `AbortError` / `TimeoutError` as transient. Defaults to false. */
  includeTimeouts?: boolean
}

function read(link: object, key: "name" | "code" | "message" | "cause") {
  return (link as Record<string, unknown>)[key]
}

/**
 * True for connection-level failures (reset, refused, DNS, socket) found anywhere in the `cause` chain.
 * @example isTransientNetworkError(Object.assign(new Error("x"), { code: "ECONNRESET" })) // true
 */
export function isTransientNetworkError(
  err: unknown,
  { includeTimeouts = false }: IIsTransientNetworkErrorOptions = {},
): boolean {
  for (const link of walkCause(err)) {
    if (typeof link !== "object" || link === null) continue

    const code = read(link, "code")
    if (typeof code === "string" && TRANSIENT_CODES.has(code)) return true

    const name = read(link, "name")
    if (includeTimeouts && (name === "AbortError" || name === "TimeoutError")) {
      return true
    }

    // With a cause (Node/undici) the cause's code decides, so the message alone never counts
    if (
      name === "TypeError" &&
      read(link, "cause") === undefined &&
      BROWSER_FETCH_MESSAGES.has(String(read(link, "message")))
    ) {
      return true
    }
  }
  return false
}
