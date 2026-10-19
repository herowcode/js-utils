import { describe, expect, it } from "vitest"
import { parseBoolean } from "./parse-boolean"

describe("parseBoolean", () => {
  it.each(["true", "1", "yes", "y", "on", " TRUE ", "Yes", "ON", "\tY\n"])(
    "parses %j as true",
    (value) => expect(parseBoolean(value)).toBe(true),
  )

  it.each(["false", "0", "no", "n", "off", "", "  ", "FALSE", " Off "])(
    "parses %j as false",
    (value) => expect(parseBoolean(value)).toBe(false),
  )

  it("passes booleans and 1/0 through", () => {
    expect(parseBoolean(true)).toBe(true)
    expect(parseBoolean(false)).toBe(false)
    expect(parseBoolean(1)).toBe(true)
    expect(parseBoolean(0)).toBe(false)
  })

  it("returns the fallback for unrecognized input", () => {
    for (const value of [undefined, null, "maybe", 2, {}, "truee"]) {
      expect(parseBoolean(value, true)).toBe(true)
      expect(parseBoolean(value, false)).toBe(false)
    }
  })

  it("does not use the fallback for recognized values", () => {
    expect(parseBoolean("", true)).toBe(false)
    expect(parseBoolean("yes", false)).toBe(true)
  })

  it("throws a coded TypeError without echoing the value", () => {
    let caught: (TypeError & { code?: string }) | undefined
    try {
      parseBoolean("super-secret-token")
    } catch (e) {
      caught = e as TypeError & { code?: string }
    }
    expect(caught).toBeInstanceOf(TypeError)
    expect(caught?.code).toBe("HEROW_PARSE_BOOLEAN_INVALID")
    expect(caught?.message).not.toContain("super-secret-token")
    expect(caught?.message).toContain("fallback")
    expect(caught?.message).toContain(
      "docs/errors.md#herow_parse_boolean_invalid",
    )
    expect(() => parseBoolean(undefined)).toThrow(TypeError)
  })
})
