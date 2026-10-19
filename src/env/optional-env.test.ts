import { describe, expect, it } from "vitest"
import { optionalEnv } from "./optional-env"

describe("optionalEnv", () => {
  it("returns the value when present", () => {
    expect(optionalEnv("A", "d", { env: { A: "x" } })).toBe("x")
  })

  it("treats unset, empty and whitespace-only as missing", () => {
    expect(optionalEnv("A", "d", { env: {} })).toBe("d")
    expect(optionalEnv("A", "d", { env: { A: "" } })).toBe("d")
    expect(optionalEnv("A", "d", { env: { A: "  " } })).toBe("d")
  })

  it("returns undefined without a fallback", () => {
    expect(optionalEnv("A", undefined, { env: {} })).toBeUndefined()
  })

  it("throws HEROW_ENV_NO_SOURCE without a source", () => {
    expect(() => optionalEnv("A", "d", { env: undefined })).toThrow(
      expect.objectContaining({ code: "HEROW_ENV_NO_SOURCE" }),
    )
  })
})
