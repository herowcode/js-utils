import { retry } from "../async/retry"
import { getErrorMessage } from "./get-error-message"
import { getErrorStatus } from "./get-error-status"
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  HttpError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "./http-error"
import { isHttpError } from "./is-http-error"

describe("HttpError", () => {
  it("carries status, code, details and cause", () => {
    const cause = new Error("root")
    const err = new HttpError(502, "Bad gateway", {
      code: "UPSTREAM",
      details: { id: 1 },
      cause,
    })
    expect(err).toBeInstanceOf(Error)
    expect(err.status).toBe(502)
    expect(err.message).toBe("Bad gateway")
    expect(err.code).toBe("UPSTREAM")
    expect(err.details).toEqual({ id: 1 })
    expect(err.cause).toBe(cause)
    expect(err.name).toBe("HttpError")
  })

  it("defaults the message and leaves code and details unset", () => {
    const err = new HttpError(500)
    expect(err.message).toBe("HTTP 500")
    expect(err.code).toBeUndefined()
    expect(err.details).toBeUndefined()
    expect(err.cause).toBeUndefined()
  })

  it.each([
    [BadRequestError, 400, "BadRequestError"],
    [UnauthorizedError, 401, "UnauthorizedError"],
    [ForbiddenError, 403, "ForbiddenError"],
    [NotFoundError, 404, "NotFoundError"],
    [ConflictError, 409, "ConflictError"],
    [TooManyRequestsError, 429, "TooManyRequestsError"],
  ] as const)("%o subclass has status %i", (Cls, status, name) => {
    const err = new Cls("custom", { code: "X" })
    expect(err.status).toBe(status)
    expect(err.name).toBe(name)
    expect(err.message).toBe("custom")
    expect(err.code).toBe("X")
    expect(err).toBeInstanceOf(Cls)
    expect(err).toBeInstanceOf(HttpError)
    expect(new Cls().message).not.toBe("")
  })

  it("keeps retryAfterSeconds on TooManyRequestsError only", () => {
    const err = new TooManyRequestsError("slow", { retryAfterSeconds: 12 })
    expect(err.retryAfterSeconds).toBe(12)
    expect(new TooManyRequestsError().retryAfterSeconds).toBeUndefined()
  })

  it("does not mix up sibling subclasses", () => {
    expect(new NotFoundError()).not.toBeInstanceOf(ConflictError)
    expect(new HttpError(404)).not.toBeInstanceOf(NotFoundError)
  })

  it("keeps user subclasses distinct from the base class", () => {
    class Teapot extends HttpError {
      constructor() {
        super(418)
      }
    }
    expect(new Teapot()).toBeInstanceOf(Teapot)
    expect(new Teapot()).toBeInstanceOf(HttpError)
    expect(new HttpError(418)).not.toBeInstanceOf(Teapot)
  })
})

describe("isHttpError", () => {
  it("accepts the family and rejects lookalikes", () => {
    expect(isHttpError(new HttpError(500))).toBe(true)
    expect(isHttpError(new NotFoundError())).toBe(true)
    expect(isHttpError(Object.assign(new Error("x"), { status: 500 }))).toBe(
      false,
    )
    expect(isHttpError({ status: 500 })).toBe(false)
    expect(isHttpError(null)).toBe(false)
    expect(isHttpError("HttpError")).toBe(false)
  })
})

describe("cross-bundle identity", () => {
  async function secondCopy() {
    vi.resetModules()
    return import("./http-error")
  }

  it("recognises an error from another copy of the module via the brand", async () => {
    const other = await secondCopy()
    expect(other.HttpError).not.toBe(HttpError)

    const foreign = new other.NotFoundError("gone")
    expect(foreign instanceof HttpError).toBe(true)
    expect(foreign instanceof NotFoundError).toBe(true)
    expect(foreign instanceof ConflictError).toBe(false)
    expect(isHttpError(foreign)).toBe(true)

    const local = new NotFoundError()
    expect(local instanceof other.HttpError).toBe(true)
    expect(local instanceof other.NotFoundError).toBe(true)
    expect(local instanceof other.ConflictError).toBe(false)
  })

  it("does not let a foreign base error match a subclass", async () => {
    const other = await secondCopy()
    expect(new other.HttpError(404) instanceof NotFoundError).toBe(false)
  })

  it("registers the brand with Symbol.for", () => {
    const brand = Symbol.for("@herowcode/utils.HttpError")
    expect(
      (new HttpError(500) as unknown as Record<symbol, unknown>)[brand],
    ).toBe("HttpError")
  })
})

describe("interop", () => {
  it("getErrorStatus reads HttpError.status, including through a cause", () => {
    expect(getErrorStatus(new ConflictError())).toBe(409)
    expect(
      getErrorStatus(new Error("wrap", { cause: new NotFoundError() })),
    ).toBe(404)
  })

  it("getErrorMessage reads the message", () => {
    expect(getErrorMessage(new BadRequestError("nope"))).toBe("nope")
  })

  it("retry waits retryAfterSeconds on a 429 HttpError", async () => {
    vi.useFakeTimers()
    try {
      const fn = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(
          new TooManyRequestsError("slow", { retryAfterSeconds: 2 }),
        )
        .mockResolvedValueOnce("ok")
      const onRetry = vi.fn()
      const pending = retry(fn, { onRetry })
      await vi.advanceTimersByTimeAsync(2000)
      expect(await pending).toBe("ok")
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(TooManyRequestsError),
        1,
        2000,
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it("retry does not retry a 404 HttpError", async () => {
    const fn = vi.fn().mockRejectedValue(new NotFoundError())
    await expect(retry(fn)).rejects.toBeInstanceOf(NotFoundError)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
