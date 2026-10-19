import { describe, expect, it } from "vitest"
import {
  buildWhatsAppLink,
  formatPhone,
  getBRMobileVariants,
  normalizePhone,
  onlyDigits,
} from "."

describe("onlyDigits", () => {
  it("keeps digits and tolerates other types", () => {
    expect(onlyDigits("+55 (11) 99999-9999")).toBe("5511999999999")
    expect(onlyDigits(1234)).toBe("1234")
    expect(onlyDigits(null)).toBe("")
    expect(onlyDigits({})).toBe("")
    expect(onlyDigits(Number.NaN)).toBe("")
  })

  it("stays linear on 100 KB input", () => {
    const start = performance.now()
    onlyDigits(`${"a".repeat(100_000)}1`)
    expect(performance.now() - start).toBeLessThan(50)
  })
})

describe("normalizePhone", () => {
  it.each([
    ["(11) 99999-9999", "+5511999999999"],
    ["11999999999", "+5511999999999"],
    ["+55 11 99999-9999", "+5511999999999"],
    ["5511999999999", "+5511999999999"],
    ["0055 11 99999-9999", "+5511999999999"],
    ["011 99999-9999", "+5511999999999"],
    ["(11) 3333-4444", "+551133334444"],
    ["55 11 3333-4444", "+551133334444"],
    ["(55) 3333-4444", "+555533334444"],
    ["(11) 9999-9999", "+551199999999"],
  ])("normalizes BR %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each([
    "",
    "123",
    "(00) 99999-9999",
    "(11) 89999-9999",
    "(11) 13333-4444",
    "+44 20 7946 0958",
    "119999999999999",
  ])("returns null for invalid BR %s", (input) => {
    expect(normalizePhone(input)).toBeNull()
  })

  it("normalizes US numbers", () => {
    expect(normalizePhone("(415) 555-2671", { country: "US" })).toBe(
      "+14155552671",
    )
    expect(normalizePhone("+1 415 555 2671", { country: "US" })).toBe(
      "+14155552671",
    )
    expect(normalizePhone("1-415-555-2671", { country: "US" })).toBe(
      "+14155552671",
    )
    expect(normalizePhone("(115) 555-2671", { country: "US" })).toBeNull()
    expect(normalizePhone("(415) 155-2671", { country: "US" })).toBeNull()
    expect(normalizePhone("5511999999999", { country: "US" })).toBeNull()
  })

  it("uses the fallback for invalid input", () => {
    expect(normalizePhone("abc", { fallback: "" })).toBe("")
    expect(normalizePhone(undefined)).toBeNull()
  })
})

describe("formatPhone", () => {
  it("formats BR mobile and landline numbers", () => {
    expect(formatPhone("+5511999999999")).toBe("(11) 99999-9999")
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444")
    expect(formatPhone("11999999999", { international: true })).toBe(
      "+55 (11) 99999-9999",
    )
  })

  it("formats US numbers", () => {
    expect(formatPhone("4155552671", { country: "US" })).toBe("(415) 555-2671")
    expect(
      formatPhone("4155552671", { country: "US", international: true }),
    ).toBe("+1 (415) 555-2671")
  })

  it("returns the fallback for invalid input", () => {
    expect(formatPhone("123")).toBe("")
    expect(formatPhone("123", { fallback: "n/a" })).toBe("n/a")
  })
})

describe("getBRMobileVariants", () => {
  it("lists with and without the 9th digit", () => {
    expect(getBRMobileVariants("(11) 99999-9999")).toEqual([
      "+5511999999999",
      "+551199999999",
    ])
    expect(getBRMobileVariants("1199999999")).toEqual([
      "+5511999999999",
      "+551199999999",
    ])
  })

  it("returns one entry for a landline and [] for invalid input", () => {
    expect(getBRMobileVariants("1133334444")).toEqual(["+551133334444"])
    expect(getBRMobileVariants("nope")).toEqual([])
  })
})

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with an encoded message", () => {
    expect(buildWhatsAppLink("(11) 99999-9999")).toBe(
      "https://wa.me/5511999999999",
    )
    expect(
      buildWhatsAppLink("11999999999", { message: "Olá, tudo bem?" }),
    ).toBe("https://wa.me/5511999999999?text=Ol%C3%A1%2C%20tudo%20bem%3F")
    expect(buildWhatsAppLink("4155552671", { country: "US" })).toBe(
      "https://wa.me/14155552671",
    )
  })

  it("returns the fallback for invalid numbers", () => {
    expect(buildWhatsAppLink("123")).toBe("")
    expect(buildWhatsAppLink("123", { fallback: "#" })).toBe("#")
  })
})
