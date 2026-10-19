import { describe, expect, it } from "vitest"
import { formatPhone } from "./format-phone"
import { normalizePhone } from "./normalize-phone"

describe("leading + selects the country", () => {
  it("keeps a +1 US number under the default BR country", () => {
    expect(normalizePhone("+14155552671")).toBe("+14155552671")
  })

  it("ignores the country option when the number has a +", () => {
    expect(normalizePhone("+5511999999999", { country: "US" })).toBe(
      "+5511999999999",
    )
    expect(normalizePhone("+1 (415) 555-2671", { country: "BR" })).toBe(
      "+14155552671",
    )
  })

  it("treats unknown prefixes as invalid", () => {
    expect(normalizePhone("+447911123456")).toBeNull()
    expect(normalizePhone("+447911123456", { fallback: "" })).toBe("")
  })

  it("still uses the country option without a +", () => {
    expect(normalizePhone("4155552671", { country: "US" })).toBe("+14155552671")
  })

  it("formats by the + country", () => {
    expect(formatPhone("+14155552671")).toBe("(415) 555-2671")
  })
})
