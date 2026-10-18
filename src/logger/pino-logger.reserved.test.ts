import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  options: [] as Record<string, unknown>[],
  calls: [] as unknown[][],
  childBindings: [] as unknown[],
  requireError: undefined as Error | undefined,
}))

vi.mock("node:module", () => {
  const fakeLogger = () => ({
    info: (...args: unknown[]) => state.calls.push(args),
    debug: (...args: unknown[]) => state.calls.push(args),
    warn: (...args: unknown[]) => state.calls.push(args),
    error: (...args: unknown[]) => state.calls.push(args),
    child: (bindings: unknown) => {
      state.childBindings.push(bindings)
      return fakeLogger()
    },
  })
  const pino = Object.assign(
    (options: Record<string, unknown>) => {
      state.options.push(options)
      return fakeLogger()
    },
    { stdTimeFunctions: { isoTime: () => "" } },
  )
  const createRequire = () => () => {
    if (state.requireError) throw state.requireError
    return pino
  }
  return { createRequire, default: { createRequire } }
})

beforeEach(() => {
  state.options.length = 0
  state.calls.length = 0
  state.childBindings.length = 0
  state.requireError = undefined
  vi.resetModules()
  process.env.NODE_ENV = "production"
})

describe("pino-logger reserved fields", () => {
  it("keeps service and env when bindings try to override them", async () => {
    const { createLogger } = await import("./pino-logger")

    createLogger({
      service: "api",
      bindings: { service: "evil", env: "fake", region: "eu" },
    })

    expect(state.options[0]?.base).toEqual({
      service: "api",
      env: "production",
      region: "eu",
    })
  })

  it("drops reserved keys from the log context", async () => {
    const { createLogger } = await import("./pino-logger")

    createLogger({ service: "api" }).info("event", {
      level: "fatal",
      msg: "spoofed",
      time: 0,
      service: "evil",
      env: "fake",
      userId: 1,
    })

    expect(state.calls[0]).toEqual([{ userId: 1 }, "event"])
  })

  it("drops reserved keys from child bindings", async () => {
    const { createLogger } = await import("./pino-logger")

    createLogger({ service: "api" }).child({ msg: "x", requestId: "r1" })

    expect(state.childBindings[0]).toEqual({ requestId: "r1" })
  })
})

describe("pino-logger loader errors", () => {
  it("rethrows a missing transitive module unchanged", async () => {
    const error = Object.assign(new Error("Cannot find module 'sonic-boom'"), {
      code: "MODULE_NOT_FOUND",
    })
    state.requireError = error
    const { createLogger } = await import("./pino-logger")

    expect(() => createLogger({ service: "api" })).toThrow(error)
  })

  it("rethrows errors that are not about a missing module", async () => {
    const error = new SyntaxError("Unexpected token")
    state.requireError = error
    const { createLogger } = await import("./pino-logger")

    expect(() => createLogger({ service: "api" })).toThrow(error)
  })
})
