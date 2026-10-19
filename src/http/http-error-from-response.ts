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

export const MAX_ERROR_BODY_BYTES = 64 * 1024

/** Internal: reads at most `MAX_ERROR_BODY_BYTES` of the body, then cancels the stream. */
export async function readCappedText(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return (await response.text()).slice(0, MAX_ERROR_BODY_BYTES)
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < MAX_ERROR_BODY_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    size += value.byteLength
  }
  await reader.cancel().catch(() => undefined)
  const bytes = new Uint8Array(Math.min(size, MAX_ERROR_BODY_BYTES))
  let offset = 0
  for (const chunk of chunks) {
    const part = chunk.subarray(0, bytes.length - offset)
    bytes.set(part, offset)
    offset += part.byteLength
  }
  return new TextDecoder().decode(bytes)
}

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

function withRetryAfter(
  response: Response,
  options: IHttpErrorOptions,
): IHttpErrorOptions {
  const ms = parseRetryAfterMs(response.headers.get("Retry-After"))
  return {
    ...options,
    retryAfterSeconds: ms === undefined ? undefined : Math.ceil(ms / 1000),
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
    case 429:
      return new TooManyRequestsError(
        message,
        withRetryAfter(response, options),
      )
    default:
      return new HttpError(
        status,
        message,
        status === 503 ? withRetryAfter(response, options) : options,
      )
  }
}
