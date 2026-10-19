import { describe, expect, it } from "vitest"
import { walkCause } from "./walk-cause"

describe("walkCause", () => {
  it("returns a single link when there is no cause", () => {
    const e = new Error("a")
    expect(walkCause(e)).toEqual([e])
  })

  it("follows nested causes in order", () => {
    const c = new Error("c")
    const b = new Error("b", { cause: c })
    const a = new Error("a", { cause: b })
    expect(walkCause(a)).toEqual([a, b, c])
  })

  it("stops at a cyclic cause", () => {
    const a: { cause?: unknown } = {}
    const b = { cause: a }
    a.cause = b
    expect(walkCause(a)).toEqual([a, b])
  })

  it("inspects a string cause and stops there", () => {
    const a = new Error("a", { cause: "boom" })
    expect(walkCause(a)).toEqual([a, "boom"])
  })

  it("inspects plain-object causes", () => {
    const cause = { code: "ECONNRESET" }
    expect(walkCause({ cause })).toHaveLength(2)
  })

  it("caps the chain at 10 links", () => {
    let err: unknown = new Error("end")
    for (let i = 0; i < 50; i++) err = new Error(`e${i}`, { cause: err })
    expect(walkCause(err)).toHaveLength(10)
  })

  it("handles non-object input", () => {
    expect(walkCause(undefined)).toEqual([undefined])
    expect(walkCause(42)).toEqual([42])
  })
})
