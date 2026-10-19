import { buildQueryString, type TQueryParams } from "./build-query-string"
import { apiWrapper } from "./wrapper"

export interface IRetryOptions {
  limit?: number
  methods?: readonly string[]
  statusCodes?: readonly number[]
  backoffLimit?: number
  /** Longest Retry-After in ms to wait for; longer values are capped. */
  maxRetryAfter?: number
}

export interface ICustomRequestInit extends Omit<RequestInit, "body"> {
  json?: unknown
  params?: TQueryParams
  /** Total time in ms for the request, retries and backoff included. */
  timeout?: number
  retry?: IRetryOptions
}

const defaultRetryConfig: Required<IRetryOptions> = {
  limit: 5,
  methods: ["get", "head"],
  statusCodes: [408, 429, 500, 502, 503, 504],
  backoffLimit: 3000,
  maxRetryAfter: 10_000,
}

const MAX_RETRY_LIMIT = 10
// setTimeout fires immediately for delays above 2^31-1 ms
const MAX_TIMER_DELAY = 2 ** 31 - 1
const MAX_BODY_SNIPPET = 200

// Callbacks can't be cancelled, so stop waiting for them once the request aborts
function untilAborted<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason)
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason)
    signal.addEventListener("abort", onAbort, { once: true })
    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", onAbort)
    })
  })
}

async function beforeRequestHook(
  request: Request,
  sendCredentials: boolean,
  getAccessToken?: () => Promise<string | null>,
  getUserIP?: () => Promise<string | undefined>,
): Promise<Request> {
  if (!sendCredentials) return request

  const token = await untilAborted(
    Promise.resolve(getAccessToken?.()),
    request.signal,
  )
  const headers = new Headers(request.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const userIP = await untilAborted(
    Promise.resolve(getUserIP?.()),
    request.signal,
  )
  if (userIP) {
    headers.set("X-User-IP", userIP)
  }

  let body: string | undefined
  try {
    const cloned = request.clone()
    const text = await cloned.text()
    body = text === "" ? undefined : text
  } catch (_a) {
    body = undefined
  }

  return new Request(request, { headers, body })
}

async function afterResponseHook(
  request: Request,
  response: Response,
  sendCredentials: boolean,
  onSignoutUnauthorized?: (response: unknown) => void,
): Promise<void> {
  if (response.status !== 401 || !sendCredentials) return

  const possibleSignInPaths = ["signin", "sign-in", "login"]
  const { pathname } = new URL(request.url)
  if (possibleSignInPaths.some((path) => pathname.includes(path))) return

  let body: unknown = null
  try {
    body = await response.clone().json()
  } catch {
    body = null
  }

  try {
    await untilAborted(
      Promise.resolve(onSignoutUnauthorized?.(body)),
      request.signal,
    )
  } catch {
    // A failing or timed-out callback must not mask the original 401
  }
}

// Relative URLs (and an unset baseURL) resolve against the page, as browsers do.
function pageBase(): string | undefined {
  const location = (
    globalThis as { location?: { href?: string; origin?: string } }
  ).location
  return location?.href ?? location?.origin
}

function resolveUrl(url: string): URL | undefined {
  try {
    return new URL(url, pageBase())
  } catch {
    return undefined
  }
}

async function discardBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel()
  } catch {
    // Body already locked or consumed: nothing to release
  }
}

async function fetchWithRetry(
  request: Request,
  retry?: IRetryOptions,
): Promise<Response> {
  const limit = Math.min(
    Math.max(retry?.limit ?? defaultRetryConfig.limit, 1),
    MAX_RETRY_LIMIT,
  )
  const methods = (retry?.methods ?? defaultRetryConfig.methods).map((m) =>
    m.toLowerCase(),
  )
  const statusCodes = retry?.statusCodes ?? defaultRetryConfig.statusCodes
  const backoffLimit = retry?.backoffLimit ?? defaultRetryConfig.backoffLimit
  const maxRetryAfter = Math.min(
    Math.max(retry?.maxRetryAfter ?? defaultRetryConfig.maxRetryAfter, 0),
    MAX_TIMER_DELAY,
  )
  const retryable = methods.includes(request.method.toLowerCase())
  let attempt = 0

  while (true) {
    attempt++
    const canRetry = retryable && attempt < limit
    let response: Response
    try {
      // A Request body can only be read once, so each attempt needs its own copy
      response = await fetch(request.clone())
    } catch (error) {
      const aborted = (error as { name?: string } | null)?.name === "AbortError"
      if (!canRetry || aborted || request.signal.aborted) throw error
      await sleep(backoffDelay(attempt, backoffLimit), request.signal)
      continue
    }

    if (!canRetry || !statusCodes.includes(response.status)) return response

    const retryAfter = parseRetryAfter(response.headers.get("Retry-After"))

    await discardBody(response)
    await sleep(
      retryAfter === undefined
        ? backoffDelay(attempt, backoffLimit)
        : Math.min(retryAfter, maxRetryAfter),
      request.signal,
    )
  }
}

// Equal jitter: spreads concurrent retries without dropping below half the backoff
function backoffDelay(attempt: number, backoffLimit: number): number {
  const base = Math.min(2 ** attempt * 100, backoffLimit)
  return base / 2 + Math.random() * (base / 2)
}

