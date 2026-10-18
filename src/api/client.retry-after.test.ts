import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "./client"

const mockFetch = vi.fn()
global.fetch = mockFetch

function response(status: number, headers: Record<string, string> = {}) {
  return new Response(status === 200 ? "{}" : null, { status, headers })
}

const client = apiClient({ baseURL: "https://api.example.com" })

describe("apiClient retry backoff", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))
    vi.spyOn(Math, "random").mockReturnValue(0.5)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("waits the Retry-After delay in seconds", async () => {
    mockFetch
      .mockResolvedValueOnce(response(429, { "Retry-After": "2" }))
      .mockResolvedValueOnce(response(200))

    const promise = client.get("/x")
    await vi.advanceTimersByTimeAsync(1999)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect((await promise).error).toBeNull()
  })

  it("waits until a Retry-After HTTP date", async () => {
    const at = new Date(Date.now() + 1500).toUTCString()
    mockFetch
      .mockResolvedValueOnce(response(503, { "Retry-After": at }))
      .mockResolvedValueOnce(response(200))

    const promise = client.get("/x")
    // toUTCString drops milliseconds, so the date lands on +1000ms
    await vi.advanceTimersByTimeAsync(999)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    await promise
  })

  it("caps a Retry-After longer than maxRetryAfter", async () => {
    mockFetch
      .mockResolvedValueOnce(response(503, { "Retry-After": "120" }))
      .mockResolvedValueOnce(response(200))

    const promise = client.get("/x")
    await vi.advanceTimersByTimeAsync(9999)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect((await promise).error).toBeNull()
  })

  it("honours a longer Retry-After when maxRetryAfter allows it", async () => {
    mockFetch
      .mockResolvedValueOnce(response(503, { "Retry-After": "120" }))
      .mockResolvedValueOnce(response(200))

    const promise = client.get("/x", { retry: { maxRetryAfter: 120_000 } })
    await vi.advanceTimersByTimeAsync(119_999)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect((await promise).error).toBeNull()
  })

  it("falls back to backoff when Retry-After is unparseable", async () => {
    mockFetch
      .mockResolvedValueOnce(response(503, { "Retry-After": "soon" }))
      .mockResolvedValueOnce(response(200))

    const promise = client.get("/x")
    await vi.advanceTimersByTimeAsync(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    await promise
  })

  it.each(["1.5", "-1", "+2"])(
    "falls back to backoff for a numeric-looking but invalid Retry-After (%s)",
    async (value) => {
      mockFetch
        .mockResolvedValueOnce(response(503, { "Retry-After": value }))
        .mockResolvedValueOnce(response(200))

      const promise = client.get("/x")
      await vi.advanceTimersByTimeAsync(149)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(mockFetch).toHaveBeenCalledTimes(2)
      await promise
    },
  )

  it("clamps maxRetryAfter so a huge Retry-After cannot overflow setTimeout", async () => {
    mockFetch
      .mockResolvedValueOnce(response(503, { "Retry-After": "3000000" }))
      .mockResolvedValueOnce(response(200))

    const promise = client.get("/x", {
      retry: { maxRetryAfter: Number.POSITIVE_INFINITY },
    })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(2 ** 31)
    expect((await promise).error).toBeNull()
  })

  it.each([
    [0, 100],
    [0.5, 150],
  ])(
    "jitters the exponential backoff (random=%f -> %ims)",
    async (random, delay) => {
      vi.mocked(Math.random).mockReturnValue(random)
      mockFetch
        .mockResolvedValueOnce(response(503))
        .mockResolvedValueOnce(response(200))

      const promise = client.get("/x")
      await vi.advanceTimersByTimeAsync(delay - 1)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(mockFetch).toHaveBeenCalledTimes(2)
      await promise
    },
  )
})
