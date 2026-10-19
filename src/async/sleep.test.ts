import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { sleep } from "./sleep"

describe("sleep", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("resolves after the delay", async () => {
    let done = false
    const p = sleep(100).then(() => {
      done = true
    })
    await vi.advanceTimersByTimeAsync(99)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await p
    expect(done).toBe(true)
  })

  it("rejects immediately when the signal is already aborted", async () => {
    const controller = new AbortController()
    controller.abort(new Error("stop"))
    await expect(sleep(100, controller.signal)).rejects.toThrow("stop")
  })

  it("rejects with the reason when aborted mid-wait and clears the timer", async () => {
    const controller = new AbortController()
    const p = sleep(1000, controller.signal)
    controller.abort(new Error("stop"))
    await expect(p).rejects.toThrow("stop")
    expect(vi.getTimerCount()).toBe(0)
  })

  it("removes its abort listener once resolved", async () => {
    const controller = new AbortController()
    const remove = vi.spyOn(controller.signal, "removeEventListener")
    const p = sleep(10, controller.signal)
    await vi.advanceTimersByTimeAsync(10)
    await p
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function))
  })
})
