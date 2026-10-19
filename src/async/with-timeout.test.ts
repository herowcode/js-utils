import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { withTimeout } from "./with-timeout"

describe("withTimeout (native)", () => {
  it.each([undefined, 0, -5, Number.NaN, Number.POSITIVE_INFINITY])(
    "returns the signal untouched for timeoutMs %s",
    (timeoutMs) => {
      const signal = new AbortController().signal
      expect(withTimeout(signal, timeoutMs)).toBe(signal)
      expect(withTimeout(undefined, timeoutMs)).toBeUndefined()
      expect(withTimeout(null, timeoutMs)).toBeNull()
    },
  )

  it("aborts with a TimeoutError", async () => {
    const signal = withTimeout(undefined, 10) as AbortSignal
    await new Promise((r) => setTimeout(r, 30))
    expect(signal.aborted).toBe(true)
    expect((signal.reason as Error).name).toBe("TimeoutError")
  })

  it("follows the caller's signal too", () => {
    const controller = new AbortController()
    const signal = withTimeout(controller.signal, 10_000) as AbortSignal
    controller.abort(new Error("user"))
    expect((signal.reason as Error).message).toBe("user")
  })
})

describe("withTimeout (manual fallback)", () => {
  const originalTimeout = AbortSignal.timeout
  const originalAny = AbortSignal.any

  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(AbortSignal, "timeout", {
      value: undefined,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(AbortSignal, "any", {
      value: undefined,
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(AbortSignal, "timeout", {
      value: originalTimeout,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(AbortSignal, "any", {
      value: originalAny,
      configurable: true,
      writable: true,
    })
  })

  it("times out with a TimeoutError and rounds fractions up", async () => {
    const signal = withTimeout(undefined, 9.2) as AbortSignal
    await vi.advanceTimersByTimeAsync(9)
    expect(signal.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(signal.aborted).toBe(true)
    expect((signal.reason as Error).name).toBe("TimeoutError")
  })

  it("forwards the parent's abort reason and clears the timer", () => {
    const parent = new AbortController()
    const signal = withTimeout(parent.signal, 10_000) as AbortSignal
    parent.abort(new Error("user"))
    expect((signal.reason as Error).message).toBe("user")
    expect(vi.getTimerCount()).toBe(0)
  })

  it("is aborted at once when the parent already is, without a timer", () => {
    const parent = new AbortController()
    parent.abort(new Error("early"))
    const signal = withTimeout(parent.signal, 10_000) as AbortSignal
    expect(signal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("removes the parent listener after the timeout fires", async () => {
    const parent = new AbortController()
    const remove = vi.spyOn(parent.signal, "removeEventListener")
    withTimeout(parent.signal, 10)
    await vi.advanceTimersByTimeAsync(10)
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function))
  })
})
