import { herowError } from "../errors/herow-error"
import { HttpError } from "../errors/http-error"
import {
  fetchWithTimeout,
  type IFetchWithTimeoutOptions,
} from "./fetch-with-timeout"
import { excerpt, httpErrorFromResponse } from "./http-error-from-response"

/**
 * Fetches JSON and throws an `HttpError` for non-2xx responses or an unparseable body; 204 and empty bodies give `undefined`.
 * @example const user = await fetchJson<User>("/api/me", undefined, { timeoutMs: 5000 })
 */
export async function fetchJson<T = unknown>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: IFetchWithTimeoutOptions = {},
): Promise<T | undefined> {
  const headers = new Headers(init.headers)
  if (!headers.has("Accept")) headers.set("Accept", "application/json")
  const response = await fetchWithTimeout(input, { ...init, headers }, options)
  if (response.status === 204 || response.status === 205) return undefined
  const text = await response.text()
  if (!response.ok) throw httpErrorFromResponse(response, text)
  if (text.trim() === "") return undefined
  try {
    return JSON.parse(text) as T
  } catch (cause) {
    const { message } = herowError(
      Error,
      "HEROW_INVALID_JSON",
      `The ${response.status} response body is not valid JSON.`,
      "Check that the endpoint returns JSON (an HTML error page is a common cause); details.body holds the first 200 characters.",
    )
    throw new HttpError(response.status, message, {
      code: "HEROW_INVALID_JSON",
      details: { body: excerpt(text) },
      cause,
    })
  }
}
