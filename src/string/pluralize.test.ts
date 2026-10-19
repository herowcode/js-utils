import { describe, expect, it } from "vitest"
import { pluralize } from "./pluralize"

describe("pluralize", () => {
  it("uses the singular for 1 and -1", () => {
    expect(pluralize(1, "item")).toBe("item")
    expect(pluralize(-1, "item")).toBe("item")
  })

  it("adds s by default otherwise", () => {
    expect(pluralize(0, "item")).toBe("items")
    expect(pluralize(2, "item")).toBe("items")
    expect(pluralize(1.5, "item")).toBe("items")
  })

  it("uses an explicit plural", () => {
    expect(pluralize(2, "mês", "meses")).toBe("meses")
    expect(pluralize(1, "mês", "meses")).toBe("mês")
  })

  it("returns the plural for non-numeric counts", () => {
    expect(pluralize(Number.NaN, "item")).toBe("items")
  })
})
