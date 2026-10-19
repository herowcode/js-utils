const encoder = new TextEncoder()

export function utf8(value: string): Uint8Array<ArrayBuffer> {
  return encoder.encode(value)
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = ""
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0")
  return hex
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Standard base64 without padding, from base64 or base64url input. */
export function normalizeBase64(value: string): string {
  return value.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "")
}
