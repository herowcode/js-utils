import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiWrapper } from "./wrapper"

// Mock axios to test Axios error handling
vi.mock("axios", () => ({
  isAxiosError: vi.fn(),
}))

const { isAxiosError } = await import("axios")

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
    beforeEach(() => {
      // Make sure isAxiosError returns false for Response objects
      vi.mocked(isAxiosError).mockReturnValue(false)
    })

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

      vi.mocked(isAxiosError).mockReturnValue(true)
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
        message: "Network Error",
        config: {
          url: "/users",
        },
      }

      vi.mocked(isAxiosError).mockReturnValue(true)
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
    beforeEach(() => {
      // Make sure isAxiosError returns false for standard errors
      vi.mocked(isAxiosError).mockReturnValue(false)
    })

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
    beforeEach(() => {
      // Make sure isAxiosError returns false for non-axios errors
      vi.mocked(isAxiosError).mockReturnValue(false)
    })

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
})
