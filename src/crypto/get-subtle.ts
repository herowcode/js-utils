import { herowError } from "../errors/herow-error"

/** Internal: the runtime's WebCrypto, or a coded error when it is missing. */
export function getWebCrypto(): Crypto {
  const webCrypto = (globalThis as { crypto?: Crypto }).crypto
  if (typeof webCrypto?.subtle?.digest !== "function") {
    throw herowError(
      Error,
      "HEROW_CRYPTO_UNAVAILABLE",
      "WebCrypto (globalThis.crypto.subtle) is not available in this runtime.",
      "Run on Node 20+, a modern browser over HTTPS, or an edge runtime.",
    )
  }
  return webCrypto
}
