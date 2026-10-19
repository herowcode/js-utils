import { afterEach, describe, expect, it, vi } from "vitest"
import {
  ConflictError,
  HttpError,
  NotFoundError,
  TooManyRequestsError,
} from "../errors"
import { fetchJson } from "./fetch-json"
import { fetchWithTimeout } from "./fetch-with-timeout"

type TRejection = HttpError & {
  retryAfterSeconds?: number
  details?: { body: string }
}

const rejection = (promise: Promise<unknown>) =>
  promise.catch((e) => e) as Promise<TRejection>

const stubFetch = (res: Response) => {
  const mock = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) => res,
  )
  vi.stubGlobal("fetch", mock)
  return mock
}

const hangingFetch = (_input: RequestInfo | URL, init?: RequestInit) =>
  new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal?.reason))
  })

const URL_A = "https://x.test/a"

afterEach(() => vi.unstubAllGlobals())

describe("fetchJson", () => {
  it("parses a 2xx JSON body and asks for JSON", async () => {
    const mock = stubFetch(new Response('{"id":1}', { status: 200 }))
    expect(await fetchJson<{ id: number }>(URL_A)).toEqual({ id: 1 })
    const init = mock.mock.calls[0][1]
    expect(new Headers(init?.headers).get("Accept")).toBe("application/json")
  })

  it("returns undefined for 204 and for an empty 2xx body", async () => {
    stubFetch(new Response(null, { status: 204 }))
    expect(await fetchJson(URL_A)).toBeUndefined()
    stubFetch(new Response("  ", { status: 200 }))
    expect(await fetchJson(URL_A)).toBeUndefined()
  })

  it("throws the HttpError subclass for the status with code and details", async () => {
    stubFetch(
      new Response('{"message":"No such user","code":"user_missing"}', {
        status: 404,
      }),
    )
    const error = await rejection(fetchJson(URL_A))
    expect(error).toBeInstanceOf(NotFoundError)
    expect(error).toMatchObject({
      status: 404,
      message: "No such user",
      code: "user_missing",
      details: { message: "No such user", code: "user_missing" },
    })
  })

  it("maps 409, unknown statuses and non-JSON error bodies", async () => {
    stubFetch(new Response("{}", { status: 409 }))
    expect(await rejection(fetchJson(URL_A))).toBeInstanceOf(ConflictError)
    stubFetch(new Response("<html>boom</html>", { status: 502 }))
    const error = await rejection(fetchJson(URL_A))
    expect(error).toBeInstanceOf(HttpError)
    expect(error).toMatchObject({
      status: 502,
      message: "HTTP 502",
      details: "<html>boom</html>",
    })
  })

  it("exposes Retry-After on 429", async () => {
    stubFetch(
      new Response("{}", { status: 429, headers: { "Retry-After": "7" } }),
    )
    const error = await rejection(fetchJson(URL_A))
    expect(error).toBeInstanceOf(TooManyRequestsError)
    expect(error.retryAfterSeconds).toBe(7)
  })

  it("throws HEROW_INVALID_JSON with the real status, cause and a 200 char excerpt", async () => {
    stubFetch(new Response(`<html>${"x".repeat(500)}`, { status: 200 }))
    const error = await rejection(fetchJson(URL_A))
    expect(error).toBeInstanceOf(HttpError)
    expect(error.status).toBe(200)
    expect(error.code).toBe("HEROW_INVALID_JSON")
    expect(error.cause).toBeInstanceOf(SyntaxError)
    expect(error.details?.body).toHaveLength(200)
    expect(error.message).toContain("docs/errors.md#herow_invalid_json")
    expect(error.message).not.toContain("xxxx")
  })

  it("rejects with a TimeoutError when timeoutMs elapses", async () => {
    vi.stubGlobal("fetch", vi.fn(hangingFetch))
    const error = await rejection(fetchJson(URL_A, {}, { timeoutMs: 10 }))
    expect(error.name).toBe("TimeoutError")
  })
})

describe("fetchWithTimeout", () => {
  it("aborts the request with a TimeoutError", async () => {
    vi.stubGlobal("fetch", vi.fn(hangingFetch))
    const error = await rejection(
      fetchWithTimeout(URL_A, {}, { timeoutMs: 10 }),
    )
    expect(error.name).toBe("TimeoutError")
  })

  it("keeps the caller signal working alongside the timeout", async () => {
    const controller = new AbortController()
    vi.stubGlobal("fetch", vi.fn(hangingFetch))
    const pending = rejection(
      fetchWithTimeout(
        URL_A,
        { signal: controller.signal },
        { timeoutMs: 60_000 },
      ),
    )
    controller.abort(new Error("user"))
    expect((await pending).message).toBe("user")
  })

  it("passes init through untouched without a timeout", async () => {
    const mock = stubFetch(new Response("ok"))
    const init = { method: "POST" }
    await fetchWithTimeout(URL_A, init)
    expect(mock).toHaveBeenCalledWith(URL_A, init)
  })
})
