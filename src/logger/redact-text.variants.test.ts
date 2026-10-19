import { describe, expect, it } from "vitest"
import { redactSecrets } from "./redact-secrets"

describe("redactSecrets key variants", () => {
  it.each([
    ["accessToken=abc123", "accessToken=[REDACTED]"],
    ["refresh_token: abc123", "refresh_token: [REDACTED]"],
    ['{"clientSecret":"abc123"}', '{"clientSecret":"[REDACTED]"}'],
    ["x-api-key=abc123", "x-api-key=[REDACTED]"],
    ["private_key=abc123", "private_key=[REDACTED]"],
    ["passwd=abc123", "passwd=[REDACTED]"],
    ["Authorization: Token abc123", "Authorization: [REDACTED]"],
    ["authorization=Digest abc123 rest", "authorization=[REDACTED] rest"],
    ['"authorization":"Token abc123"', '"authorization":"[REDACTED]"'],
  ])("%s", (input, expected) => {
    expect(redactSecrets(input)).toBe(expected)
  })

  it("stays linear on adversarial input", () => {
    for (const unit of ["a", "a-", "token ", "authorization "]) {
      const text = unit.repeat(Math.ceil(100_000 / unit.length))
      const start = performance.now()
      redactSecrets(text)
      expect(performance.now() - start).toBeLessThan(50)
    }
  })
})
