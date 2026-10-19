import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { retry } from "./retry"

const transient = () =>
  Object.assign(new Error("reset"), { code: "ECONNRESET" })
const http = (status: number, extra: object = {}) =>
  Object.assign(new Error(`http ${status}`), { status, ...extra })

describe("retry", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, "random").mockReturnValue(0)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const run = async <T>(p: Promise<T>) => {
    const settled = p.then(
      (value) => ({ value }),
      (error: unknown) => ({ error }),
    )
    await vi.runAllTimersAsync()
    return settled
  }

  it("returns the first success without waiting", async () => {
    const fn = vi.fn().mockResolvedValue("ok")
    expect(await retry(fn)).toBe("ok")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("retries transient network errors then succeeds, passing the attempt number", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(transient())
      .mockRejectedValueOnce(transient())
      .mockResolvedValueOnce("ok")
    expect(await run(retry(fn))).toEqual({ value: "ok" })
    expect(fn.mock.calls.map(([n]) => n)).toEqual([1, 2, 3])
  })

  it("retries transient HTTP statuses (503) from status and response.status", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(http(503))
      .mockRejectedValueOnce(
        Object.assign(new Error("x"), { response: { status: 502 } }),
      )
      .mockResolvedValueOnce("ok")
    expect(await run(retry(fn))).toEqual({ value: "ok" })
  })

  it("does not retry a 400 or an unknown error by default", async () => {
    for (const error of [http(400), new Error("bug")]) {
      const fn = vi.fn().mockRejectedValue(error)
      expect(await run(retry(fn))).toEqual({ error })
      expect(fn).toHaveBeenCalledTimes(1)
    }
  })

  it("never retries AbortError, even with shouldRetry returning true", async () => {
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" })
    const fn = vi.fn().mockRejectedValue(abort)
    expect(await run(retry(fn, { shouldRetry: () => true }))).toEqual({
      error: abort,
    })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("stops when the signal aborts during the backoff wait", async () => {
    const controller = new AbortController()
    const fn = vi.fn().mockRejectedValue(transient())
    const p = retry(fn, { signal: controller.signal })
    const settled = p.catch((e: unknown) => e)
    await vi.advanceTimersByTimeAsync(0)
    controller.abort(new Error("stop"))
    expect(((await settled) as Error).message).toBe("stop")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("gives up after `attempts` and rethrows the last error", async () => {
    const last = transient()
    const fn = vi
      .fn()
      .mockRejectedValueOnce(transient())
      .mockRejectedValue(last)
    expect(await run(retry(fn, { attempts: 2 }))).toEqual({ error: last })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("supports retry-all through shouldRetry", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(http(400))
      .mockResolvedValueOnce("ok")
    expect(await run(retry(fn, { shouldRetry: () => true }))).toEqual({
      value: "ok",
    })
  })

  it("uses equal-jitter backoff (random 0 -> half)", async () => {
    const onRetry = vi.fn()
    const fn = vi
      .fn()
      .mockRejectedValueOnce(transient())
      .mockResolvedValueOnce("ok")
    await run(retry(fn, { onRetry }))
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 100)
  })

  it("Retry-After (retryAfterSeconds) overrides the backoff", async () => {
    const onRetry = vi.fn()
    const fn = vi
      .fn()
      .mockRejectedValueOnce(http(429, { retryAfterSeconds: 2 }))
      .mockResolvedValueOnce("ok")
    await run(retry(fn, { onRetry }))
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 2000)
  })

  it("reads a Retry-After header and caps it with maxRetryAfterMs", async () => {
    const onRetry = vi.fn()
    const err = http(503, {
      response: { headers: new Headers({ "Retry-After": "120" }) },
    })
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValueOnce("ok")
    await run(retry(fn, { onRetry, maxRetryAfterMs: 5000 }))
    expect(onRetry).toHaveBeenCalledWith(err, 1, 5000)
  })

  it("handles synchronous throws and values", async () => {
    const fn = vi.fn(() => {
      throw transient()
    })
    expect(Object.hasOwn(await run(retry(fn, { attempts: 2 })), "error")).toBe(
      true,
    )
    expect(await retry(() => 5)).toBe(5)
  })
})
