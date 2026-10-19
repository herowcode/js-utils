import { describe, expect, it } from "vitest"
import { slugify } from "./slugify"

describe("slugify options", () => {
  it("keeps the default output without options", () => {
    expect(slugify("Olá, Mundo  Cruel!")).toBe("ola-mundo-cruel")
    expect(slugify("Olá, Mundo  Cruel!", {})).toBe("ola-mundo-cruel")
  })

  it("joins with a custom separator", () => {
    expect(slugify("Olá Mundo", { separator: "_" })).toBe("ola_mundo")
    expect(slugify("Olá Mundo", { separator: "" })).toBe("olamundo")
  })

  it("cuts to maxLength without a trailing separator", () => {
    expect(slugify("hello brave world", { maxLength: 6 })).toBe("hello")
    expect(slugify("hello brave world", { maxLength: 7 })).toBe("hello-b")
    expect(slugify("hello", { maxLength: 50 })).toBe("hello")
    expect(slugify("hello", { maxLength: 0 })).toBe("")
  })
})
