const BASE64URL = /^[A-Za-z0-9_-]+$/

function decodePayload(segment: string): string | null {
  if (!BASE64URL.test(segment) || segment.length % 4 === 1) return null
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/")
  try {
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

/**
 * Decodes a JWT payload WITHOUT verifying the signature; returns null for anything malformed.
 * @example const claims = decodeJWT(token) // { sub: "42", exp: 1767225600 } or null
 */
export function decodeJWT<
  TClaims extends Record<string, unknown> = Record<string, unknown>,
>(token: string): TClaims | null {
  if (typeof token !== "string") return null
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const json = decodePayload(parts[1])
  if (json === null) return null
  try {
    const payload: unknown = JSON.parse(json)
    return typeof payload === "object" &&
      payload !== null &&
      !Array.isArray(payload)
      ? (payload as TClaims)
      : null
  } catch {
    return null
  }
}
