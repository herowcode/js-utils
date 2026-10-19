import { describe, expect, expectTypeOf, it } from "vitest"
import { tryCatchResult } from "./try-catch-result"

describe("tryCatchResult", () => {
  it("returns ok with data for a resolved promise", async () => {
    expect(await tryCatchResult(Promise.resolve(1))).toEqual({
      ok: true,
      data: 1,
    })
  })

  it("accepts sync and async functions", async () => {
    expect(await tryCatchResult(() => 2)).toEqual({ ok: true, data: 2 })
    expect(await tryCatchResult(async () => 3)).toEqual({ ok: true, data: 3 })
  })

  it("captures rejections and thrown errors", async () => {
    const boom = new Error("boom")
    expect(await tryCatchResult(Promise.reject(boom))).toEqual({
      ok: false,
      error: boom,
    })
    expect(
      await tryCatchResult(() => {
        throw boom
      }),
    ).toEqual({ ok: false, error: boom })
  })

  it("keeps a falsy data value distinct from failure", async () => {
    const r = await tryCatchResult(Promise.resolve(0))
    expect(r.ok).toBe(true)
  })

  it("narrows on ok", async () => {
    const r = await tryCatchResult(Promise.resolve("x"))
    if (!r.ok) {
      expectTypeOf(r.error).toEqualTypeOf<Error>()
      return
    }
    expectTypeOf(r.data).toEqualTypeOf<string>()
  })
})
