import { describe, expect, it } from "vitest"
import { getErrorMessage } from "./get-error-message"

describe("getErrorMessage", () => {
  it("returns non-empty strings as is", () => {
    expect(getErrorMessage("boom")).toBe("boom")
  })

  it("reads Error messages", () => {
    expect(getErrorMessage(new Error("bad"))).toBe("bad")
  })

  it("tries keys in order", () => {
    expect(getErrorMessage({ error: "e", detail: "d" })).toBe("e")
    expect(getErrorMessage({ message: "", detail: "d" })).toBe("d")
  })

  it("checks a nested object one level down", () => {
    expect(getErrorMessage({ error: { message: "deep" } })).toBe("deep")
    expect(getErrorMessage({ error: { error: { message: "too deep" } } })).toBe(
      "Unknown error",
    )
  })

  it("supports custom keys", () => {
    expect(getErrorMessage({ title: "t" }, { keys: ["title"] })).toBe("t")
  })

  it("returns the fallback for everything else, never [object Object]", () => {
    expect(getErrorMessage(undefined)).toBe("Unknown error")
    expect(getErrorMessage(null)).toBe("Unknown error")
    expect(getErrorMessage(42)).toBe("Unknown error")
    expect(getErrorMessage({})).toBe("Unknown error")
    expect(getErrorMessage("  ")).toBe("Unknown error")
    expect(getErrorMessage({ message: 5 }, { fallback: "nope" })).toBe("nope")
  })

  it("reads only the top-level message, not the cause", () => {
    expect(
      getErrorMessage(new Error("outer", { cause: new Error("inner") })),
    ).toBe("outer")
  })
})
