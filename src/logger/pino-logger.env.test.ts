import { afterEach, describe, expect, it } from "vitest"
import { createLogger, createPinoInstance } from "./pino-logger"

const ORIGINAL_ENV = process.env.NODE_ENV
const ORIGINAL_LOG_LEVEL = process.env.LOG_LEVEL

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_ENV
  if (ORIGINAL_LOG_LEVEL === undefined) delete process.env.LOG_LEVEL
  else process.env.LOG_LEVEL = ORIGINAL_LOG_LEVEL
})

describe("pino-logger LOG_LEVEL", () => {
  it.each(["bogus", "toString", "__proto__"])(
    "falls back to the default level when LOG_LEVEL=%s",
    (value) => {
      process.env.NODE_ENV = "production"
      process.env.LOG_LEVEL = value

      expect(createPinoInstance({ service: "s" }).level).toBe("info")
    },
  )

  it("honors pino-only levels from the environment", () => {
    process.env.NODE_ENV = "production"
    process.env.LOG_LEVEL = "trace"

    expect(createPinoInstance({ service: "s" }).level).toBe("trace")
  })

  it("prefers the explicit level option", () => {
    process.env.NODE_ENV = "production"
    process.env.LOG_LEVEL = "trace"

    expect(createPinoInstance({ service: "s", level: "warn" }).level).toBe(
      "warn",
    )
  })

  it("createLogger returns a working ILogger", () => {
    process.env.NODE_ENV = "production"
    const log = createLogger({ service: "s", level: "error" })

    expect(() => log.child({ a: 1 }).error("evt", { b: 2 })).not.toThrow()
  })
})
