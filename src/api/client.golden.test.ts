import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "./client"

const mockFetch = vi.fn()
global.fetch = mockFetch

const client = apiClient({ baseURL: "https://api.example.com" })

describe("apiClient query string golden", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockImplementation(async () => new Response("{}"))
  })

  const requested = async (
    endpoint: string,
    params?: Record<string, string | number | boolean | null | undefined>,
  ) => {
    await client.get(endpoint, { params })
    return (mockFetch.mock.calls.at(-1)?.[0] as Request).url
  }

  it.each([
    [{ a: 1, b: "x" }, "https://api.example.com/p?a=1&b=x"],
    [{ a: null, b: undefined, c: "kept" }, "https://api.example.com/p?c=kept"],
    [{ a: null, b: undefined }, "https://api.example.com/p"],
    [{}, "https://api.example.com/p"],
    [
      { a: true, b: false, c: 0, d: "" },
      "https://api.example.com/p?a=true&b=false&c=0&d=",
    ],
    [{ q: "a b&c=d/é" }, "https://api.example.com/p?q=a+b%26c%3Dd%2F%C3%A9"],
    [{ n: 1.5, big: 1e21 }, "https://api.example.com/p?n=1.5&big=1e%2B21"],
  ])("params %j -> %s", async (params, expected) => {
    expect(await requested("/p", params)).toBe(expected)
  })

  it("appends params after an endpoint with no query", async () => {
    expect(await requested("p/", { a: 1 })).toBe(
      "https://api.example.com/p/?a=1",
    )
  })
})

describe("apiClient backoff delay golden", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // delay = base/2 + random * base/2, base = min(2^attempt * 100, backoffLimit)
  it("random 0.5 with the default 3000 ms cap", async () => {
    mockFetch.mockImplementation(
      async () => new Response(null, { status: 503 }),
    )
    vi.spyOn(Math, "random").mockReturnValue(0.5)
    const promise = client.get("/x", { retry: { limit: 6 } })
    const expected = [150, 300, 600, 1200, 2250]
    for (const [i, delay] of expected.entries()) {
      await vi.advanceTimersByTimeAsync(delay - 1)
      expect(mockFetch).toHaveBeenCalledTimes(i + 1)
      await vi.advanceTimersByTimeAsync(1)
      expect(mockFetch).toHaveBeenCalledTimes(i + 2)
    }
    await promise
  })

  it("random 0 waits half of the capped base", async () => {
    mockFetch.mockImplementation(
      async () => new Response(null, { status: 503 }),
    )
    vi.spyOn(Math, "random").mockReturnValue(0)
    const promise = client.get("/x", { retry: { limit: 3, backoffLimit: 150 } })
    // attempt 1 base 200 capped to 150 -> 75; attempt 2 base 400 capped to 150 -> 75
    await vi.advanceTimersByTimeAsync(74)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(74)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(mockFetch).toHaveBeenCalledTimes(3)
    await promise
  })

  it("random 1 waits the full capped base", async () => {
    mockFetch.mockImplementation(
      async () => new Response(null, { status: 503 }),
    )
    vi.spyOn(Math, "random").mockReturnValue(1)
    const promise = client.get("/x", {
      retry: { limit: 2, backoffLimit: 1000 },
    })
    await vi.advanceTimersByTimeAsync(199)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    await promise
  })
})
