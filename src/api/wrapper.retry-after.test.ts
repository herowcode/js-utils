import { describe, expect, it } from "vitest"
import { apiWrapper } from "./wrapper"

const fail = (headers?: Record<string, string>) =>
  apiWrapper(() => Promise.reject(new Response("{}", { status: 429, headers })))

describe("IApiError.retryAfterSeconds", () => {
  it("leaves the error shape unchanged without a Retry-After header", async () => {
    const { error } = await fail()
    expect(error).toMatchObject({ status: 429 })
    expect(error).not.toHaveProperty("retryAfterSeconds")
  })

  it("exposes delta-seconds", async () => {
    const { error } = await fail({ "Retry-After": "30" })
    expect(error?.retryAfterSeconds).toBe(30)
  })

  it("exposes an HTTP date as rounded-up seconds", async () => {
    const date = new Date(Date.now() + 10_000).toUTCString()
    const { error } = await fail({ "Retry-After": date })
    expect(error?.retryAfterSeconds).toBeGreaterThanOrEqual(8)
    expect(error?.retryAfterSeconds).toBeLessThanOrEqual(10)
  })

  it("omits an invalid value", async () => {
    const { error } = await fail({ "Retry-After": "soon" })
    expect(error).not.toHaveProperty("retryAfterSeconds")
  })
})
