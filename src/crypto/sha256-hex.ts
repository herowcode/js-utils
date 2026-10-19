import { bytesToHex, utf8 } from "./encoding"
import { getWebCrypto } from "./get-subtle"

/**
 * SHA-256 of the UTF-8 text as lowercase hex (async, WebCrypto).
 * @example const digest = await sha256Hex("hello")
 */
export async function sha256Hex(data: string): Promise<string> {
  const digest = await getWebCrypto().subtle.digest("SHA-256", utf8(data))
  return bytesToHex(new Uint8Array(digest))
}
