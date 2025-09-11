import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { debounce } from "./debounce"

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should delay function execution", () => {
    const mockFn = vi.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn()
    expect(mockFn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it("should cancel previous calls when called multiple times", () => {
    const mockFn = vi.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    vi.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it("should pass arguments correctly", () => {
    const mockFn = vi.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn("arg1", "arg2", 123)
    vi.advanceTimersByTime(100)

    expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", 123)
  })

  it("should handle multiple calls with different arguments", () => {
    const mockFn = vi.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn("first")
    debouncedFn("second")
    debouncedFn("third")

    vi.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith("third")
  })

  it("should handle zero delay", () => {
    const mockFn = vi.fn()
    const debouncedFn = debounce(mockFn, 0)

    debouncedFn()
    expect(mockFn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(0)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it("should preserve this context", () => {
    const obj = {
      value: 42,
      method: vi.fn(function (this: { value: number }) {
        return this.value
      }),
    }

    const debouncedMethod = debounce(obj.method, 100)
    debouncedMethod.call(obj)

    vi.advanceTimersByTime(100)
    expect(obj.method).toHaveBeenCalledTimes(1)
  })

  it("should throw error for non-function input", () => {
    expect(() => debounce("not a function" as never, 100)).toThrow(
      "First argument must be a function",
    )
    expect(() => debounce(123 as never, 100)).toThrow(
      "First argument must be a function",
    )
    expect(() => debounce(null as never, 100)).toThrow(
      "First argument must be a function",
    )
  })

  it("should throw error for invalid delay", () => {
    const mockFn = vi.fn()
    expect(() => debounce(mockFn, -1)).toThrow(
      "Delay must be a non-negative number",
    )
    expect(() => debounce(mockFn, "invalid" as unknown as number)).toThrow(
      "Delay must be a non-negative number",
    )
    expect(() => debounce(mockFn, null as unknown as number)).toThrow(
      "Delay must be a non-negative number",
    )
  })
})
