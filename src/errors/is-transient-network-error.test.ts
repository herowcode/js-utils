import vm from "node:vm"
import { describe, expect, it } from "vitest"
import { isTransientNetworkError } from "./is-transient-network-error"

const withCode = (code: string, cause?: unknown) =>
  Object.assign(new Error(code, { cause }), { code })

describe("isTransientNetworkError", () => {
  it.each([
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "EPIPE",
    "EAI_AGAIN",
    "ENOTFOUND",
    "UND_ERR_SOCKET",
    "UND_ERR_CONNECT_TIMEOUT",
  ])("true for code %s", (code) => {
    expect(isTransientNetworkError(withCode(code))).toBe(true)
  })

  it("rejects unrelated UND_ERR codes", () => {
    expect(isTransientNetworkError(withCode("UND_ERR_INVALID_ARG"))).toBe(false)
  })

  it("finds a code at depth 2", () => {
    const err = new Error("a", {
      cause: new Error("b", { cause: withCode("ECONNRESET") }),
    })
    expect(isTransientNetworkError(err)).toBe(true)
  })

  it("finds a code on a plain-object cause and survives cycles", () => {
    expect(
      isTransientNetworkError(new Error("a", { cause: { code: "EPIPE" } })),
    ).toBe(true)
    const a: { cause?: unknown } = {}
    a.cause = { cause: a }
    expect(isTransientNetworkError(a)).toBe(false)
  })

  it("ignores a string cause", () => {
    expect(
      isTransientNetworkError(new Error("a", { cause: "ECONNRESET" })),
    ).toBe(false)
  })

  it("classifies fetch TypeError by cause when present (Node/undici)", () => {
    expect(
      isTransientNetworkError(
        new TypeError("fetch failed", { cause: withCode("ECONNRESET") }),
      ),
    ).toBe(true)
    expect(
      isTransientNetworkError(
        new TypeError("fetch failed", { cause: withCode("CERT_HAS_EXPIRED") }),
      ),
    ).toBe(false)
  })

  it("does not trust the message when a cause exists", () => {
    expect(
      isTransientNetworkError(
        new TypeError("Failed to fetch", { cause: new Error("tls") }),
      ),
    ).toBe(false)
  })

  it.each([
    "Failed to fetch",
    "NetworkError when attempting to fetch resource.",
    "Load failed",
  ])("uses the browser message %j without a cause", (message) => {
    expect(isTransientNetworkError(new TypeError(message))).toBe(true)
  })

  it("rejects other TypeErrors (invalid URL, programming errors)", () => {
    expect(isTransientNetworkError(new TypeError("Invalid URL"))).toBe(false)
    expect(isTransientNetworkError(new TypeError("x is not a function"))).toBe(
      false,
    )
  })

  it("does not treat a plain Error with the browser message as network failure", () => {
    expect(isTransientNetworkError(new Error("Failed to fetch"))).toBe(false)
  })

  it("detects TypeError by name across realms", () => {
    const foreign = vm.runInNewContext('new TypeError("Failed to fetch")')
    expect(foreign instanceof TypeError).toBe(false)
    expect(isTransientNetworkError(foreign)).toBe(true)
  })

  it("treats timeouts as transient only with includeTimeouts", () => {
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" })
    const timeout = Object.assign(new Error("slow"), { name: "TimeoutError" })
    expect(isTransientNetworkError(abort)).toBe(false)
    expect(isTransientNetworkError(timeout)).toBe(false)
    expect(isTransientNetworkError(abort, { includeTimeouts: true })).toBe(true)
    expect(isTransientNetworkError(timeout, { includeTimeouts: true })).toBe(
      true,
    )
    expect(
      isTransientNetworkError(new Error("w", { cause: timeout }), {
        includeTimeouts: true,
      }),
    ).toBe(true)
  })

  it("returns false for everything else", () => {
    expect(isTransientNetworkError(undefined)).toBe(false)
    expect(isTransientNetworkError("ECONNRESET")).toBe(false)
    expect(isTransientNetworkError(new Error("nope"))).toBe(false)
  })
})
