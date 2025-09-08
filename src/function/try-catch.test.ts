import { type TTryCatchResult, tryCatch } from "./try-catch"

describe("tryCatch", () => {
  it("should return data when the promise resolves", async () => {
    const mockFn = async () => "success"
    const result = await tryCatch(mockFn)
    expect(result).toEqual({ data: "success", error: null })
  })

  it("should return error when the promise rejects", async () => {
    const mockFn = async () => {
      throw new Error("failure")
    }
    const result = await tryCatch(mockFn)
    expect(result).toEqual({ data: null, error: new Error("failure") })
  })

  it("should return default data when the promise rejects and defaultData is provided", async () => {
    const mockFn = async () => {
      throw new Error("failure")
    }
    const result = await tryCatch(mockFn, "default")
    expect(result).toEqual({ data: "default", error: new Error("failure") })
  })

  it("should handle synchronous functions that return data", async () => {
    const mockFn = () => "sync success"
    const result = await tryCatch(mockFn)
    expect(result).toEqual({ data: "sync success", error: null })
  })

  it("should handle synchronous functions that throw errors", async () => {
    const mockFn = () => {
      throw new Error("sync failure")
    }
    const result = await tryCatch(mockFn)
    expect(result).toEqual({ data: null, error: new Error("sync failure") })
  })

  it("should infer the correct types for data and error", async () => {
    const mockFn = async (): Promise<number> => 42
    const result: TTryCatchResult<number> = await tryCatch(mockFn)
    expect(result.data).toBe(42)
    expect(result.error).toBeNull()
  })
})
