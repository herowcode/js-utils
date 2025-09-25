import { apiWrapper } from "./wrapper"

interface ICustomRequestInit extends Omit<RequestInit, "body"> {
  json?: unknown
  params?: Record<string, string | number | boolean | null | undefined>
  retry?: {
    limit?: number
    methods?: string[]
    statusCodes?: number[]
    backoffLimit?: number
  }
}

const defaultRetryConfig = {
  limit: 5,
  methods: ["get"],
  statusCodes: [413],
  backoffLimit: 3000,
}

function buildQueryString(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ""
}

async function beforeRequestHook(
  request: Request,
  getAccessToken?: () => Promise<string | null>,
  getUserIP?: () => Promise<string | undefined>,
): Promise<Request> {
  const token = await getAccessToken?.()
  const headers = new Headers(request.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const userIP = await getUserIP?.()
  if (userIP) {
    headers.set("X-User-IP", userIP)
  }

  return new Request(request, { headers })
}

async function afterResponseHook(
  request: Request,
  response: Response,
  onSignoutUnauthorized?: (response: unknown) => void,
): Promise<void> {
  const possibleSignInPaths = ["signin", "sign-in", "login"]
  const isSignInPath = possibleSignInPaths.some((path) =>
    request.url.includes(path),
  )
  const needsBody = response.status === 401 && !isSignInPath

  let responseBody: unknown = null
  let responseBodyFor401: unknown = null

  if (needsBody) {
    const clone = response.clone()
    try {
      responseBody = await clone.json()
      responseBodyFor401 = responseBody
    } catch {
      responseBody = await clone.text()
    }
  }

  if (response.status === 401 && !isSignInPath) {
    return onSignoutUnauthorized?.(responseBodyFor401)
  }
}

async function fetchWithRetry(
  input: RequestInfo,
  init?: ICustomRequestInit,
): Promise<Response> {
  const retryConfig = init?.retry || defaultRetryConfig
  const method = (init?.method || "GET").toLowerCase()
  let attempt = 0

  while (true) {
    attempt++
    const response = await fetch(input, init)

    const shouldRetry =
      retryConfig.statusCodes?.includes(response.status) &&
      retryConfig.methods?.includes(method) &&
      attempt < (retryConfig.limit ?? 5)

    if (!shouldRetry) return response

    const backoff = Math.min(
      2 ** attempt * 100,
      retryConfig.backoffLimit ?? 3000,
    )
    await new Promise((resolve) => setTimeout(resolve, backoff))
  }
}

type TApiClientProps = {
  baseURL?: string
  onSignoutUnauthorized?: (response?: unknown) => void
  getAccessToken?: () => Promise<string | null>
  getUserIP?: () => Promise<string | undefined>
}

async function api<T>(
  config: TApiClientProps,
  endpoint: string,
  options: ICustomRequestInit = {},
): Promise<T> {
  let url = endpoint.startsWith("http")
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

  let body: RequestInit["body"]
  if (options.json) {
    body = JSON.stringify(options.json)
    init.headers = {
      ...init.headers,
      "Content-Type": "application/json",
    }
  }

  // Create initial request
  let request = new Request(url, { ...init, body })

  // Run pre-request hooks
  request = await beforeRequestHook(
    request,
    config.getAccessToken,
    config.getUserIP,
  )

  // Execute request with retry logic
  const response = await fetchWithRetry(request, init)

  // Run post-response hooks
  await afterResponseHook(request, response, config.onSignoutUnauthorized)

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
  return JSON.parse(text)
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
