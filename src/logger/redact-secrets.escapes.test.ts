import { describe, expect, it } from "vitest"
import { redactSecrets } from "./redact-secrets"

describe("redactSecrets escapes and URLs", () => {
  it("redacts quoted values containing escaped quotes", () => {
    const out = redactSecrets(JSON.stringify({ password: 'ab"cd' }))
    expect(out).not.toContain("cd")
    expect(out).not.toContain("ab")
  })

  it("redacts escaped quotes in authorization values", () => {
    expect(redactSecrets('{"authorization":"a\\"zz"}')).not.toContain("zz")
  })

  it("redacts connection-URL passwords and keeps the rest", () => {
    expect(redactSecrets("postgres://user:hunter2@host/db")).toBe(
      "postgres://user:[REDACTED]@host/db",
    )
  })

  it("leaves URLs without credentials alone", () => {
    expect(redactSecrets("https://example.com:8080/path")).toBe(
      "https://example.com:8080/path",
    )
  })

  it("stays fast on adversarial URL input", () => {
    const text = "://a:".repeat(20_000)
    const start = performance.now()
    redactSecrets(text)
    expect(performance.now() - start).toBeLessThan(50)
  })
})
