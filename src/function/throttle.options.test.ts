import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { throttle } from "./throttle"

describe("throttle options", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("keeps leading + trailing by default", () => {
    const fn = vi.fn()
    const t = throttle(fn, 100)
    t(1)
    t(2)
    t(3)
    expect(fn.mock.calls).toEqual([[1]])
    vi.advanceTimersByTime(100)
    expect(fn.mock.calls).toEqual([[1], [3]])
    const same = vi.fn()
    const u = throttle(same, 100, {})
    u(1)
    u(2)
    vi.advanceTimersByTime(100)
    expect(same.mock.calls).toEqual([[1], [2]])
  })

  it("leading: false waits for the window end", () => {
    const fn = vi.fn()
    const t = throttle(fn, 100, { leading: false })
    t(1)
    t(2)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn.mock.calls).toEqual([[2]])
    vi.advanceTimersByTime(500)
    t(3)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(100)
    expect(fn.mock.calls).toEqual([[2], [3]])
  })

  it("trailing: false drops calls inside the window", () => {
    const fn = vi.fn()
    const t = throttle(fn, 100, { trailing: false })
    t(1)
    t(2)
    vi.advanceTimersByTime(500)
    expect(fn.mock.calls).toEqual([[1]])
    t(3)
    expect(fn.mock.calls).toEqual([[1], [3]])
  })

  it("rejects disabling both edges", () => {
    expect(() =>
      throttle(() => {}, 100, { leading: false, trailing: false }),
    ).toThrow("At least one of leading or trailing")
  })
})
