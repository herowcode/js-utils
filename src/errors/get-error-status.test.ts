import { describe, expect, it } from "vitest"
import { getErrorStatus } from "./get-error-status"

describe("getErrorStatus", () => {
  it("prefers status, then statusCode, then response.status", () => {
    expect(getErrorStatus({ status: 404, statusCode: 500 })).toBe(404)
    expect(getErrorStatus({ statusCode: 500, response: { status: 502 } })).toBe(
      500,
    )
    expect(getErrorStatus({ response: { status: 503 } })).toBe(503)
  })

  it("walks the cause chain", () => {
    expect(getErrorStatus(new Error("a", { cause: { status: 429 } }))).toBe(429)
  })

  it("ignores non-numeric values", () => {
    expect(
      getErrorStatus({ status: "500", statusCode: Number.NaN }),
    ).toBeUndefined()
  })

  it("returns undefined for unknown shapes", () => {
    expect(getErrorStatus(null)).toBeUndefined()
    expect(getErrorStatus("x")).toBeUndefined()
    expect(getErrorStatus(new Error("x"))).toBeUndefined()
  })
})
