import { parseRetryAfterMs } from "../async/parse-retry-after-ms"
import { getErrorMessage } from "../errors/get-error-message"
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  HttpError,
  type IHttpErrorOptions,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "../errors/http-error"

export const EXCERPT_LENGTH = 200

export function excerpt(text: string): string {
  return text.slice(0, EXCERPT_LENGTH)
}

function parseJson(text: string): { value: unknown } | undefined {
  try {
    return { value: JSON.parse(text) }
  } catch {
    return undefined
  }
}

/** Internal: maps a non-2xx response and its body text to the matching HttpError subclass. */
export function httpErrorFromResponse(
  response: Response,
  text: string,
): HttpError {
  const { status } = response
  const parsed = text ? parseJson(text) : undefined
  const body = parsed?.value
  const code =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { code?: unknown }).code === "string"
      ? (body as { code: string }).code
      : undefined
  const options: IHttpErrorOptions = {
    code,
    details: parsed ? body : text ? excerpt(text) : undefined,
  }
  const message = getErrorMessage(body, { fallback: `HTTP ${status}` })
  switch (status) {
    case 400:
      return new BadRequestError(message, options)
    case 401:
      return new UnauthorizedError(message, options)
    case 403:
      return new ForbiddenError(message, options)
    case 404:
      return new NotFoundError(message, options)
    case 409:
      return new ConflictError(message, options)
    case 429: {
      const ms = parseRetryAfterMs(response.headers.get("Retry-After"))
      return new TooManyRequestsError(message, {
        ...options,
        retryAfterSeconds: ms === undefined ? undefined : Math.ceil(ms / 1000),
      })
    }
    default:
      return new HttpError(status, message, options)
  }
}
