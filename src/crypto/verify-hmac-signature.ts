import { bytesToBase64, bytesToHex, normalizeBase64 } from "./encoding"
import { hmacSha256Bytes } from "./hmac-sha256"
import { safeEqual } from "./safe-equal"

export interface IVerifyHmacSignatureOptions {
  /** How `signature` is encoded. Defaults to "hex"; "base64" also accepts base64url. */
  encoding?: "hex" | "base64"
  /** Required leading text such as "sha256="; a signature without it is rejected. */
  prefix?: string
}

/**
 * MUST be awaited: returns a Promise, so an un-awaited call is always truthy. Verifies an HMAC-SHA-256 signature in constant time.
 * @example if (!(await verifyHmacSignature(body, header, secret, { prefix: "sha256=" }))) return deny()
 */
export async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  { encoding = "hex", prefix }: IVerifyHmacSignatureOptions = {},
): Promise<boolean> {
  if (
    typeof payload !== "string" ||
    typeof signature !== "string" ||
    typeof secret !== "string" ||
    secret === ""
  ) {
    return false
  }
  let provided = signature.trim()
  if (prefix !== undefined) {
    if (!provided.startsWith(prefix)) return false
    provided = provided.slice(prefix.length)
  }
  const mac = await hmacSha256Bytes(secret, payload)
  if (encoding === "hex")
    return safeEqual(provided.toLowerCase(), bytesToHex(mac))
  return safeEqual(
    normalizeBase64(provided),
    normalizeBase64(bytesToBase64(mac)),
  )
}
