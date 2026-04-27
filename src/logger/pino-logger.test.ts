import { Writable } from "node:stream"
import pino from "pino"
import { afterEach, describe, expect, it } from "vitest"
import { DEFAULT_REDACT_PATHS } from "./redact"
import type { ICreateLoggerOptions, ILogger } from "./types"

const ORIGINAL_ENV = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_ENV
})

interface ICaptureHandle {
  logger: ILogger
  lines: () => Record<string, unknown>[]
}

function capture(
  opts: Omit<ICreateLoggerOptions, "service"> = {},
): ICaptureHandle {
  const buf: string[] = []
  const stream = new Writable({
    write(chunk, _enc, cb) {
      buf.push(chunk.toString())
      cb()
    },
  })

  // Build the pino instance against the capture stream and wrap by hand,
  // matching the same wrap shape used in create-logger.node.ts.
  const p = pino(
    {
      level: opts.level ?? "debug",
      base: {
        service: "smoke",
        env: process.env.NODE_ENV ?? "development",
        ...opts.bindings,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: { level: (label) => ({ level: label }) },
      redact: {
        paths: [...DEFAULT_REDACT_PATHS, ...(opts.redact ?? [])],
        censor: "[REDACTED]",
      },
    },
    stream,
  )

  const wrap = (inst: pino.Logger): ILogger => ({
    debug: (msg, ctx) => (ctx ? inst.debug(ctx, msg) : inst.debug(msg)),
    info: (msg, ctx) => (ctx ? inst.info(ctx, msg) : inst.info(msg)),
    warn: (msg, ctx) => (ctx ? inst.warn(ctx, msg) : inst.warn(msg)),
    error: (msg, ctx) => (ctx ? inst.error(ctx, msg) : inst.error(msg)),
    child: (bindings) => wrap(inst.child(bindings)),
  })

  return {
    logger: wrap(p),
    lines: () =>
      buf
        .join("")
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l) as Record<string, unknown>),
  }
}

describe("node createLogger — single emission contract", () => {
  it("emits one JSON line with msg + ctx merged", () => {
    const { logger, lines } = capture()
    logger.info("evt_name", { a: 1, durationMs: 340 })

    const out = lines()
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      level: "info",
      service: "smoke",
      msg: "evt_name",
      a: 1,
      durationMs: 340,
    })
    expect(out[0].time).toEqual(expect.any(String))
  })

  it("emits one line when ctx is omitted", () => {
    const { logger, lines } = capture()
    logger.warn("just_msg")
    expect(lines()).toHaveLength(1)
    expect(lines()[0]).toMatchObject({ msg: "just_msg", level: "warn" })
  })

  it("redacts sensitive fields by default", () => {
    const { logger, lines } = capture()
    logger.info("auth_attempt", {
      email: "a@b.com",
      password: "secret",
      token: "abc",
    })
    const payload = lines()[0]
    expect(payload.password).toBe("[REDACTED]")
    expect(payload.token).toBe("[REDACTED]")
  })

  it("child() preserves bindings across calls", () => {
    const { logger, lines } = capture()
    const child = logger.child({ request_id: "r1", user_id: "u1" })
    child.info("evt", { foo: "bar" })
    child.error("evt2")

    const out = lines()
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({
      request_id: "r1",
      user_id: "u1",
      foo: "bar",
    })
    expect(out[1]).toMatchObject({ request_id: "r1", user_id: "u1" })
  })

  it("emits level as string label, not number", () => {
    const { logger, lines } = capture()
    logger.error("boom")
    expect(lines()[0].level).toBe("error")
  })

  it("expands Error in err context field", () => {
    const { logger, lines } = capture()
    logger.error("job_failed", { err: new Error("boom"), jobId: "j1" })

    const payload = lines()[0]
    expect(payload.err).toMatchObject({ type: "Error", message: "boom" })
    expect(payload.jobId).toBe("j1")
  })
})
