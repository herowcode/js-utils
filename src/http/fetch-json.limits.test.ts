import { afterEach, describe, expect, it, vi } from "vitest"
import type { HttpError } from "../errors"
import { fetchJson } from "./fetch-json"

const rejection = (promise: Promise<unknown>) =>
  promise.catch((e) => e) as Promise<
    HttpError & { retryAfterSeconds?: number; details?: unknown }
  >

afterEach(() => vi.unstubAllGlobals())

describe("fetchJson error bodies", () => {
  it("reads at most 64 KB of an error body", async () => {
    let pulled = 0
    const chunk = new TextEncoder().encode("x".repeat(16_384))
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1
        controller.enqueue(chunk)
      },
    })
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(body, { status: 500 })),
    )
    const err = await rejection(fetchJson("https://x.test/a"))
    expect(err.status).toBe(500)
    expect(err.details).toBe("x".repeat(200))
    expect(pulled).toBeLessThanOrEqual(6)
  })

  it("sets retryAfterSeconds on 503 so retry can honour it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("busy", {
            status: 503,
            headers: { "Retry-After": "7" },
          }),
      ),
    )
    const err = await rejection(fetchJson("https://x.test/a"))
    expect(err.status).toBe(503)
    expect(err.retryAfterSeconds).toBe(7)
  })

  it("leaves retryAfterSeconds unset on other statuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("x", { status: 502, headers: { "Retry-After": "7" } }),
      ),
    )
    expect(
      (await rejection(fetchJson("https://x.test/a"))).retryAfterSeconds,
    ).toBe(undefined)
  })
})
