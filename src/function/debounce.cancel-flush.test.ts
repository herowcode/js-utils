import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { debounce } from "./debounce"

describe("debounce cancel and flush", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("keeps the default trailing behavior", () => {
    const fn = vi.fn()
    const d = debounce(fn, 100)
    d(1)
    d(2)
    vi.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(2)
  })

  it("cancel drops the pending call", () => {
    const fn = vi.fn()
    const d = debounce(fn, 100)
    d()
    d.cancel()
    vi.advanceTimersByTime(500)
    expect(fn).not.toHaveBeenCalled()
  })

  it("flush runs the pending call once, with the last args and this", () => {
    const seen: unknown[] = []
    const obj = {
      run: debounce(function (this: unknown, v: number) {
        seen.push([this, v])
      }, 100),
    }
    obj.run(1)
    obj.run(2)
    obj.run.flush()
    expect(seen).toEqual([[obj, 2]])
    vi.advanceTimersByTime(500)
    expect(seen).toHaveLength(1)
  })

  it("flush and cancel are no-ops when nothing is pending", () => {
    const fn = vi.fn()
    const d = debounce(fn, 100)
    d.flush()
    d.cancel()
    expect(fn).not.toHaveBeenCalled()
    d()
    vi.advanceTimersByTime(100)
    d.flush()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("works again after cancel", () => {
    const fn = vi.fn()
    const d = debounce(fn, 100)
    d(1)
    d.cancel()
    d(2)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(2)
  })
})
