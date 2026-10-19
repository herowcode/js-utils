import { describe, expect, it } from "vitest"
import { corsHeaders } from "./cors-headers"
import { preflight } from "./preflight"

const req = (origin?: string, init: RequestInit = {}) =>
  new Request("https://api.example.com/x", {
    ...init,
    headers: { ...(origin ? { Origin: origin } : {}), ...init.headers },
  })

describe("corsHeaders", () => {
  it("matches an allowlisted origin exactly and sets Vary", () => {
    const h = corsHeaders(req("https://a.com"), {
      origin: ["https://a.com", "https://b.com"],
      credentials: true,
      methods: ["GET", "POST"],
      headers: ["Content-Type"],
      maxAge: 600,
    })
    expect(h.get("Access-Control-Allow-Origin")).toBe("https://a.com")
    expect(h.get("Access-Control-Allow-Credentials")).toBe("true")
    expect(h.get("Access-Control-Allow-Methods")).toBe("GET, POST")
    expect(h.get("Access-Control-Allow-Headers")).toBe("Content-Type")
    expect(h.get("Access-Control-Max-Age")).toBe("600")
    expect(h.get("Vary")).toBe("Origin")
  })

  it("accepts a single string and a predicate", () => {
    expect(
      corsHeaders(req("https://a.com"), { origin: "https://a.com" }).get(
        "Access-Control-Allow-Origin",
      ),
    ).toBe("https://a.com")
    const byPredicate = corsHeaders(req("https://x.dev"), {
      origin: (o) => o.endsWith(".dev"),
    })
    expect(byPredicate.get("Access-Control-Allow-Origin")).toBe("https://x.dev")
  })

  it("omits allow-origin and credentials without throwing when nothing matches", () => {
    const h = corsHeaders(req("https://evil.com"), {
      origin: ["https://a.com"],
      credentials: true,
      methods: ["GET"],
    })
    expect(h.has("Access-Control-Allow-Origin")).toBe(false)
    expect(h.has("Access-Control-Allow-Credentials")).toBe(false)
    expect(h.get("Access-Control-Allow-Methods")).toBe("GET")
    expect(h.get("Vary")).toBe("Origin")
  })

  it("does not normalize case or a trailing slash", () => {
    for (const sent of ["https://A.com", "https://a.com/"]) {
      const h = corsHeaders(req(sent), { origin: "https://a.com" })
      expect(h.has("Access-Control-Allow-Origin")).toBe(false)
    }
  })

  it("omits allow-origin when the request has no Origin", () => {
    const h = corsHeaders(req(), { origin: ["https://a.com"] })
    expect(h.has("Access-Control-Allow-Origin")).toBe(false)
  })

  it('sends "*" even without an Origin and no Vary', () => {
    const h = corsHeaders(req(), { origin: "*" })
    expect(h.get("Access-Control-Allow-Origin")).toBe("*")
    expect(h.has("Vary")).toBe(false)
    expect(h.has("Access-Control-Allow-Credentials")).toBe(false)
  })

  it('throws HEROW_CORS_CREDENTIALS_WILDCARD for credentials with "*"', () => {
    let error: unknown
    try {
      corsHeaders(req("https://a.com"), { origin: "*", credentials: true })
    } catch (e) {
      error = e
    }
    expect(error).toMatchObject({ code: "HEROW_CORS_CREDENTIALS_WILDCARD" })
    expect((error as Error).message).toContain(
      "docs/errors.md#herow_cors_credentials_wildcard",
    )
  })
})

describe("preflight", () => {
  it("returns null for non-OPTIONS requests", () => {
    expect(preflight(req("https://a.com"), { origin: "*" })).toBeNull()
  })

  it("answers OPTIONS with 204 and echoes the requested headers when none are configured", () => {
    const res = preflight(
      req("https://a.com", {
        method: "OPTIONS",
        headers: { "Access-Control-Request-Headers": "x-token, content-type" },
      }),
      { origin: "https://a.com" },
    )
    expect(res?.status).toBe(204)
    expect(res?.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://a.com",
    )
    expect(res?.headers.get("Access-Control-Allow-Headers")).toBe(
      "x-token, content-type",
    )
    expect(res?.headers.get("Access-Control-Allow-Methods")).toContain("POST")
  })

  it("uses configured headers and methods instead of echoing", () => {
    const res = preflight(
      req("https://a.com", {
        method: "OPTIONS",
        headers: { "Access-Control-Request-Headers": "x-evil" },
      }),
      { origin: "*", headers: ["Authorization"], methods: ["GET"] },
    )
    expect(res?.headers.get("Access-Control-Allow-Headers")).toBe(
      "Authorization",
    )
    expect(res?.headers.get("Access-Control-Allow-Methods")).toBe("GET")
  })

  it("still answers 204 for a non-matching origin, without allow-origin", () => {
    const res = preflight(req("https://evil.com", { method: "OPTIONS" }), {
      origin: ["https://a.com"],
    })
    expect(res?.status).toBe(204)
    expect(res?.headers.has("Access-Control-Allow-Origin")).toBe(false)
  })
})
