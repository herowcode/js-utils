import { describe, expect, it, vi } from "vitest"
import { requireEnv } from "./require-env"

const URL_BASE =
  "https://github.com/herowcode/js-utils/blob/main/docs/errors.md#"

describe("requireEnv", () => {
  it("returns the value from the injected source", () => {
    expect(requireEnv("A", { env: { A: "value" } })).toBe("value")
  })

  it("throws HEROW_ENV_MISSING when unset, empty or whitespace-only", () => {
    for (const env of [{}, { A: "" }, { A: "   " }, { A: undefined }]) {
      const err = (() => {
        try {
          requireEnv("A", { env })
        } catch (e) {
          return e as Error & { code?: string }
        }
      })()
      expect(err?.code).toBe("HEROW_ENV_MISSING")
      expect(err?.message).toContain('"A"')
      expect(err?.message).toContain(`${URL_BASE}herow_env_missing`)
      expect(err?.message).toMatch(/Set A /)
    }
  })

  it("rejects values shorter than minLength without leaking them", () => {
    const secret = "short-secret"
    let caught: (Error & { code?: string }) | undefined
    try {
      requireEnv("KEY", { env: { KEY: secret }, minLength: 32 })
    } catch (e) {
      caught = e as Error & { code?: string }
    }
    expect(caught?.code).toBe("HEROW_ENV_MISSING")
    expect(caught?.message).toContain("32")
    expect(caught?.message).not.toContain(secret)
  })

  it("accepts a value of exactly minLength", () => {
    expect(requireEnv("K", { env: { K: "abcd" }, minLength: 4 })).toBe("abcd")
  })

  it("throws HEROW_ENV_NO_SOURCE when the source is explicitly undefined", () => {
    expect(() => requireEnv("A", { env: undefined })).toThrow(
      expect.objectContaining({ code: "HEROW_ENV_NO_SOURCE" }),
    )
  })

  it("throws HEROW_ENV_NO_SOURCE when the runtime has no env", () => {
    vi.stubGlobal("process", undefined)
    try {
      expect(() => requireEnv("A")).toThrow(
        expect.objectContaining({ code: "HEROW_ENV_NO_SOURCE" }),
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("explains the fix when there is no source", () => {
    expect(() => requireEnv("A", { env: undefined })).toThrow(
      new RegExp(`Pass one explicitly.*${URL_BASE}herow_env_no_source`),
    )
  })

  it("reads the runtime env by default", () => {
    vi.stubEnv("HEROW_TEST_VAR", "from-runtime")
    try {
      expect(requireEnv("HEROW_TEST_VAR")).toBe("from-runtime")
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
