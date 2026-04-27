import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createLogger } from "./console-logger"

const ORIGINAL_ENV = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_ENV
  vi.restoreAllMocks()
})

describe("browser createLogger — single emission contract", () => {
  it("emits one console.log line in production with msg + ctx merged", () => {
    process.env.NODE_ENV = "production"
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    const log = createLogger({ service: "smoke", level: "info" })
    log.info("evt_name", { a: 1, durationMs: 340 })

    expect(spy).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(spy.mock.calls[0][0] as string)
    expect(payload).toMatchObject({
      level: "info",
      service: "smoke",
      msg: "evt_name",
      a: 1,
      durationMs: 340,
    })
    expect(payload.time).toMatch(/\dT\d/)
  })

  it("logs without ctx still emits exactly one line", () => {
    process.env.NODE_ENV = "production"
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    createLogger({ service: "smoke", level: "info" }).warn("just_msg")

    expect(spy).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(spy.mock.calls[0][0] as string)
    expect(payload.msg).toBe("just_msg")
    expect(payload.level).toBe("warn")
  })

  it("redacts sensitive fields", () => {
    process.env.NODE_ENV = "production"
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    createLogger({ service: "smoke", level: "info" }).info("auth_attempt", {
      email: "a@b.com",
      password: "supersecret",
      token: "abc123",
    })

    const payload = JSON.parse(spy.mock.calls[0][0] as string)
    expect(payload.password).toBe("[REDACTED]")
    expect(payload.token).toBe("[REDACTED]")
  })

  it("child() merges bindings into every subsequent log", () => {
    process.env.NODE_ENV = "production"
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    const root = createLogger({ service: "smoke", level: "info" })
    const child = root.child({ request_id: "r1", user_id: "u1" })
    child.info("evt", { foo: "bar" })

    const payload = JSON.parse(spy.mock.calls[0][0] as string)
    expect(payload.request_id).toBe("r1")
    expect(payload.user_id).toBe("u1")
    expect(payload.foo).toBe("bar")
  })

  it("respects level threshold", () => {
    process.env.NODE_ENV = "production"
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    const log = createLogger({ service: "smoke", level: "warn" })
    log.debug("ignored")
    log.info("ignored_too")
    log.warn("kept")
    log.error("kept_too")

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it("defaults to info level in production when no override given", () => {
    process.env.NODE_ENV = "production"
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    const log = createLogger({ service: "smoke" })
    log.info("ignored")
    log.warn("kept")

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it("serializes Error in err field", () => {
    process.env.NODE_ENV = "production"
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    const err = new Error("boom")
    createLogger({ service: "smoke", level: "info" }).error("job_failed", {
      err,
      jobId: "j1",
    })

    const payload = JSON.parse(spy.mock.calls[0][0] as string)
    expect(payload.err).toMatchObject({ name: "Error", message: "boom" })
    expect(typeof payload.err.stack).toBe("string")
    expect(payload.jobId).toBe("j1")
  })
})

describe("browser createLogger — dev mode", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "development"
  })

  it("uses console.info for info level in dev", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {})

    createLogger({ service: "smoke", level: "debug" }).info("evt", { a: 1 })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain("[smoke]")
    expect(spy.mock.calls[0][0]).toContain("evt")
    expect(spy.mock.calls[0][1]).toMatchObject({ a: 1 })
  })

  it("uses console.error for error level in dev", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    createLogger({ service: "smoke", level: "debug" }).error("oh_no")

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
