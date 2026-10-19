import { bytesToHex } from "./encoding"
import { hmacSha256Bytes } from "./hmac-sha256"

/**
 * HMAC-SHA-256 of `data` under `key` as lowercase hex (async, WebCrypto).
 * @example const mac = await hmacSha256Hex(secret, body)
 */
export async function hmacSha256Hex(
  key: string,
  data: string,
): Promise<string> {
  return bytesToHex(await hmacSha256Bytes(key, data))
}
