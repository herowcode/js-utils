import { describe, expect, it } from "vitest"
import { browserRedact } from "./redact"

describe("browserRedact", () => {
  it("redacts default keys case-insensitively at any depth", () => {
    const out = browserRedact({ a: { Password: "x", list: [{ token: "t" }] } })
    expect(out).toEqual({
      a: { Password: "[REDACTED]", list: [{ token: "[REDACTED]" }] },
    })
  })

  it("redacts extra keys", () => {
    expect(browserRedact({ ssn: "1" }, ["SSN"])).toEqual({ ssn: "[REDACTED]" })
  })

  it("serializes Date as an ISO string", () => {
    const out = browserRedact({ at: new Date("2024-01-02T03:04:05.000Z") })
    expect(out).toEqual({ at: "2024-01-02T03:04:05.000Z" })
  })

  it("does not throw on an invalid Date", () => {
    expect(browserRedact({ at: new Date("nope") })).toEqual({
      at: "Invalid Date",
    })
  })

  it("serializes nested Errors with own props, redacting secrets", () => {
    const err = Object.assign(new Error("boom"), {
      code: "E_X",
      token: "secret",
    })
    const out = browserRedact({ wrapped: { err } }) as unknown as {
      wrapped: { err: Record<string, unknown> }
    }

    expect(out.wrapped.err).toMatchObject({
      name: "Error",
      message: "boom",
      code: "E_X",
      token: "[REDACTED]",
    })
    expect(out.wrapped.err.stack).toEqual(expect.any(String))
  })

  it("keeps Error.cause", () => {
    const err = new Error("outer", { cause: new Error("inner") })
    const out = browserRedact({ err }) as {
      err: { cause: { message: string } }
    }
    expect(out.err.cause.message).toBe("inner")
  })

  it("turns Map into a redacted plain object and Set into an array", () => {
    const out = browserRedact({
      m: new Map<string, unknown>([
        ["k", 1],
        ["password", "p"],
      ]),
      s: new Set([1, 2]),
    })
    expect(out).toEqual({
      m: { k: 1, password: "[REDACTED]" },
      s: [1, 2],
    })
  })

  it("serializes URL and RegExp as strings", () => {
    const out = browserRedact({
      u: new URL("https://example.com/a"),
      r: /ab+c/g,
    })
    expect(out).toEqual({ u: "https://example.com/a", r: "/ab+c/g" })
  })

  it("replaces circular references with [Circular]", () => {
    const a: Record<string, unknown> = { name: "a" }
    a.self = a
    a.list = [a]
    expect(browserRedact(a)).toEqual({
      name: "a",
      self: "[Circular]",
      list: ["[Circular]"],
    })
  })

  it("does not flag repeated non-circular references", () => {
    const shared = { x: 1 }
    expect(browserRedact({ a: shared, b: shared })).toEqual({
      a: { x: 1 },
      b: { x: 1 },
    })
  })

  it("passes primitives and null through", () => {
    expect(browserRedact(null)).toBeNull()
    expect(browserRedact(5)).toBe(5)
    expect(browserRedact("s")).toBe("s")
  })
})
