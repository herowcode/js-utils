import { describe, expect, it } from "vitest"
import { redactDeep } from "./redact-deep"

describe("redactDeep with a __proto__ key", () => {
  it("keeps it as own data and leaves the prototype alone", () => {
    const input = JSON.parse('{"__proto__":{"polluted":"yes"},"ok":1}')
    const out = redactDeep(input) as Record<string, unknown>
    expect(Object.hasOwn(out, "__proto__")).toBe(true)
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype)
    expect((out as { polluted?: string }).polluted).toBeUndefined()
    expect(Object.getOwnPropertyDescriptor(out, "__proto__")?.value).toEqual({
      polluted: "yes",
    })
  })
})
