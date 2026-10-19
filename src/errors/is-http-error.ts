import type { HttpError } from "./http-error"
import { HTTP_ERROR_BRAND } from "./http-error-brand"

/**
 * True for an `HttpError` (or subclass) even when it comes from another copy or bundle of this package.
 * @example if (isHttpError(err)) console.log(err.status)
 */
export function isHttpError(value: unknown): value is HttpError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<symbol, unknown>)[HTTP_ERROR_BRAND] === "string" &&
    typeof (value as { status?: unknown }).status === "number"
  )
}
