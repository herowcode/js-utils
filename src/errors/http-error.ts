import { herowError } from "./herow-error"
import { HTTP_ERROR_BRAND } from "./http-error-brand"
import { isHttpError } from "./is-http-error"

export interface IHttpErrorOptions {
  /** Machine-readable code, e.g. the one the server sent. */
  code?: string
  /** Extra payload, e.g. validation issues. */
  details?: unknown
  cause?: unknown
  /** Seconds to wait before retrying (429/503); `retry` honours it. Negative or non-finite values are ignored. */
  retryAfterSeconds?: number
}

/**
 * Error carrying an HTTP `status` (integer 100-599, else `HEROW_HTTP_INVALID_STATUS`); `instanceof` and `isHttpError` also work across CJS/ESM copies.
 * @example throw new HttpError(502, "Bad gateway", { code: "UPSTREAM_DOWN" })
 */
export class HttpError extends Error {
  static readonly kind: string = "HttpError"

  // Matches by brand so a CJS copy and an ESM copy of this class recognise each other
  static [Symbol.hasInstance](value: unknown): boolean {
    // biome-ignore lint/complexity/noThisInStatic: subclasses inherit this method and need their own constructor
    const target = this as typeof HttpError
    if (Function.prototype[Symbol.hasInstance].call(target, value)) return true
    if (!isHttpError(value)) return false
    if (target === HttpError) return true
    return (
      Object.hasOwn(target, "kind") &&
      (value as unknown as Record<symbol, unknown>)[HTTP_ERROR_BRAND] ===
        target.kind
    )
  }

  override readonly name: string = "HttpError"
  readonly status: number
  readonly code?: string
  readonly details?: unknown
  readonly retryAfterSeconds?: number

  constructor(
    status: number,
    message = `HTTP ${status}`,
    { code, details, cause, retryAfterSeconds }: IHttpErrorOptions = {},
  ) {
    if (!Number.isInteger(status) || status < 100 || status > 599) {
      throw herowError(
        RangeError,
        "HEROW_HTTP_INVALID_STATUS",
        "HttpError received an invalid status (expected an integer from 100 to 599).",
        "Pass a real HTTP status code.",
      )
    }
    super(message, cause === undefined ? undefined : { cause })
    this.status = status
    if (code !== undefined) this.code = code
    if (details !== undefined) this.details = details
    if (
      typeof retryAfterSeconds === "number" &&
      Number.isFinite(retryAfterSeconds) &&
      retryAfterSeconds >= 0
    ) {
      this.retryAfterSeconds = retryAfterSeconds
    }
  }

  get [HTTP_ERROR_BRAND](): string {
    return (this.constructor as typeof HttpError).kind
  }
}

/**
 * HTTP 400.
 * @example throw new BadRequestError("Invalid email", { details: { field: "email" } })
 */
export class BadRequestError extends HttpError {
  static override readonly kind = "BadRequestError"
  override readonly name = "BadRequestError"
  constructor(message = "Bad Request", options?: IHttpErrorOptions) {
    super(400, message, options)
  }
}

/**
 * HTTP 401.
 * @example throw new UnauthorizedError()
 */
export class UnauthorizedError extends HttpError {
  static override readonly kind = "UnauthorizedError"
  override readonly name = "UnauthorizedError"
  constructor(message = "Unauthorized", options?: IHttpErrorOptions) {
    super(401, message, options)
  }
}

/**
 * HTTP 403.
 * @example throw new ForbiddenError("Admins only")
 */
export class ForbiddenError extends HttpError {
  static override readonly kind = "ForbiddenError"
  override readonly name = "ForbiddenError"
  constructor(message = "Forbidden", options?: IHttpErrorOptions) {
    super(403, message, options)
  }
}

/**
 * HTTP 404.
 * @example throw new NotFoundError("User not found")
 */
export class NotFoundError extends HttpError {
  static override readonly kind = "NotFoundError"
  override readonly name = "NotFoundError"
  constructor(message = "Not Found", options?: IHttpErrorOptions) {
    super(404, message, options)
  }
}

/**
 * HTTP 409.
 * @example throw new ConflictError("Email already registered")
 */
export class ConflictError extends HttpError {
  static override readonly kind = "ConflictError"
  override readonly name = "ConflictError"
  constructor(message = "Conflict", options?: IHttpErrorOptions) {
    super(409, message, options)
  }
}

/**
 * HTTP 429 with an optional `retryAfterSeconds`.
 * @example throw new TooManyRequestsError("Slow down", { retryAfterSeconds: 30 })
 */
export class TooManyRequestsError extends HttpError {
  static override readonly kind = "TooManyRequestsError"
  override readonly name = "TooManyRequestsError"
  constructor(message = "Too Many Requests", options?: IHttpErrorOptions) {
    super(429, message, options)
  }
}
