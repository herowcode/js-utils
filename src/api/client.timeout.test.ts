import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "./client"

const mockFetch = vi.fn()
global.fetch = mockFetch

function jsonResponse(status: number, data: unknown = null): Response {
  const res = new Response(data === null ? null : JSON.stringify(data), {
    status,
  })
  return res
}

// Settles only when the request signal aborts, like a real hanging fetch
function hangUntilAborted(request: Request): Promise<Response> {
  return new Promise((_, reject) => {
    request.signal.addEventListener("abort", () =>
      reject(request.signal.reason),
    )
  })
}

function timeoutError(): DOMException {
  return new DOMException("The operation timed out.", "TimeoutError")
}

describe("apiClient timeout", () => {
  let timeoutController: AbortController
  let timeoutSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    timeoutController = new AbortController()
    timeoutSpy = vi
      .spyOn(AbortSignal, "timeout")
      .mockImplementation(() => timeoutController.signal)
  })

  afterEach(() => {
    timeoutSpy.mockRestore()
    vi.useRealTimers()
  })

  it("does not set a timeout by default", async () => {
    const client = apiClient({ baseURL: "https://api.example.com" })
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    await client.get("/x")

    expect(timeoutSpy).not.toHaveBeenCalled()
  })

  it("aborts a hanging request once the timeout fires, without retrying", async () => {
    const client = apiClient({ baseURL: "https://api.example.com" })
    mockFetch.mockImplementation(hangUntilAborted)

    const promise = client.get("/x", { timeout: 1000 })
    await vi.advanceTimersByTimeAsync(0)
    timeoutController.abort(timeoutError())
    const result = await promise

    expect(timeoutSpy).toHaveBeenCalledWith(1000)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.data).toBeNull()
    expect(result.error).not.toBeNull()
  })

  it("uses the client-level timeout, overridable per request", async () => {
    const client = apiClient({
      baseURL: "https://api.example.com",
      timeout: 5000,
    })
    mockFetch.mockImplementation(() => Promise.resolve(jsonResponse(200, {})))

    await client.get("/a")
    await client.get("/b", { timeout: 200 })

    expect(timeoutSpy).toHaveBeenNthCalledWith(1, 5000)
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, 200)
  })

  it("still honours the caller's own signal", async () => {
    const client = apiClient({ baseURL: "https://api.example.com" })
    const caller = new AbortController()
    mockFetch.mockImplementation(hangUntilAborted)

    const promise = client.get("/x", { timeout: 1000, signal: caller.signal })
    await vi.advanceTimersByTimeAsync(0)
    caller.abort()
    const result = await promise

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.error).not.toBeNull()
    expect(timeoutController.signal.aborted).toBe(false)
  })

  it("stops waiting during retry backoff when the timeout fires", async () => {
    const client = apiClient({ baseURL: "https://api.example.com" })
    mockFetch.mockResolvedValue(jsonResponse(503))

    const promise = client.get("/x", {
      timeout: 1000,
      retry: { backoffLimit: 60_000 },
    })
    await vi.advanceTimersByTimeAsync(0)
    timeoutController.abort(timeoutError())
    const result = await promise

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.error).not.toBeNull()
  })
})
