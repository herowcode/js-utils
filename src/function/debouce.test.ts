import { debounce } from "./debounce"

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("should delay function execution", () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn()
    expect(mockFn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it("should cancel previous calls when called multiple times", () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    jest.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it("should pass arguments correctly", () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn("arg1", "arg2", 123)
    jest.advanceTimersByTime(100)

    expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", 123)
  })

  it("should handle multiple calls with different arguments", () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn("first")
    debouncedFn("second")
    debouncedFn("third")

    jest.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith("third")
  })

  it("should handle zero delay", () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 0)

    debouncedFn()
    expect(mockFn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(0)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it("should preserve this context", () => {
    const obj = {
      value: 42,
      method: jest.fn(function (this: { value: number }) {
        return this.value
      }),
    }

    const debouncedMethod = debounce(obj.method, 100)
    debouncedMethod.call(obj)

    jest.advanceTimersByTime(100)
    expect(obj.method).toHaveBeenCalledTimes(1)
  })

  it("should throw error for non-function input", () => {
    expect(() =>
      debounce("not a function" as unknown as typeof jest.fn, 100),
    ).toThrow("First argument must be a function")
    expect(() => debounce(123 as unknown as typeof jest.fn, 100)).toThrow(
      "First argument must be a function",
    )
    expect(() => debounce(null as unknown as typeof jest.fn, 100)).toThrow(
      "First argument must be a function",
    )
  })

  it("should throw error for invalid delay", () => {
    const mockFn = jest.fn()
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
