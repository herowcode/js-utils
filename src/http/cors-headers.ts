import { herowError } from "../errors/herow-error"

export type TCorsOrigin =
  | "*"
  | string
  | string[]
  | ((origin: string) => boolean)

export interface ICorsOptions {
  /** Required: `"*"`, one origin, an allowlist or a predicate. Matching is exact and case-sensitive. */
  origin: TCorsOrigin
  /** Sent as `Access-Control-Allow-Methods`. */
  methods?: string[]
  /** Sent as `Access-Control-Allow-Headers`; `preflight` echoes the requested ones when unset. */
  headers?: string[]
  /** Sends `Access-Control-Allow-Credentials: true`; not allowed with `origin: "*"`. */
  credentials?: boolean
  /** Preflight cache lifetime in seconds (`Access-Control-Max-Age`). */
  maxAge?: number
}

function isAllowed(origin: TCorsOrigin, requestOrigin: string): boolean {
  if (typeof origin === "string") return origin === requestOrigin
  if (typeof origin === "function") return origin(requestOrigin) === true
  return origin.includes(requestOrigin)
}

/**
 * Builds CORS response headers for a request; an unmatched or missing `Origin` omits allow-origin instead of throwing.
 * @example const headers = corsHeaders(request, { origin: ["https://app.example.com"], credentials: true })
 */
export function corsHeaders(request: Request, options: ICorsOptions): Headers {
  const { origin, methods, headers, credentials = false, maxAge } = options
  if (credentials && origin === "*") {
    throw herowError(
      Error,
      "HEROW_CORS_CREDENTIALS_WILDCARD",
      'CORS option "credentials: true" cannot be combined with origin "*".',
      "Pass an explicit origin, an allowlist or a predicate instead of the wildcard.",
    )
  }
  const result = new Headers()
  if (origin === "*") {
    result.set("Access-Control-Allow-Origin", "*")
  } else {
    result.set("Vary", "Origin")
    const requestOrigin = request.headers.get("Origin")
    if (requestOrigin !== null && isAllowed(origin, requestOrigin)) {
      result.set("Access-Control-Allow-Origin", requestOrigin)
      if (credentials) result.set("Access-Control-Allow-Credentials", "true")
    }
  }
  if (methods?.length) {
    result.set("Access-Control-Allow-Methods", methods.join(", "))
  }
  if (headers?.length) {
    result.set("Access-Control-Allow-Headers", headers.join(", "))
  }
  if (maxAge !== undefined) result.set("Access-Control-Max-Age", String(maxAge))
  return result
}
