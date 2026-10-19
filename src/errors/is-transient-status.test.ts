import { describe, expect, it } from "vitest"
import { isTransientStatus } from "./is-transient-status"
import { TRANSIENT_STATUS_CODES } from "./transient-status-codes"

describe("isTransientStatus", () => {
  it.each([408, 429, 500, 502, 503, 504])("%i is transient", (status) => {
    expect(isTransientStatus(status)).toBe(true)
  })

  it.each([200, 400, 401, 404, 501, 505, "503", undefined, null])(
    "%j is not transient",
    (status) => {
      expect(isTransientStatus(status)).toBe(false)
    },
  )

  it("exposes the shared list", () => {
    expect([...TRANSIENT_STATUS_CODES]).toEqual([408, 429, 500, 502, 503, 504])
  })
})
