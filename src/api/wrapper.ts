import type { TTryCatchResult } from "../function"

// Define a richer error type to capture more information
export interface IApiError {
  message: string
  /** The thrown error's `name` when it is not a plain `Error`, e.g. "TimeoutError" or "AbortError". */
  name?: string
  status?: number
  code?: string
  details?: unknown
  path?: string
  timestamp?: string
}

const MAX_TEXT_LENGTH = 200

interface IAxiosLikeError {
  isAxiosError: true
  message?: string
  config?: { url?: string }
  response?: { status?: number; data?: unknown }
}

function isAxiosLikeError(error: unknown): error is IAxiosLikeError {
  return (
    (error as { isAxiosError?: unknown } | null | undefined)?.isAxiosError ===
    true
  )
}

function truncate(text: string): string {
  return text.length > MAX_TEXT_LENGTH
    ? `${text.slice(0, MAX_TEXT_LENGTH)}...`
    : text
}

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null
}

function applyErrorData(
  errorObj: IApiError,
  data: Record<string, unknown>,
): void {
  const { message } = data
  if (
    (typeof message === "string" && message !== "") ||
    typeof message === "number"
  ) {
    errorObj.message = String(message)
  }

  if (isPresent(data.code)) errorObj.code = String(data.code)

  if ("details" in data) {
    errorObj.details = data.details
  } else if ("issues" in data) {
    errorObj.details = data.issues
  }

  if (isPresent(data.timestamp)) errorObj.timestamp = String(data.timestamp)
}

function extractAxiosErrorDetails(error: IAxiosLikeError): IApiError {
  const errorObj: IApiError = {
    message: error.message || "Axios Error",
    status: error.response?.status,
    path: error.config?.url,
  }

  const data = error.response?.data
  if (data && typeof data === "object") {
    applyErrorData(errorObj, data as Record<string, unknown>)
  }

  return errorObj
}

/**
 * Define extended error type with potential custom properties
 */
interface ExtendedError extends Error {
  code?: string | number
  status?: string | number
  details?: unknown
}

/**
 * Extracts error properties from standard Error objects
 */
function extractStandardErrorDetails(error: Error): IApiError {
  const errorObj: IApiError = {
    message: error.message,
  }
  if (error.name && error.name !== "Error") errorObj.name = error.name

  // Capture any custom properties the error might have
  const extendedError = error as ExtendedError
  if (isPresent(extendedError.code)) errorObj.code = String(extendedError.code)
  if (isPresent(extendedError.status)) {
    const status = Number(extendedError.status)
    if (!Number.isNaN(status)) errorObj.status = status
  }
  if (extendedError.details) errorObj.details = extendedError.details

  return errorObj
}

/**
 * Extracts error properties from fetch Response objects
 */
async function extractResponseErrorDetails(
  response: Response,
): Promise<IApiError> {
  const errorObj: IApiError = {
    message: `HTTP Error ${response.status}: ${response.statusText}`,
    status: response.status,
    path: response.url,
  }

  try {
    // Clone the response to avoid consuming the body stream
    const errorData = await response.clone().json()

    if (errorData && typeof errorData === "object") {
      applyErrorData(errorObj, errorData as Record<string, unknown>)
    }
    return errorObj
  } catch {
    // Not JSON: fall back to a snippet of the raw text
  }

  try {
    const text = (await response.clone().text()).trim()
    if (text) {
      errorObj.message = truncate(text)
      errorObj.details = truncate(text)
    }
  } catch {
    // Body unreadable: keep the basic error object
  }
  return errorObj
}

/**
 * Determines the type of error and routes to appropriate handler
 */
async function processError(error: unknown): Promise<IApiError> {
  if (error instanceof Response) {
    return extractResponseErrorDetails(error)
  }

  if (isAxiosLikeError(error)) {
    return extractAxiosErrorDetails(error)
  }

  // DOMException is not an Error subclass in every runtime (e.g. jsdom)
  if (
    error instanceof Error ||
    (typeof DOMException !== "undefined" && error instanceof DOMException)
  ) {
    return extractStandardErrorDetails(error as Error)
  }

  // Handle unknown error types
  if (!error) return { message: "Unknown error" }
  try {
    return { message: JSON.stringify(error) ?? String(error) }
  } catch {
    return { message: String(error) }
  }
}

/**
 * Wraps API calls with standardized error handling
 *
 * @param apiCall - The API call function to execute
 * @param defaultData - Optional default value to return when an error occurs
 * @returns A standardized result object with data or formatted error message
 *
 * @example
 * // Basic usage
 * const result = await apiWrapper(() => fetchUserData(userId));
 *
 * @example
 * // With default data value
 * const result = await apiWrapper(() => fetchPosts(), []);
 * // result.data will be [] instead of null on error
 */
export async function apiWrapper<T, D = null>(
  apiCall: () => Promise<T>,
  defaultData?: D,
): Promise<TTryCatchResult<T, IApiError, D extends null ? null : D>> {
  try {
    const data = await apiCall()
    return {
      data,
      error: null,
    } as { data: T; error: null }
  } catch (error) {
    const errorObj = await processError(error)
    return {
      data: (defaultData ?? null) as D extends null ? null : D,
      error: errorObj,
    }
  }
}
