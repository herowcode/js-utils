import { utf8 } from "./encoding"
import { getWebCrypto } from "./get-subtle"

/** Internal: raw HMAC-SHA-256 bytes of `data` under `key`. */
export async function hmacSha256Bytes(
  key: string,
  data: string,
): Promise<Uint8Array> {
  const { subtle } = getWebCrypto()
  const cryptoKey = await subtle.importKey(
    "raw",
    utf8(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return new Uint8Array(await subtle.sign("HMAC", cryptoKey, utf8(data)))
}
