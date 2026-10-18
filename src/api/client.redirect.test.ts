import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "./client"

const mockFetch = vi.fn()
global.fetch = mockFetch

function sentRequest(callIndex = 0): Request {
  return mockFetch.mock.calls[callIndex][0] as Request
}

describe("apiClient redirect policy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockImplementation(() => Promise.resolve(new Response("{}")))
  })

  it("keeps the client policy when a request passes redirect: undefined", async () => {
    const client = apiClient({
      baseURL: "https://api.example.com",
      redirect: "error",
    })

    await client.get("/x", { redirect: undefined })

    expect(sentRequest().redirect).toBe("error")
  })

  it("applies the client-level redirect policy to every request", async () => {
    const client = apiClient({
      baseURL: "https://api.example.com",
      redirect: "error",
    })

    await client.get("/x")
    await client.post("/y", { json: { a: 1 } })

    expect(sentRequest(0).redirect).toBe("error")
    expect(sentRequest(1).redirect).toBe("error")
  })

  it("lets a request override the client-level policy", async () => {
    const client = apiClient({
      baseURL: "https://api.example.com",
      redirect: "error",
    })

    await client.get("/x", { redirect: "manual" })

    expect(sentRequest().redirect).toBe("manual")
  })
})
