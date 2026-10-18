import { describe, expect, it, vi } from "vitest"
import { apiWrapper } from "./wrapper"

describe("apiWrapper", () => {
  describe("Success cases", () => {
    it("should return data when API call succeeds", async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ id: 1, name: "John" })

      const result = await apiWrapper(mockApiCall)

      expect(result.data).toEqual({ id: 1, name: "John" })
      expect(result.error).toBeNull()
      expect(mockApiCall).toHaveBeenCalledOnce()
    })

    it("should return data with custom type", async () => {
      interface IUser {
        id: number
        name: string
      }

      const mockApiCall = vi.fn().mockResolvedValue({ id: 1, name: "John" })

      const result = await apiWrapper<IUser>(mockApiCall)

      expect(result.data).toEqual({ id: 1, name: "John" })
      expect(result.error).toBeNull()
    })
  })

  describe("Error handling - Response objects", () => {
    it("should handle Response error with JSON body", async () => {
      const responseData = {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: { field: "email", error: "Invalid format" },
        timestamp: "2025-09-24T10:00:00Z",
      }

      const mockResponse = {
        status: 400,
        statusText: "Bad Request",
        url: "https://api.example.com/users",
        clone: () => ({
          json: vi.fn().mockResolvedValue(responseData),
        }),
      } as unknown as Response

      // Mock instanceof Response check
      Object.setPrototypeOf(mockResponse, Response.prototype)

      const mockApiCall = vi.fn().mockRejectedValue(mockResponse)

      const result = await apiWrapper(mockApiCall)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: "Validation failed",
        status: 400,
        path: "https://api.example.com/users",
        code: "VALIDATION_ERROR",
        details: { field: "email", error: "Invalid format" },
        timestamp: "2025-09-24T10:00:00Z",
      })
    })

    it("should handle Response error with JSON parsing failure", async () => {
      const mockResponse = {
        status: 500,
        statusText: "Internal Server Error",
        url: "https://api.example.com/error",
        clone: () => ({
          json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        }),
      } as unknown as Response

      // Mock instanceof Response check
      Object.setPrototypeOf(mockResponse, Response.prototype)

      const mockApiCall = vi.fn().mockRejectedValue(mockResponse)

      const result = await apiWrapper(mockApiCall)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: "HTTP Error 500: Internal Server Error",
        status: 500,
        path: "https://api.example.com/error",
      })
    })

    it("should handle Response error with issues instead of details", async () => {
      const responseData = {
        message: "Validation errors",
        issues: [
          { field: "email", message: "Required" },
          { field: "password", message: "Too short" },
        ],
      }

      const mockResponse = {
        status: 422,
        statusText: "Unprocessable Entity",
        url: "https://api.example.com/users",
        clone: () => ({
          json: vi.fn().mockResolvedValue(responseData),
        }),
      } as unknown as Response

      // Mock instanceof Response check
      Object.setPrototypeOf(mockResponse, Response.prototype)

      const mockApiCall = vi.fn().mockRejectedValue(mockResponse)

      const result = await apiWrapper(mockApiCall)

      expect(result.error?.details).toEqual([
        { field: "email", message: "Required" },
        { field: "password", message: "Too short" },
      ])
    })
  })

  describe("Error handling - Axios errors", () => {
    it("should handle Axios error with response data", async () => {
      const axiosError = {
        isAxiosError: true,
        message: "Request failed",
        response: {
          status: 404,
          data: {
            message: "User not found",
            code: "USER_NOT_FOUND",
          },
        },
        config: {
          url: "/users/999",
        },
      }
      const mockApiCall = vi.fn().mockRejectedValue(axiosError)

      const result = await apiWrapper(mockApiCall)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: "User not found",
        status: 404,
        path: "/users/999",
        code: "USER_NOT_FOUND",
      })
    })

    it("should handle Axios error without response data", async () => {
      const axiosError = {
        isAxiosError: true,
        message: "Network Error",
        config: {
          url: "/users",
        },
      }
      const mockApiCall = vi.fn().mockRejectedValue(axiosError)

      const result = await apiWrapper(mockApiCall)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: "Network Error",
        path: "/users",
      })
    })
  })

  describe("Error handling - Standard Error objects", () => {
    it("should handle standard Error", async () => {
      const error = new Error("Something went wrong")
      const mockApiCall = vi.fn().mockRejectedValue(error)

      const result = await apiWrapper(mockApiCall)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: "Something went wrong",
      })
    })

    it("should handle Error with custom properties", async () => {
      const error = new Error("Custom error") as Error & {
        code?: string
        status?: number
        details?: unknown
      }
      error.code = "CUSTOM_ERROR"
      error.status = 400
      error.details = { extra: "info" }

      const mockApiCall = vi.fn().mockRejectedValue(error)

      const result = await apiWrapper(mockApiCall)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: "Custom error",
        code: "CUSTOM_ERROR",
        status: 400,
        details: { extra: "info" },
      })
    })
  })

  describe("Error handling - Unknown errors", () => {
    it("should handle string error", async () => {
      const mockApiCall = vi.fn().mockRejectedValue("String error")

      const result = await apiWrapper(mockApiCall)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: '"String error"',
      })
    })

    it("should handle null error", async () => {
      const mockApiCall = () => Promise.reject(null)

      const result = await apiWrapper(mockApiCall)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
      if (result.error) {
        expect(result.error.message).toBe("Unknown error")
      }
    })

    it("should handle object error", async () => {
      const mockApiCall = vi
        .fn()
        .mockRejectedValue({ type: "unknown", value: 42 })

      const result = await apiWrapper(mockApiCall)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: '{"type":"unknown","value":42}',
      })
    })
  })

  describe("Default data handling", () => {
    it("should return default data when error occurs", async () => {
      const mockApiCall = vi.fn().mockRejectedValue(new Error("Failed"))
      const defaultData = { users: [] }

      const result = await apiWrapper(mockApiCall, defaultData)

      expect(result.data).toEqual(defaultData)
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe("Failed")
    })

    it("should return default null when no default provided", async () => {
      const mockApiCall = vi.fn().mockRejectedValue(new Error("Failed"))

      const result = await apiWrapper(mockApiCall)

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it("should return actual data when no error occurs, ignoring default", async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ id: 1 })
      const defaultData = { users: [] }

      const result = await apiWrapper(mockApiCall, defaultData)

      expect(result.data).toEqual({ id: 1 })
      expect(result.error).toBeNull()
    })
  })

  describe("Type safety", () => {
    it("should maintain proper typing with generic parameters", async () => {
      interface IUser {
        id: number
        name: string
      }

      interface IDefaultData {
        users: IUser[]
      }

      const mockApiCall = vi.fn().mockResolvedValue({ id: 1, name: "John" })
      const defaultData: IDefaultData = { users: [] }

      const result = await apiWrapper<IUser, IDefaultData>(
        mockApiCall,
        defaultData,
      )

      // TypeScript should infer correct types
      expect(result.data).toEqual({ id: 1, name: "John" })
      expect(result.error).toBeNull()
    })
  })

  describe("Async API call handling", () => {
    it("should handle API call that returns a promise", async () => {
      const asyncApiCall = () => Promise.resolve({ success: true })

      const result = await apiWrapper(asyncApiCall)

      expect(result.data).toEqual({ success: true })
      expect(result.error).toBeNull()
    })

    it("should handle API call that throws asynchronously", async () => {
      const asyncApiCall = () => Promise.reject(new Error("Async error"))

      const result = await apiWrapper(asyncApiCall)

      expect(result.data).toBeNull()
      expect(result.error?.message).toBe("Async error")
    })
  })

  describe("Robustness", () => {
    function responseWith(
      status: number,
      body: string,
      statusText = "Err",
    ): Response {
      return new Response(body, { status, statusText })
    }

    it("should use a truncated text body as message and details when body is not JSON", async () => {
      const long = "x".repeat(1000)
      const result = await apiWrapper(() =>
        Promise.reject(responseWith(502, long)),
      )

      expect(result.error?.status).toBe(502)
      expect(result.error?.message.length).toBeLessThanOrEqual(300)
      expect(result.error?.message).toContain("xxx")
      expect(typeof result.error?.details).toBe("string")
      expect((result.error?.details as string).length).toBeLessThanOrEqual(300)
    })

    it("should keep the default message when the JSON body has a null message", async () => {
      const result = await apiWrapper(() =>
        Promise.reject(responseWith(400, '{"message":null,"code":null}')),
      )

      expect(result.error?.message).toBe("HTTP Error 400: Err")
      expect(result.error?.code).toBeUndefined()
    })

    it("should keep a falsy-but-present code on standard errors", async () => {
      const error = Object.assign(new Error("boom"), { code: 0, status: 0 })
      const result = await apiWrapper(() => Promise.reject(error))

      expect(result.error?.code).toBe("0")
      expect(result.error?.status).toBe(0)
    })

    it("should drop a NaN status", async () => {
      const error = Object.assign(new Error("boom"), { status: "abc" })
      const result = await apiWrapper(() => Promise.reject(error))

      expect(result.error?.status).toBeUndefined()
    })

    it("should not throw when the unknown error is not serializable", async () => {
      const circular: Record<string, unknown> = {}
      circular.self = circular
      const result = await apiWrapper(() => Promise.reject(circular))

      expect(result.error?.message).toBe("[object Object]")
    })

    it("should not use axios when axios-like error has isAxiosError false", async () => {
      const result = await apiWrapper(() =>
        Promise.reject({ isAxiosError: false, message: "x" }),
      )

      expect(result.error?.message).toBe('{"isAxiosError":false,"message":"x"}')
    })
  })
})
