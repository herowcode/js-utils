import type { AxiosError } from "axios"
import { isAxiosError } from "axios"
import type { TTryCatchResult } from "../function"

// Define a richer error type to capture more information
export interface IApiError {
  message: string
  status?: number
  code?: string
  details?: unknown
  path?: string
  timestamp?: string
}

/**
 * Extracts error properties from Axios errors
 */
async function extractAxiosErrorDetails(error: AxiosError): Promise<IApiError> {
  const errorObj: IApiError = {
    message: error.message || "Axios Error",
    status: error.response?.status,
    path: error.config?.url,
  }

  if (error.response?.data && typeof error.response.data === "object") {
    return await enrichErrorWithData(
      errorObj,
      Promise.resolve(error.response.data as Record<string, unknown>),
    )
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

  // Capture any custom properties the error might have
  const extendedError = error as ExtendedError
  if (extendedError.code) errorObj.code = String(extendedError.code)
  if (extendedError.status) errorObj.status = Number(extendedError.status)
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
    const clonedResponse = response.clone()
    const errorData = await clonedResponse.json()

    // Directly enrich the error object with the parsed data
    if (errorData && typeof errorData === "object") {
      if ("message" in errorData && errorData.message) {
        errorObj.message = String(errorData.message)
      }

      if ("code" in errorData) {
        errorObj.code = String(errorData.code)
      }

      if ("details" in errorData) {
        errorObj.details = errorData.details
      } else if ("issues" in errorData) {
        errorObj.details = errorData.issues
      }

      if ("timestamp" in errorData) {
        errorObj.timestamp = String(errorData.timestamp)
      }
    }

    return errorObj
  } catch {
    // If JSON parsing fails, return the basic error object
    return errorObj
  }
}

/**
 * Enriches an error object with additional data from response
 */
async function enrichErrorWithData(
  errorObj: IApiError,
  errorData: Promise<Record<string, unknown>>,
  path?: string,
): Promise<IApiError> {
  const data = await errorData

  if (data) {
    if ("message" in data) {
      errorObj.message = String(data.message)
    }

    if ("code" in data) {
      errorObj.code = String(data.code)
    }

    if ("details" in data) {
      errorObj.details = data.details
    } else if ("issues" in data) {
      errorObj.details = data.issues
    }

    if ("timestamp" in data) {
      errorObj.timestamp = String(data.timestamp)
    }

    if (path) {
      errorObj.path = path
    }
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

  if (isAxiosError(error)) {
    return extractAxiosErrorDetails(error)
  }

  if (error instanceof Error) {
    return extractStandardErrorDetails(error)
  }

  // Handle unknown error types
  return {
    message: error ? JSON.stringify(error) : "Unknown error",
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
