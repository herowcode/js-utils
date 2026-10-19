import { describe, expect, it } from "vitest"
import { jsonResponse } from "./json-response"

describe("jsonResponse", () => {
  it("serializes data with a JSON content type", async () => {
    const res = jsonResponse({ a: 1 })
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("application/json")
    expect(await res.json()).toEqual({ a: 1 })
  })

  it("keeps init status and custom headers", async () => {
    const res = jsonResponse([1], {
      status: 201,
      headers: { "Content-Type": "application/vnd.api+json", "X-A": "b" },
    })
    expect(res.status).toBe(201)
    expect(res.headers.get("Content-Type")).toBe("application/vnd.api+json")
    expect(res.headers.get("X-A")).toBe("b")
  })

  it("sends undefined as null and no body for 204", async () => {
    expect(await jsonResponse(undefined).text()).toBe("null")
    const empty = jsonResponse({ a: 1 }, { status: 204 })
    expect(empty.status).toBe(204)
    expect(await empty.text()).toBe("")
  })
})
