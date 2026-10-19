import { describe, expect, it } from "vitest"
import { redactDeep } from "./redact-deep"

describe("redactDeep key variants", () => {
  it("redacts camelCase, snake_case and kebab-case spellings", () => {
    const input = {
      userPassword: "a",
      refresh_token: "b",
      "x-api-key": "c",
      privateKey: "d",
      "Set-Cookie": "e",
      clientSecret: "f",
      accessToken: "g",
      passwd: "h",
      name: "keep",
      tokenizer: "keep",
    }
    expect(redactDeep(input)).toEqual({
      userPassword: "[REDACTED]",
      refresh_token: "[REDACTED]",
      "x-api-key": "[REDACTED]",
      privateKey: "[REDACTED]",
      "Set-Cookie": "[REDACTED]",
      clientSecret: "[REDACTED]",
      accessToken: "[REDACTED]",
      passwd: "[REDACTED]",
      name: "keep",
      tokenizer: "keep",
    })
  })
})
