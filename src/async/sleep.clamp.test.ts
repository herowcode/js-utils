import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { sleep } from "./sleep"

describe("sleep clamp", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("does not resolve early for delays above the 32-bit timer limit", async () => {
    let done = false
    sleep(2 ** 31 + 10).then(() => {
      done = true
    })
    await vi.advanceTimersByTimeAsync(1000)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(2 ** 31)
    expect(done).toBe(true)
  })
})
