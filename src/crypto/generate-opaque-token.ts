import { herowError } from "../errors/herow-error"
import { bytesToBase64 } from "./encoding"
import { getWebCrypto } from "./get-subtle"
import { sha256Hex } from "./sha256-hex"

export interface IOpaqueToken {
  /** Give this to the client; base64url, no padding. */
  token: string
  /** Store this; `sha256Hex(token)`. */
  hash: string
}

const MIN_BYTES = 16
const MAX_BYTES = 65_536

/**
 * Random base64url token (default 32 bytes) plus its SHA-256 hash, so only the hash needs storing.
 * @example const { token, hash } = await generateOpaqueToken()
 */
export async function generateOpaqueToken(bytes = 32): Promise<IOpaqueToken> {
  if (!Number.isInteger(bytes) || bytes < MIN_BYTES || bytes > MAX_BYTES) {
    throw herowError(
      RangeError,
      "HEROW_CRYPTO_INVALID_BYTES",
      `generateOpaqueToken received an invalid byte count (expected an integer from ${MIN_BYTES} to ${MAX_BYTES}).`,
      "Pass a whole number of bytes, at least 16.",
    )
  }
  const random = getWebCrypto().getRandomValues(new Uint8Array(bytes))
  const token = bytesToBase64(random)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  return { token, hash: await sha256Hex(token) }
}
