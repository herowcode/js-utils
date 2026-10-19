import { describe, expect, it } from "vitest"
import { herowError } from "./herow-error"

describe("herowError", () => {
  it("joins what, fix and the lowercased docs anchor", () => {
    const err = herowError(Error, "HEROW_ENV_MISSING", "It broke.", "Fix it.")
    expect(err.code).toBe("HEROW_ENV_MISSING")
    expect(err.message).toBe(
      "It broke. Fix it. See https://github.com/herowcode/js-utils/blob/main/docs/errors.md#herow_env_missing",
    )
  })

  it("keeps the requested error class", () => {
    expect(
      herowError(TypeError, "HEROW_PARSE_BOOLEAN_INVALID", "a", "b"),
    ).toBeInstanceOf(TypeError)
  })
})
