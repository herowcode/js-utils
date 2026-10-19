import { decodeJWT } from "./decode-jwt"
import { extractBearerToken } from "./extract-bearer-token"
import { getJWTExp } from "./get-jwt-exp"
import { isJWTExpired } from "./is-jwt-expired"
import { isJWTExpiring } from "./is-jwt-expiring"

const HEADER = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"

function b64url(text: string): string {
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function jwt(payload: unknown): string {
  return `${HEADER}.${b64url(JSON.stringify(payload))}.sig`
}

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0)
const nowSeconds = NOW / 1000

describe("decodeJWT", () => {
  it("decodes the payload without checking the signature", () => {
    expect(decodeJWT(jwt({ sub: "42", exp: 10 }))).toEqual({
      sub: "42",
      exp: 10,
    })
    expect(decodeJWT(`${HEADER}.${b64url('{"a":1}')}.`)).toEqual({ a: 1 })
  })

  it("decodes UTF-8 claims", () => {
    const token = `${HEADER}.eyJzdWIiOiI0MiIsIm5hbWUiOiJKb3PDqSDinJMiLCJleHAiOjE3NjcyMjU2MDB9.sig`
    expect(decodeJWT(token)).toEqual({
      sub: "42",
      name: "José ✓",
      exp: 1767225600,
    })
  })

  it("returns null when there are not exactly 3 parts", () => {
    expect(decodeJWT("")).toBeNull()
    expect(decodeJWT("a.b")).toBeNull()
    expect(decodeJWT("a.b.c.d")).toBeNull()
  })

  it("returns null for bad base64url", () => {
    expect(decodeJWT(`${HEADER}.@@@.sig`)).toBeNull()
    expect(decodeJWT(`${HEADER}.abcde.sig`)).toBeNull()
    expect(decodeJWT(`${HEADER}..sig`)).toBeNull()
    expect(decodeJWT(`${HEADER}.eyJhIjoxfQ==.sig`)).toBeNull()
  })

  it("returns null for invalid UTF-8 bytes", () => {
    expect(decodeJWT(`${HEADER}.${btoa("\xff\xfe")}.sig`)).toBeNull()
  })

  it("returns null for bad JSON", () => {
    expect(decodeJWT(`${HEADER}.${b64url("{nope")}.sig`)).toBeNull()
  })

  it("returns null when the payload is not an object", () => {
    for (const value of [1, "x", null, true, [1, 2]]) {
      expect(decodeJWT(jwt(value))).toBeNull()
    }
  })

  it("returns null for non-string input", () => {
    expect(decodeJWT(undefined as unknown as string)).toBeNull()
    expect(decodeJWT(null as unknown as string)).toBeNull()
  })
})

describe("getJWTExp", () => {
  it("returns exp in seconds", () => {
    expect(getJWTExp(jwt({ exp: 1767225600 }))).toBe(1767225600)
  })

  it("returns null when missing, non-numeric or token malformed", () => {
    expect(getJWTExp(jwt({}))).toBeNull()
    expect(getJWTExp(jwt({ exp: "1767225600" }))).toBeNull()
    expect(getJWTExp(jwt({ exp: null }))).toBeNull()
    expect(getJWTExp("garbage")).toBeNull()
  })
})

describe("isJWTExpired / isJWTExpiring", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it("isJWTExpired compares exp in seconds with now", () => {
    expect(isJWTExpired(jwt({ exp: nowSeconds + 1 }))).toBe(false)
    expect(isJWTExpired(jwt({ exp: nowSeconds }))).toBe(true)
    expect(isJWTExpired(jwt({ exp: nowSeconds - 1 }))).toBe(true)
  })

  it("fails closed for malformed tokens and missing or bad exp", () => {
    for (const token of ["", "garbage", jwt({}), jwt({ exp: "soon" })]) {
      expect(isJWTExpired(token)).toBe(true)
      expect(isJWTExpiring(token)).toBe(true)
    }
  })

  it("treats the margin as seconds, not minutes (default 30)", () => {
    expect(isJWTExpiring(jwt({ exp: nowSeconds + 31 }))).toBe(false)
    expect(isJWTExpiring(jwt({ exp: nowSeconds + 30 }))).toBe(true)
    expect(isJWTExpiring(jwt({ exp: nowSeconds + 29 }))).toBe(true)
    // a minutes bug would still call a token 31 minutes out "expiring"
    expect(isJWTExpiring(jwt({ exp: nowSeconds + 31 * 60 }))).toBe(false)
  })

  it("honours a custom marginSeconds", () => {
    const token = jwt({ exp: nowSeconds + 90 })
    expect(isJWTExpiring(token, { marginSeconds: 60 })).toBe(false)
    expect(isJWTExpiring(token, { marginSeconds: 120 })).toBe(true)
    expect(isJWTExpiring(token, { marginSeconds: 0 })).toBe(false)
  })

  it("expired tokens are always expiring", () => {
    expect(
      isJWTExpiring(jwt({ exp: nowSeconds - 5 }), { marginSeconds: 0 }),
    ).toBe(true)
  })

  it("falls back to 30 seconds for a non-finite margin and clamps negatives", () => {
    expect(
      isJWTExpiring(jwt({ exp: nowSeconds + 10 }), {
        marginSeconds: Number.NaN,
      }),
    ).toBe(true)
    expect(
      isJWTExpiring(jwt({ exp: nowSeconds + 10 }), { marginSeconds: -100 }),
    ).toBe(false)
  })
})

describe("extractBearerToken", () => {
  it("extracts the token, case-insensitive on the scheme", () => {
    expect(extractBearerToken("Bearer abc.def")).toBe("abc.def")
    expect(extractBearerToken("bearer abc")).toBe("abc")
    expect(extractBearerToken("BEARER   abc  ")).toBe("abc")
  })

  it("returns null for anything else", () => {
    for (const header of [
      null,
      undefined,
      "",
      "Bearer",
      "Bearer ",
      "Basic abc",
      "Bearerabc",
      "Bearer a b",
      "Token abc",
      42 as unknown as string,
    ]) {
      expect(extractBearerToken(header)).toBeNull()
    }
  })

  it("stays linear on adversarial 100 KB headers", () => {
    const inputs = [
      `Bearer${" ".repeat(100_000)}x y`,
      `Bearer ${"a".repeat(100_000)} b`,
      `${" ".repeat(100_000)}Basic`,
    ]
    const start = performance.now()
    for (const input of inputs) extractBearerToken(input)
    expect(performance.now() - start).toBeLessThan(50)
  })
})
