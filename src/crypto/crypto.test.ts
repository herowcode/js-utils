import { generateOpaqueToken } from "./generate-opaque-token"
import { hmacSha256Hex } from "./hmac-sha256-hex"
import { safeEqual } from "./safe-equal"
import { sha256Hex } from "./sha256-hex"
import { verifyHmacSignature } from "./verify-hmac-signature"

const RFC4231_MAC =
  "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"
const RFC4231_B64 = "W9zBRr9gdU5qBCQmCJV1x1oAPwidJzmDnexYuWTsOEM="
const PLUS_SLASH = {
  payload: "payload-1",
  secret: "k3y",
  hex: "c5ac7bd1537c6ad8b0f3bf8e26a2ff572ea64968ca23666577861eab94bdb672",
  base64: "xax70VN8atiw87+OJqL/Vy6mSWjKI2Zld4Yeq5S9tnI=",
  base64url: "xax70VN8atiw87-OJqL_Vy6mSWjKI2Zld4Yeq5S9tnI=",
}

describe("sha256Hex", () => {
  it("matches known vectors", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    )
  })

  it("hashes UTF-8 bytes", async () => {
    expect(await sha256Hex("\u00e9")).toBe(
      "4a99557e4033c3539de2eb65472017cad5f9557f7a0625a09f1c3f6e2ba69c4c",
    )
  })
})

describe("hmacSha256Hex", () => {
  it("matches RFC 4231 test case 2", async () => {
    expect(await hmacSha256Hex("Jefe", "what do ya want for nothing?")).toBe(
      RFC4231_MAC,
    )
  })
})

describe("safeEqual", () => {
  it("compares equal and different strings", () => {
    expect(safeEqual("abc", "abc")).toBe(true)
    expect(safeEqual("abc", "abd")).toBe(false)
    expect(safeEqual("", "")).toBe(true)
  })

  it("folds length mismatch into the result", () => {
    expect(safeEqual("abc", "abcd")).toBe(false)
    expect(safeEqual("abcd", "abc")).toBe(false)
    expect(safeEqual("", "a")).toBe(false)
    expect(safeEqual("a", "a\0")).toBe(false)
  })

  it("compares multi-byte text by bytes", () => {
    expect(safeEqual("olá", "olá")).toBe(true)
    expect(safeEqual("olá", "ola")).toBe(false)
  })

  it("is synchronous and fails closed for non-strings", () => {
    expect(safeEqual("a", "a")).toBe(true)
    expect(safeEqual("a", "a")).not.toBeInstanceOf(Promise)
    expect(safeEqual(undefined as unknown as string, "a")).toBe(false)
    expect(
      safeEqual(null as unknown as string, null as unknown as string),
    ).toBe(false)
  })
})

describe("generateOpaqueToken", () => {
  it("returns a 43-char base64url token for 32 bytes and its hash", async () => {
    const { token, hash } = await generateOpaqueToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(hash).toBe(await sha256Hex(token))
  })

  it("scales the length with the byte count", async () => {
    expect((await generateOpaqueToken(16)).token).toHaveLength(22)
    expect((await generateOpaqueToken(48)).token).toHaveLength(64)
  })

  it("does not repeat", async () => {
    const tokens = await Promise.all(
      Array.from({ length: 50 }, () => generateOpaqueToken()),
    )
    expect(new Set(tokens.map((t) => t.token)).size).toBe(50)
  })

  it.each([0, -1, 1.5, Number.NaN, 65_537])(
    "rejects %s bytes with HEROW_CRYPTO_INVALID_BYTES",
    async (bytes) => {
      await expect(generateOpaqueToken(bytes)).rejects.toMatchObject({
        code: "HEROW_CRYPTO_INVALID_BYTES",
        name: "RangeError",
      })
    },
  )
})

describe("verifyHmacSignature", () => {
  const payload = "what do ya want for nothing?"

  it("accepts a valid hex signature, ignoring case", async () => {
    expect(await verifyHmacSignature(payload, RFC4231_MAC, "Jefe")).toBe(true)
    expect(
      await verifyHmacSignature(payload, RFC4231_MAC.toUpperCase(), "Jefe"),
    ).toBe(true)
  })

  it("rejects tampering in payload, signature and secret", async () => {
    expect(await verifyHmacSignature(`${payload}!`, RFC4231_MAC, "Jefe")).toBe(
      false,
    )
    expect(
      await verifyHmacSignature(payload, `0${RFC4231_MAC.slice(1)}`, "Jefe"),
    ).toBe(false)
    expect(await verifyHmacSignature(payload, RFC4231_MAC, "jefe")).toBe(false)
    expect(
      await verifyHmacSignature(payload, RFC4231_MAC.slice(2), "Jefe"),
    ).toBe(false)
    expect(await verifyHmacSignature(payload, "", "Jefe")).toBe(false)
  })

  it("strips and requires the prefix", async () => {
    const options = { prefix: "sha256=" }
    expect(
      await verifyHmacSignature(
        payload,
        `sha256=${RFC4231_MAC}`,
        "Jefe",
        options,
      ),
    ).toBe(true)
    expect(
      await verifyHmacSignature(payload, RFC4231_MAC, "Jefe", options),
    ).toBe(false)
  })

  it("accepts base64 and base64url, padded or not", async () => {
    const { payload: p, secret, base64, base64url } = PLUS_SLASH
    const options = { encoding: "base64" as const }
    for (const sig of [
      base64,
      base64url,
      base64.replace(/=+$/, ""),
      base64url.replace(/=+$/, ""),
    ]) {
      expect(await verifyHmacSignature(p, sig, secret, options)).toBe(true)
    }
    expect(await verifyHmacSignature(p, RFC4231_B64, secret, options)).toBe(
      false,
    )
  })

  it("does not accept base64 when hex is expected, or the reverse", async () => {
    const { payload: p, secret, base64, hex } = PLUS_SLASH
    expect(await verifyHmacSignature(p, base64, secret)).toBe(false)
    expect(
      await verifyHmacSignature(p, hex, secret, { encoding: "base64" }),
    ).toBe(false)
  })

  it("fails closed on an empty secret or non-string input", async () => {
    expect(await verifyHmacSignature(payload, RFC4231_MAC, "")).toBe(false)
    expect(
      await verifyHmacSignature(
        payload,
        undefined as unknown as string,
        "Jefe",
      ),
    ).toBe(false)
  })

  it("returns a Promise", () => {
    expect(verifyHmacSignature(payload, RFC4231_MAC, "Jefe")).toBeInstanceOf(
      Promise,
    )
  })
})

describe("HEROW_CRYPTO_UNAVAILABLE", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("is thrown (as a rejection) when WebCrypto is missing", async () => {
    vi.stubGlobal("crypto", undefined)
    await expect(sha256Hex("x")).rejects.toMatchObject({
      code: "HEROW_CRYPTO_UNAVAILABLE",
    })
    await expect(sha256Hex("x")).rejects.toThrow(
      "docs/errors.md#herow_crypto_unavailable",
    )
    await expect(hmacSha256Hex("k", "d")).rejects.toMatchObject({
      code: "HEROW_CRYPTO_UNAVAILABLE",
    })
  })
})
