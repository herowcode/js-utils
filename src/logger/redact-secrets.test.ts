import { describe, expect, it } from "vitest"
import { redactSecrets } from "./redact-secrets"

const JWT =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk"

describe("redactSecrets", () => {
  it("masks bearer tokens", () => {
    expect(redactSecrets("Authorization: Bearer abc.def-123")).toBe(
      "Authorization: [REDACTED]",
    )
    expect(redactSecrets("sent bearer abc123 to server")).toBe(
      "sent bearer [REDACTED] to server",
    )
  })

  it("masks JWT-shaped strings", () => {
    expect(redactSecrets(`jwt ${JWT} end`)).toBe("jwt [REDACTED] end")
  })

  it("masks key=value pairs and keeps the key", () => {
    expect(redactSecrets("password=hunter2&user=bob")).toBe(
      "password=[REDACTED]&user=bob",
    )
    expect(redactSecrets("api_key: abc123, other: 1")).toBe(
      "api_key: [REDACTED], other: 1",
    )
    expect(redactSecrets("x-api-key=zzz")).toBe("x-api-key=[REDACTED]")
    expect(redactSecrets("secret = s3cr3t")).toBe("secret = [REDACTED]")
  })

  it("masks JSON pairs and keeps the quotes", () => {
    expect(redactSecrets('{"token": "abc def", "id": 1}')).toBe(
      '{"token": "[REDACTED]", "id": 1}',
    )
    expect(redactSecrets(`{'password':'p w'}`)).toBe(
      `{'password':'[REDACTED]'}`,
    )
    expect(redactSecrets('{"access_token":"abc"}')).toBe(
      '{"access_token":"[REDACTED]"}',
    )
  })

  it("masks whole cookie headers", () => {
    expect(redactSecrets("Cookie: sid=1; theme=dark\nHost: x")).toBe(
      "Cookie: [REDACTED]\nHost: x",
    )
  })

  it("masks common API-key prefixes", () => {
    for (const key of [
      "sk-abcdefghijklmnopqrstuvwx",
      "sk_live_abcdefghijklmnop1234",
      "ghp_abcdefghijklmnopqrstuvwxyz0123456789",
      "xoxb-1234567890-abcdef",
      "AKIAABCDEFGHIJKLMNOP",
      "AIzaSyA-1234567890abcdefghijklmnopqrstuv",
    ]) {
      expect(redactSecrets(`key ${key} done`)).toBe("key [REDACTED] done")
    }
  })

  it("leaves ordinary text alone", () => {
    const text = "User logged in from 10.0.0.1 at 12:00; task-list ok"
    expect(redactSecrets(text)).toBe(text)
  })

  it("does not treat keys inside words as secrets", () => {
    expect(redactSecrets("tokenizer=fast")).toBe("tokenizer=fast")
    expect(redactSecrets("task-abcdefghijklmnopqrstuvwxyz")).toBe(
      "task-abcdefghijklmnopqrstuvwxyz",
    )
  })

  it("applies extraPatterns (RegExp and literal strings)", () => {
    expect(
      redactSecrets("id CUS-123 and a.b", {
        extraPatterns: [/CUS-\d+/, "a.b"],
      }),
    ).toBe("id [REDACTED] and [REDACTED]")
  })

  it("does not break on stateful or empty extra patterns", () => {
    const pattern = /x/g
    expect(redactSecrets("xx", { extraPatterns: [pattern, ""] })).toBe(
      "[REDACTED][REDACTED]",
    )
    expect(redactSecrets("xx", { extraPatterns: [pattern] })).toBe(
      "[REDACTED][REDACTED]",
    )
  })

  it("returns an empty string for non-strings", () => {
    expect(redactSecrets(undefined as unknown as string)).toBe("")
  })

  it("is linear on 100 KB adversarial input", () => {
    const inputs = [
      "eyJ".repeat(33_000),
      "eyJaaaa.".repeat(12_500),
      "Bearer ".repeat(15_000),
      `Bearer${" ".repeat(100_000)}`,
      "password=".repeat(11_000),
      `token${" ".repeat(100_000)}`,
      "token ".repeat(16_000),
      `password="${"a".repeat(100_000)}`,
      "sk-".repeat(33_000),
      "cookie:".repeat(14_000),
      "a".repeat(100_000),
    ]
    for (const input of inputs) {
      const start = performance.now()
      redactSecrets(input)
      expect(performance.now() - start).toBeLessThan(50)
    }
  })
})
