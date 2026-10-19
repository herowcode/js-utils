import { describe, expect, it } from "vitest"
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "../errors/http-error"
import { httpErrorFromResponse } from "./http-error-from-response"

const make = (status: number, text = "") =>
  httpErrorFromResponse(new Response(null, { status }), text)

describe("httpErrorFromResponse mapping", () => {
  it.each([
    [400, BadRequestError],
    [401, UnauthorizedError],
    [403, ForbiddenError],
  ])("maps %s to its subclass", (status, Klass) => {
    const err = make(status)
    expect(err).toBeInstanceOf(Klass)
    expect(err.status).toBe(status)
  })

  it("falls back to `HTTP <status>` when the body has no message", () => {
    expect(make(401, "{}").message).toBe("HTTP 401")
    expect(make(403).message).toBe("HTTP 403")
  })
})
