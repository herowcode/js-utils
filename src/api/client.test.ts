import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "./client"

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper to create mock Response
function createMockResponse(
  status: number,
  data: unknown = null,
  statusText = "OK",
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    clone: vi.fn().mockReturnThis(),
    text: vi.fn().mockResolvedValue(data ? JSON.stringify(data) : ""),
    json: vi.fn().mockResolvedValue(data),
    headers: new Headers(),
    url: "https://api.example.com/test",
  } as unknown as Response
}

function getRequestFromFetchMock(callIndex = 0): Request {
  const [input, init] = mockFetch.mock.calls[callIndex] as [
    RequestInfo,
    RequestInit | undefined,
  ]

  return new Request(input, init)
}

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("Query Parameters", () => {
    it("should build query string correctly", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, { success: true }),
      )

      await client.get("/users", {
        params: {
          page: 1,
          limit: 10,
          active: true,
          name: "john",
          nullable: null,
          undefined: undefined,
        },
      })

      const request = getRequestFromFetchMock()
      expect(request.credentials).toBe("include")
      expect(request.url).toBe(
        "https://api.example.com/users?page=1&limit=10&active=true&name=john",
      )
    })

    it("should handle empty params object", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, { success: true }),
      )

      await client.get("/users", { params: {} })

      const request = getRequestFromFetchMock()
      expect(request.url).toBe("https://api.example.com/users")
    })

    it("should work without params", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, { success: true }),
      )

      await client.get("/users")

      const request = getRequestFromFetchMock()
      expect(request.url).toBe("https://api.example.com/users")
    })
  })

  describe("HTTP Methods", () => {
    const client = apiClient({ baseURL: "https://api.example.com" })

    it("should make GET requests", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { data: "test" }))

      const result = await client.get("/test")

      expect(result.data).toEqual({ data: "test" })
      expect(result.error).toBeNull()

      const request = getRequestFromFetchMock()
      expect(request.method).toBe("GET")
    })

    it("should make POST requests with JSON body", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(201, { id: 1 }))

      const payload = { name: "test" }
      const result = await client.post("/users", { json: payload })

      expect(result.data).toEqual({ id: 1 })
      expect(result.error).toBeNull()

      const request = getRequestFromFetchMock()
      expect(request.method).toBe("POST")
      expect(request.headers.get("Content-Type")).toBe("application/json")
    })

    it("should make PUT requests", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, { updated: true }),
      )

      await client.put("/users/1", { json: { name: "updated" } })

      const request = getRequestFromFetchMock()
      expect(request.method).toBe("PUT")
    })

    it("should make DELETE requests", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(204))

      const result = await client.delete("/users/1")

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()

      const request = getRequestFromFetchMock()
      expect(request.method).toBe("DELETE")
    })

    it("should make PATCH requests", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, { patched: true }),
      )

      await client.patch("/users/1", { json: { active: false } })

      const request = getRequestFromFetchMock()
      expect(request.method).toBe("PATCH")
    })
  })

  describe("URL Construction", () => {
    it("should handle baseURL with trailing slash", async () => {
      const client = apiClient({ baseURL: "https://api.example.com/" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("/users")

      const request = getRequestFromFetchMock()
      expect(request.url).toBe("https://api.example.com/users")
    })

    it("should handle endpoint with leading slash", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("/users")

      const request = getRequestFromFetchMock()
      expect(request.url).toBe("https://api.example.com/users")
    })

    it("should handle absolute URLs", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("https://other-api.com/data")

      const request = getRequestFromFetchMock()
      expect(request.url).toBe("https://other-api.com/data")
    })
  })

  describe("Authentication & Headers", () => {
    it("should add Authorization header when token is provided", async () => {
      const getAccessToken = vi.fn().mockResolvedValue("test-token")
      const client = apiClient({
        baseURL: "https://api.example.com",
        getAccessToken,
      })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("/protected")

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Authorization")).toBe("Bearer test-token")
      expect(getAccessToken).toHaveBeenCalledOnce()
    })

    it("should add X-User-IP header when getUserIP is provided", async () => {
      const getUserIP = vi.fn().mockResolvedValue("192.168.1.1")
      const client = apiClient({
        baseURL: "https://api.example.com",
        getUserIP,
      })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("/test")

      const request = getRequestFromFetchMock()
      expect(request.headers.get("X-User-IP")).toBe("192.168.1.1")
      expect(getUserIP).toHaveBeenCalledOnce()
    })

    it("should not add headers when functions return null/undefined", async () => {
      const getAccessToken = vi.fn().mockResolvedValue(null)
      const getUserIP = vi.fn().mockResolvedValue(undefined)
      const client = apiClient({
        baseURL: "https://api.example.com",
        getAccessToken,
        getUserIP,
      })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("/test")

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Authorization")).toBeNull()
      expect(request.headers.get("X-User-IP")).toBeNull()
    })
  })

  describe("401 Handling", () => {
    it("should call onSignoutUnauthorized on 401 for non-signin paths", async () => {
      const onSignoutUnauthorized = vi.fn()
      const client = apiClient({
        baseURL: "https://api.example.com",
        onSignoutUnauthorized,
      })

      const errorResponse = createMockResponse(
        401,
        { error: "Unauthorized" },
        "Unauthorized",
      )
      // Need to set up the response properly for instanceof Response check
      Object.setPrototypeOf(errorResponse, Response.prototype)
      mockFetch.mockResolvedValueOnce(errorResponse)

      const result = await client.get("/protected")

      expect(result.error).toBeDefined()
      expect(result.error?.status).toBe(401)
      expect(onSignoutUnauthorized).toHaveBeenCalledWith({
        error: "Unauthorized",
      })
    })

    it("should not call onSignoutUnauthorized on signin paths", async () => {
      const onSignoutUnauthorized = vi.fn()
      const client = apiClient({
        baseURL: "https://api.example.com",
        onSignoutUnauthorized,
      })

      const errorResponse = createMockResponse(
        401,
        { error: "Unauthorized" },
        "Unauthorized",
      )
      mockFetch.mockResolvedValueOnce(errorResponse)

      await client.post("/signin", { json: { username: "test" } })

      expect(onSignoutUnauthorized).not.toHaveBeenCalled()
    })
  })

  describe("Retry Logic", () => {
    it("should retry on configured status codes and methods", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })

      // First two calls return 413, third succeeds
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse(413, null, "Payload Too Large"),
        )
        .mockResolvedValueOnce(
          createMockResponse(413, null, "Payload Too Large"),
        )
        .mockResolvedValueOnce(createMockResponse(200, { success: true }))

      const resultPromise = client.get("/test", {
        retry: {
          limit: 3,
          methods: ["get"],
          statusCodes: [413],
          backoffLimit: 100,
        },
      })

      // Fast-forward through the retry delays
      await vi.advanceTimersByTimeAsync(1000)

      const result = await resultPromise

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result.data).toEqual({ success: true })
      expect(result.error).toBeNull()
    })

    it("should not retry when method is not in retry methods", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })

      const errorResponse = createMockResponse(413, null, "Payload Too Large")
      Object.setPrototypeOf(errorResponse, Response.prototype)
      mockFetch.mockResolvedValueOnce(errorResponse)

      const result = await client.post("/test", {
        retry: {
          limit: 3,
          methods: ["get"], // POST not included
          statusCodes: [413],
        },
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result.error?.status).toBe(413)
    })

    it("should not retry when status code is not in retry status codes", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })

      const errorResponse = createMockResponse(
        500,
        null,
        "Internal Server Error",
      )
      Object.setPrototypeOf(errorResponse, Response.prototype)
      mockFetch.mockResolvedValueOnce(errorResponse)

      const result = await client.get("/test", {
        retry: {
          limit: 3,
          methods: ["get"],
          statusCodes: [413], // 500 not included
        },
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result.error?.status).toBe(500)
    })

    it("should respect retry limit", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })

      // Always return 413
      const errorResponse = createMockResponse(413, null, "Payload Too Large")
      Object.setPrototypeOf(errorResponse, Response.prototype)
      mockFetch.mockResolvedValue(errorResponse)

      const resultPromise = client.get("/test", {
        retry: {
          limit: 2,
          methods: ["get"],
          statusCodes: [413],
        },
      })

      // Fast-forward through the retry delays
      await vi.advanceTimersByTimeAsync(5000)

      const result = await resultPromise

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.error?.status).toBe(413)
    })
  })

  describe("Response Handling", () => {
    it("should handle 204 No Content responses", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(204))

      const result = await client.delete("/users/1")

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })

    it("should handle empty response body", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      const response = {
        ...createMockResponse(200),
        text: vi.fn().mockResolvedValue(""),
      }
      mockFetch.mockResolvedValueOnce(response)

      const result = await client.get("/test")

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })

    it("should parse JSON response correctly", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      const responseData = { users: [{ id: 1, name: "John" }] }
      mockFetch.mockResolvedValueOnce(createMockResponse(200, responseData))

      const result = await client.get("/users")

      expect(result.data).toEqual(responseData)
      expect(result.error).toBeNull()
    })

    it("should handle error responses through wrapper", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      const errorResponse = createMockResponse(
        500,
        null,
        "Internal Server Error",
      )
      Object.setPrototypeOf(errorResponse, Response.prototype)
      mockFetch.mockResolvedValueOnce(errorResponse)

      const result = await client.post("/error")

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.status).toBe(500)
    })
  })

  describe("Content-Type Header Handling", () => {
    it("should add Content-Type application/json when json body is provided", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { id: 1 }))

      await client.post("/users", { json: { name: "test" } })

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Content-Type")).toBe("application/json")
    })

    it("should NOT add Content-Type application/json when json is null", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.post("/users", { json: null })

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Content-Type")).toBeNull()
    })

    it("should NOT add Content-Type application/json when json is undefined", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.post("/users", { json: undefined })

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Content-Type")).toBeNull()
    })

    it("should remove Content-Type application/json if manually set but no body provided", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("/users", {
        headers: { "Content-Type": "application/json" },
      })

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Content-Type")).toBeNull()
    })

    it("should keep other Content-Type values when no body is provided", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("/users", {
        headers: { "Content-Type": "text/plain" },
      })

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Content-Type")).toBe("text/plain")
    })

    it("should handle case-insensitive Content-Type check", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("/users", {
        headers: { "content-type": "Application/JSON" },
      })

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Content-Type")).toBeNull()
    })

    it("should add Content-Type when json body is an empty object", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.post("/users", { json: {} })

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Content-Type")).toBe("application/json")
    })

    it("should add Content-Type when json body is an empty array", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.post("/users", { json: [] })

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Content-Type")).toBe("application/json")
    })

    it("should add Content-Type when json body is false", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.post("/users", { json: false })

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Content-Type")).toBe("application/json")
    })

    it("should add Content-Type when json body is 0", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.post("/users", { json: 0 })

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Content-Type")).toBe("application/json")
    })
  })

  describe("Retry hardening", () => {
    function errorResponse(status: number): Response {
      const res = createMockResponse(status, null, "Err")
      Object.setPrototypeOf(res, Response.prototype)
      return res
    }

    it("should send a fresh, unused Request on each attempt so POST bodies survive retries", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch
        .mockResolvedValueOnce(errorResponse(503))
        .mockResolvedValueOnce(createMockResponse(200, { ok: true }))

      const promise = client.post("/items", {
        json: { a: 1 },
        retry: { methods: ["post"], statusCodes: [503] },
      })
      await vi.advanceTimersByTimeAsync(1000)
      await promise

      const first = mockFetch.mock.calls[0][0] as Request
      const second = mockFetch.mock.calls[1][0] as Request
      expect(second).not.toBe(first)
      expect(second.bodyUsed).toBe(false)
      expect(await second.text()).toBe('{"a":1}')
    })

    it("should compare retry methods case-insensitively", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch
        .mockResolvedValueOnce(errorResponse(503))
        .mockResolvedValueOnce(createMockResponse(200, { ok: true }))

      const promise = client.get("/x", { retry: { methods: ["GET"] } })
      await vi.advanceTimersByTimeAsync(1000)
      await promise

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it.each([408, 429, 500, 502, 503, 504])(
      "should retry GET on %i by default",
      async (status) => {
        const client = apiClient({ baseURL: "https://api.example.com" })
        mockFetch
          .mockResolvedValueOnce(errorResponse(status))
          .mockResolvedValueOnce(createMockResponse(200, { ok: true }))

        const promise = client.get("/x")
        await vi.advanceTimersByTimeAsync(1000)
        const result = await promise

        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(result.error).toBeNull()
      },
    )

    it("should retry HEAD by default but not POST", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch
        .mockResolvedValueOnce(errorResponse(503))
        .mockResolvedValueOnce(createMockResponse(200, null))
      const promise = client.get("/x", { method: "HEAD" })
      await vi.advanceTimersByTimeAsync(1000)
      await promise
      expect(mockFetch).toHaveBeenCalledTimes(2)

      mockFetch.mockReset()
      mockFetch.mockResolvedValueOnce(errorResponse(503))
      const result = await client.post("/x", { json: {} })
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result.error?.status).toBe(503)
    })

    it("should not retry 413 by default", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(errorResponse(413))

      await client.get("/x")

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it("should merge user retry options with defaults", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValue(errorResponse(503))

      const promise = client.get("/x", { retry: { limit: 2 } })
      await vi.advanceTimersByTimeAsync(10000)
      await promise

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it("should cap an excessive retry limit", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValue(errorResponse(503))

      const promise = client.get("/x", {
        retry: { limit: 1000, backoffLimit: 1 },
      })
      await vi.advanceTimersByTimeAsync(60000)
      await promise

      expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(10)
    })

    it("should cancel the failed response body before retrying", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      const cancel = vi.fn().mockResolvedValue(undefined)
      const failed = errorResponse(503)
      Object.defineProperty(failed, "body", { value: { cancel } })
      mockFetch
        .mockResolvedValueOnce(failed)
        .mockResolvedValueOnce(createMockResponse(200, { ok: true }))

      const promise = client.get("/x")
      await vi.advanceTimersByTimeAsync(1000)
      await promise

      expect(cancel).toHaveBeenCalledOnce()
    })

    it("should retry network errors", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch
        .mockRejectedValueOnce(new TypeError("fetch failed"))
        .mockResolvedValueOnce(createMockResponse(200, { ok: true }))

      const promise = client.get("/x")
      await vi.advanceTimersByTimeAsync(1000)
      const result = await promise

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.data).toEqual({ ok: true })
    })

    it("should surface the network error once attempts are exhausted", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockRejectedValue(new TypeError("fetch failed"))

      const promise = client.get("/x", { retry: { limit: 2 } })
      await vi.advanceTimersByTimeAsync(10000)
      const result = await promise

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.error?.message).toBe("fetch failed")
    })

    it("should not retry network errors for non-retryable methods", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockRejectedValue(new TypeError("fetch failed"))

      const result = await client.post("/x", { json: {} })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result.error?.message).toBe("fetch failed")
    })

    it("should not retry aborted requests", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockRejectedValue(
        new DOMException("The operation was aborted", "AbortError"),
      )

      await client.get("/x")

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe("URL and origin handling", () => {
    it("should treat scheme-like prefixes case-insensitively as absolute", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("HTTPS://other.com/data")

      expect(getRequestFromFetchMock().url).toBe("https://other.com/data")
    })

    it("should treat endpoints merely starting with 'http' as relative", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("httpbin/get")

      expect(getRequestFromFetchMock().url).toBe(
        "https://api.example.com/httpbin/get",
      )
    })

    it("should fail with a clear error when baseURL is missing for a relative endpoint", async () => {
      const client = apiClient()

      const result = await client.get("/users")

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.error?.message).toMatch(/baseURL/)
    })

    it("should allow absolute endpoints without baseURL", async () => {
      const client = apiClient()
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("https://other.com/data")

      expect(getRequestFromFetchMock().url).toBe("https://other.com/data")
    })

    it("should not send Authorization or X-User-IP to a different origin", async () => {
      const getAccessToken = vi.fn().mockResolvedValue("secret")
      const getUserIP = vi.fn().mockResolvedValue("1.2.3.4")
      const client = apiClient({
        baseURL: "https://api.example.com",
        getAccessToken,
        getUserIP,
      })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("https://evil.com/data")

      const request = getRequestFromFetchMock()
      expect(request.headers.get("Authorization")).toBeNull()
      expect(request.headers.get("X-User-IP")).toBeNull()
    })

    it("should send Authorization to an absolute URL on the same origin", async () => {
      const client = apiClient({
        baseURL: "https://api.example.com/v1",
        getAccessToken: vi.fn().mockResolvedValue("secret"),
      })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.get("https://api.example.com/other")

      expect(getRequestFromFetchMock().headers.get("Authorization")).toBe(
        "Bearer secret",
      )
    })

    it("should preserve Headers instances passed by the caller", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.post("/x", {
        json: { a: 1 },
        headers: new Headers({ "X-Custom": "1" }),
      })

      const headers = getRequestFromFetchMock().headers
      expect(headers.get("X-Custom")).toBe("1")
      expect(headers.get("Content-Type")).toBe("application/json")
    })

    it("should preserve tuple-array headers passed by the caller", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}))

      await client.post("/x", { json: {}, headers: [["X-Custom", "2"]] })

      expect(getRequestFromFetchMock().headers.get("X-Custom")).toBe("2")
    })
  })

  describe("Response parsing and 401 hardening", () => {
    it("should report status, url and a body snippet when the JSON is invalid", async () => {
      const client = apiClient({ baseURL: "https://api.example.com" })
      const response = createMockResponse(200)
      vi.mocked(response.text).mockResolvedValue(`<html>${"a".repeat(1000)}`)
      Object.defineProperty(response, "url", {
        value: "https://api.example.com/x",
      })
      mockFetch.mockResolvedValueOnce(response)

      const result = await client.get("/x")

      expect(result.error?.status).toBe(200)
      expect(result.error?.message).toContain("https://api.example.com/x")
      expect(result.error?.message).toContain("<html>")
      expect(result.error?.message.length).toBeLessThan(500)
    })

    it("should still call onSignoutUnauthorized when only the query contains a sign-in word", async () => {
      const onSignoutUnauthorized = vi.fn()
      const client = apiClient({
        baseURL: "https://api.example.com",
        onSignoutUnauthorized,
      })
      const res = createMockResponse(401, { error: "no" }, "Unauthorized")
      Object.setPrototypeOf(res, Response.prototype)
      mockFetch.mockResolvedValueOnce(res)

      await client.get("/me", { params: { next: "/login" } })

      expect(onSignoutUnauthorized).toHaveBeenCalledOnce()
    })

    it("should keep the original 401 when onSignoutUnauthorized throws", async () => {
      const client = apiClient({
        baseURL: "https://api.example.com",
        onSignoutUnauthorized: () => {
          throw new Error("callback exploded")
        },
      })
      const res = createMockResponse(401, { error: "no" }, "Unauthorized")
      Object.setPrototypeOf(res, Response.prototype)
      mockFetch.mockResolvedValueOnce(res)

      const result = await client.get("/me")

      expect(result.error?.status).toBe(401)
    })
  })
})
