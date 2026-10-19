import { describe, expect, it } from "vitest"
import { getRootCause } from "./get-root-cause"

describe("getRootCause", () => {
  it("returns the error itself without a cause", () => {
    const e = new Error("a")
    expect(getRootCause(e)).toBe(e)
  })

  it("returns the last link", () => {
    const c = new Error("c")
    expect(
      getRootCause(new Error("a", { cause: new Error("b", { cause: c }) })),
    ).toBe(c)
  })

  it("returns a string cause", () => {
    expect(getRootCause(new Error("a", { cause: "why" }))).toBe("why")
  })

  it("terminates on a cycle", () => {
    const a: { cause?: unknown } = {}
    const b = { cause: a }
    a.cause = b
    expect(getRootCause(a)).toBe(b)
  })
})
