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

      const result = await client.get("/error")

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
})
