---
"@herowcode/utils": minor
---

New `/crypto` subpath (universal, WebCrypto only, no Node imports): `sha256Hex`, `hmacSha256Hex`, `safeEqual` (synchronous, constant-time), `generateOpaqueToken(bytes = 32)` returning `{ token, hash }` and `verifyHmacSignature(payload, signature, secret, { encoding, prefix })`. Everything except `safeEqual` returns a Promise, so always `await` (an un-awaited `verifyHmacSignature` is always truthy). Errors carry `HEROW_CRYPTO_UNAVAILABLE` or `HEROW_CRYPTO_INVALID_BYTES`.

```ts
import { verifyHmacSignature } from "@herowcode/utils/crypto"

const ok = await verifyHmacSignature(rawBody, header, secret, { prefix: "sha256=" })
```
