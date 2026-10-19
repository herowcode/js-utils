import { afterEach, describe, expect, it, vi } from "vitest"
import { createLogger } from "./console-logger"
import { browserRedact } from "./redact"

const input = {
  refresh_token: "r1",
  userPassword: "p1",
  "x-api-key": "k1",
  tokenizer: "keep-1",
  name: "keep-2",
}

const ORIGINAL_ENV = process.env.NODE_ENV
afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_ENV
  vi.restoreAllMocks()
})

describe("redact key variants", () => {
  it("browserRedact masks compound secret keys and keeps lookalikes", () => {
    const out = browserRedact(input)
    expect(out.refresh_token).toBe("[REDACTED]")
    expect(out.userPassword).toBe("[REDACTED]")
    expect(out["x-api-key"]).toBe("[REDACTED]")
    expect(out.tokenizer).toBe("keep-1")
    expect(out.name).toBe("keep-2")
  })

  it("applies the same rules in the browser logger", () => {
    process.env.NODE_ENV = "production"
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    createLogger({ service: "smoke", level: "info" }).info("evt", input)
    const payload = JSON.parse(spy.mock.calls[0][0] as string)
    expect(payload.refresh_token).toBe("[REDACTED]")
    expect(payload.userPassword).toBe("[REDACTED]")
    expect(payload["x-api-key"]).toBe("[REDACTED]")
    expect(payload.tokenizer).toBe("keep-1")
    expect(payload.name).toBe("keep-2")
  })
})
