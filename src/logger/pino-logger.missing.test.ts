import { describe, expect, it, vi } from "vitest"

vi.mock("node:module", () => {
  const createRequire = () => () => {
    throw Object.assign(new Error("Cannot find module 'pino'"), {
      code: "MODULE_NOT_FOUND",
    })
  }
  return { createRequire, default: { createRequire } }
})

describe("pino-logger without pino installed", () => {
  it("createLogger throws an actionable error", async () => {
    const { createLogger } = await import("./pino-logger")

    expect(() => createLogger({ service: "s" })).toThrow(
      /@herowcode\/utils\/logger: the Node logger needs "pino"\. Install it with: npm install pino/,
    )
  })

  it("createPinoInstance throws the same error", async () => {
    const { createPinoInstance } = await import("./pino-logger")

    expect(() => createPinoInstance({ service: "s" })).toThrow(
      /npm install pino/,
    )
  })
})
