import { describe, expect, it } from "vitest"
import { HttpError, TooManyRequestsError } from "./http-error"

describe("HttpError validation", () => {
  it.each([0, 99, 600, 404.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects status %s",
    (status) => {
      expect(() => new HttpError(status)).toThrow(
        expect.objectContaining({
          code: "HEROW_HTTP_INVALID_STATUS",
          name: "RangeError",
        }),
      )
    },
  )

  it.each([100, 200, 503, 599])("accepts status %s", (status) => {
    expect(new HttpError(status).status).toBe(status)
  })

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    "ignores retryAfterSeconds %s",
    (value) => {
      expect(
        new TooManyRequestsError("x", { retryAfterSeconds: value })
          .retryAfterSeconds,
      ).toBeUndefined()
    },
  )

  it("keeps a valid retryAfterSeconds, including 0", () => {
    expect(
      new HttpError(503, "x", { retryAfterSeconds: 0 }).retryAfterSeconds,
    ).toBe(0)
  })
})