function parseRetryAfter(value: string | null): number | undefined {
  if (value === null) return undefined
  const trimmed = value.trim()
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000
  // Date.parse accepts "1.5" or "-1" as dates; only real HTTP dates go through it
  if (/^[+-]?[\d.]+$/.test(trimmed)) return undefined
  const date = Date.parse(trimmed)
  if (Number.isNaN(date)) return undefined
  return Math.max(date - Date.now(), 0)
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    signal.addEventListener("abort", onAbort, { once: true })
  })
}

function withTimeout(
  signal: AbortSignal | null | undefined,
  timeout: number | undefined,
): AbortSignal | null | undefined {
  // 0, negative and non-finite values mean no timeout; 0 lets a request opt out of the client default
  if (timeout === undefined || !Number.isFinite(timeout) || timeout <= 0) {
    return signal
  }
  const timeoutSignal = AbortSignal.timeout(Math.ceil(timeout))
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
}

export type TApiClientProps = {
  baseURL?: string
  onSignoutUnauthorized?: (response?: unknown) => void
  getAccessToken?: () => Promise<string | null>
  getUserIP?: () => Promise<string | undefined>
  /** Default `timeout` in ms for every request; a per-request `timeout` wins. */
  timeout?: number
  /** Default `redirect` mode for every request; a per-request `redirect` wins. */
  redirect?: RequestRedirect
}

async function api<T>(
  config: TApiClientProps,
  endpoint: string,
  options: ICustomRequestInit = {},
): Promise<T> {
  const isAbsolute = /^https?:\/\//i.test(endpoint)
  if (!isAbsolute && !config.baseURL) {
    throw new Error(
      `apiClient: "baseURL" is required for the relative endpoint "${endpoint}"`,
    )
  }
  let url = isAbsolute
    ? endpoint
    : `${config.baseURL?.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`

  // Add query parameters if provided
  if (options.params) {
    const queryString = buildQueryString(options.params)
    url += queryString
  }

  // Apply default options
  const init: ICustomRequestInit = {
    credentials: "include",
    ...options,
  }
  const redirect = options.redirect ?? config.redirect
  if (redirect) init.redirect = redirect

  let body: RequestInit["body"]
  if (options.json !== undefined && options.json !== null) {
    body = JSON.stringify(options.json)
    // Only add Content-Type if body is not empty
    if (body && body !== "null" && body !== "undefined") {
      const headers = new Headers(init.headers)
      headers.set("Content-Type", "application/json")
      init.headers = headers
    }
  }

  // Remove Content-Type application/json if there's no body
  if (!body) {
    const headers = new Headers(init.headers)
    if (headers.get("Content-Type")?.toLowerCase() === "application/json") {
      headers.delete("Content-Type")
      init.headers = headers
    }
  }

  const target = resolveUrl(url)
  const signal = withTimeout(init.signal, options.timeout ?? config.timeout)
  let request = new Request(target?.href ?? url, { ...init, body, signal })

  const credentialOrigin = resolveUrl(config.baseURL ?? "")?.origin
  const sendCredentials =
    credentialOrigin !== undefined && credentialOrigin === target?.origin
  request = await beforeRequestHook(
    request,
    sendCredentials,
    config.getAccessToken,
    config.getUserIP,
  )

  // Execute request with retry logic
  const response = await fetchWithRetry(request, options.retry)

  // Run post-response hooks
  await afterResponseHook(
    request,
    response,
    sendCredentials,
    config.onSignoutUnauthorized,
  )

  if (!response.ok) {
    throw response
  }

  if (response.status === 204) {
    return null as T
  }
  const text = await response.text()
  if (!text) {
    return null as T
  }
  try {
    return JSON.parse(text)
  } catch (cause) {
    const snippet =
      text.length > MAX_BODY_SNIPPET
        ? `${text.slice(0, MAX_BODY_SNIPPET)}...`
        : text
    throw Object.assign(
      new Error(
        `Invalid JSON response (status ${response.status}) from ${url}: ${snippet}`,
        { cause },
      ),
      { status: response.status, url, body: snippet },
    )
  }
}

export const apiClient = (config?: TApiClientProps) => {
  const apiConfig: TApiClientProps = {
    ...config,
  }

  return {
    get: <T = unknown>(url: string, options?: ICustomRequestInit) =>
      apiWrapper(() => api<T>(apiConfig, url, options)),

    post: <T = unknown>(url: string, options?: ICustomRequestInit) =>
      apiWrapper(() => api<T>(apiConfig, url, { ...options, method: "POST" })),

    put: <T = unknown>(url: string, options?: ICustomRequestInit) =>
      apiWrapper(() => api<T>(apiConfig, url, { ...options, method: "PUT" })),

    delete: <T = unknown>(url: string, options?: ICustomRequestInit) =>
      apiWrapper(() =>
        api<T>(apiConfig, url, { ...options, method: "DELETE" }),
      ),

    patch: <T = unknown>(url: string, options?: ICustomRequestInit) =>
      apiWrapper(() => api<T>(apiConfig, url, { ...options, method: "PATCH" })),
  }
}
