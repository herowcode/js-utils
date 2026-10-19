import { describe, expect, it } from "vitest"
import { redactDeep } from "./redact-deep"

describe("redactDeep", () => {
  it("redacts default keys at any depth without mutating the input", () => {
    const input = { a: { password: "x", list: [{ token: "t" }] }, ok: 1 }
    expect(redactDeep(input)).toEqual({
      a: { password: "[REDACTED]", list: [{ token: "[REDACTED]" }] },
      ok: 1,
    })
    expect(input.a.password).toBe("x")
  })

  it("redacts extra keys and paths", () => {
    expect(
      redactDeep(
        { ssn: "1", user: { card: "2", name: "n" } },
        {
          keys: ["ssn", "user.card"],
        },
      ),
    ).toEqual({ ssn: "[REDACTED]", user: { card: "[REDACTED]", name: "n" } })
  })

  it("scrubs secrets inside string values", () => {
    expect(
      redactDeep({
        message: "failed with Bearer abc123",
        nested: ["token=zzz"],
      }),
    ).toEqual({
      message: "failed with Bearer [REDACTED]",
      nested: ["token=[REDACTED]"],
    })
  })

  it("applies custom patterns to strings", () => {
    expect(redactDeep({ note: "id CUS-9" }, { patterns: [/CUS-\d+/] })).toEqual(
      { note: "id [REDACTED]" },
    )
  })

  it("scrubs error stacks and messages", () => {
    const out = redactDeep(new Error("bad password=hunter2")) as {
      message: string
      stack: string
    }
    expect(out.message).toBe("bad password=[REDACTED]")
    expect(out.stack).not.toContain("hunter2")
  })

  it("replaces objects deeper than maxDepth with a placeholder", () => {
    const deep = { a: { b: { c: { d: { secret: "hunter2" } } } } }
    const out = redactDeep(deep, { maxDepth: 2 })
    expect(out).toEqual({ a: { b: { c: "[MaxDepth]" } } })
    expect(JSON.stringify(out)).not.toContain("hunter2")
  })

  it("defaults maxDepth to 8 and fails closed", () => {
    let node: Record<string, unknown> = { leaf: "visible", note: "deep-secret" }
    for (let i = 0; i < 12; i++) node = { child: node }
    const json = JSON.stringify(redactDeep(node))
    expect(json).toContain("[MaxDepth]")
    expect(json).not.toContain("deep-secret")
    expect(JSON.stringify(redactDeep({ a: { b: { c: 1 } } }))).toBe(
      '{"a":{"b":{"c":1}}}',
    )
  })

  it("handles circular references", () => {
    const a: Record<string, unknown> = { name: "a" }
    a.self = a
    expect(redactDeep(a)).toEqual({ name: "a", self: "[Circular]" })
  })

  it("passes primitives through", () => {
    expect(redactDeep(5)).toBe(5)
    expect(redactDeep(null)).toBeNull()
    expect(redactDeep("password=x")).toBe("password=[REDACTED]")
  })

  it("redacts 10k keys in under 50 ms", () => {
    const big: Record<string, unknown> = {}
    for (let i = 0; i < 10_000; i++) {
      big[`key${i}`] = i % 10 === 0 ? { token: `t${i}` } : `value ${i}`
    }
    redactDeep({ warm: "up" })
    const start = performance.now()
    const out = redactDeep(big) as Record<string, unknown>
    expect(performance.now() - start).toBeLessThan(50)
    expect(out.key0).toEqual({ token: "[REDACTED]" })
    expect(out.key1).toBe("value 1")
  })

  it("is fast on a 100 KB adversarial string", () => {
    const start = performance.now()
    redactDeep({ text: "eyJ".repeat(33_000) })
    expect(performance.now() - start).toBeLessThan(50)
  })
})
