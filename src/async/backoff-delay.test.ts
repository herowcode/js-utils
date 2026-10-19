import { afterEach, describe, expect, it, vi } from "vitest"
import { backoffDelay } from "./backoff-delay"

describe("backoffDelay", () => {
  afterEach(() => vi.restoreAllMocks())

  it("uses equal jitter on the capped exponential base", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5)
    expect([1, 2, 3, 4, 5].map((n) => backoffDelay(n))).toEqual([
      150, 300, 600, 1200, 2250,
    ])
  })

  it("random 0 gives half and random 1 the full capped base", () => {
    const random = vi.spyOn(Math, "random")
    random.mockReturnValue(0)
    expect(backoffDelay(1, { maxMs: 150 })).toBe(75)
    random.mockReturnValue(1)
    expect(backoffDelay(1, { maxMs: 1000 })).toBe(200)
  })

  it("honours baseMs", () => {
    vi.spyOn(Math, "random").mockReturnValue(1)
    expect(backoffDelay(2, { baseMs: 10 })).toBe(40)
  })

  it("stays within [base/2, base]", () => {
    for (let i = 0; i < 50; i++) {
      const d = backoffDelay(3)
      expect(d).toBeGreaterThanOrEqual(400)
      expect(d).toBeLessThanOrEqual(800)
    }
  })
})
