import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { throttle } from "./throttle"

describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should execute function immediately on first call", () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn()
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it("should not execute function again until delay has passed", () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn()
    throttledFn()
    throttledFn()

    expect(mockFn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it("should pass arguments correctly", () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn("arg1", "arg2", 123)
    expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", 123)
  })

  it("should use latest arguments for delayed execution", () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn("first")
    throttledFn("second")
    throttledFn("third")

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith("first")

    vi.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenLastCalledWith("third")
  })

  it("should handle zero delay", () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 0)

    throttledFn()
    expect(mockFn).toHaveBeenCalledTimes(1)

    throttledFn()
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it("should preserve this context", () => {
    const obj = {
      value: 42,
      method: vi.fn(function (this: { value: number }) {
        return this.value
      }),
    }

    const throttledMethod = throttle(obj.method, 100)
    throttledMethod.call(obj)

    expect(obj.method).toHaveBeenCalledTimes(1)
  })

  it("should allow execution after delay period", () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn()
    expect(mockFn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    throttledFn()
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it("should throw error for non-function input", () => {
    expect(() => throttle("not a function" as never, 100)).toThrow(
      "First argument must be a function",
    )
    expect(() => throttle(123 as never, 100)).toThrow(
      "First argument must be a function",
    )
    expect(() => throttle(null as never, 100)).toThrow(
      "First argument must be a function",
    )
  })

  it("should throw error for invalid delay", () => {
    const mockFn = vi.fn()
    expect(() => throttle(mockFn, -1)).toThrow(
      "Delay must be a non-negative number",
    )
    expect(() => throttle(mockFn, "invalid" as unknown as number)).toThrow(
      "Delay must be a non-negative number",
    )
    expect(() => throttle(mockFn, null as unknown as number)).toThrow(
      "Delay must be a non-negative number",
    )
  })
})
