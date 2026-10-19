# `@herowcode/utils/crypto`

Hashing, signatures and tokens on top of WebCrypto. Universal: no Node imports, so it runs in Node 20+, browsers (secure contexts) and edge runtimes.

```typescript
import {
  generateOpaqueToken,
  hmacSha256Hex,
  safeEqual,
  sha256Hex,
  verifyHmacSignature,
} from '@herowcode/utils/crypto';
```

> **Promises:** `sha256Hex`, `hmacSha256Hex`, `generateOpaqueToken` and `verifyHmacSignature` return Promises. Always `await` them. Only `safeEqual` is synchronous.

If `globalThis.crypto.subtle` is missing, these functions reject with [`HEROW_CRYPTO_UNAVAILABLE`](errors.md#herow_crypto_unavailable).

---

## `verifyHmacSignature(payload, signature, secret, options?)`

> **Must be awaited.** It returns `Promise<boolean>`, and a Promise is always truthy: `if (verifyHmacSignature(...))` without `await` accepts every request.

Checks an HMAC-SHA-256 signature of `payload` (the raw request body) under `secret`, comparing in constant time through `safeEqual`.

```typescript
// GitHub-style header: "sha256=<hex>"
const ok = await verifyHmacSignature(rawBody, request.headers.get('x-hub-signature-256') ?? '', secret, {
  prefix: 'sha256=',
});
if (!ok) return new Response('Invalid signature', { status: 401 });

// Base64 signature (Shopify-style)
const valid = await verifyHmacSignature(rawBody, header, secret, { encoding: 'base64' });
```

| Option | Default | Description |
|--------|---------|-------------|
| `encoding` | `"hex"` | `"hex"` or `"base64"` |
| `prefix` | none | Text the signature must start with (e.g. `sha256=`); it is stripped before comparing, and a signature without it is rejected |

Normalization before comparing: hex is compared in lowercase (uppercase hex from the provider is accepted); with `"base64"` both standard base64 and base64url are accepted, padded or not.

Invalid input returns: `false` (empty `secret`, empty or non-string `signature`, wrong length, wrong prefix). It does not throw for bad signatures.

### Replacing a local copy

Local copies often compare with `===` (timing leak), use `Buffer` (not edge-safe), or forget `await`. Pass the raw body string, not re-serialized JSON.

---

## `hmacSha256Hex(key, data)`

HMAC-SHA-256 of `data` under `key`, as lowercase hex.

```typescript
await hmacSha256Hex('Jefe', 'what do ya want for nothing?');
// → "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"
```

Invalid input returns: not applicable, a missing WebCrypto rejects with `HEROW_CRYPTO_UNAVAILABLE`.

### Replacing a local copy

Replaces `createHmac('sha256', key).update(data).digest('hex')` from `node:crypto`, which does not exist on edge runtimes. This is async (WebCrypto), so add `await`.

---

## `sha256Hex(data)`

SHA-256 of the UTF-8 bytes of `data`, as lowercase hex.

```typescript
await sha256Hex('abc');
// → "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
```

Invalid input returns: not applicable, a missing WebCrypto rejects with `HEROW_CRYPTO_UNAVAILABLE`.

### Replacing a local copy

Replaces `createHash('sha256')` and `Buffer` hex conversions that break on edge runtimes. It is async, so add `await`; input is hashed as UTF-8.

---

## `safeEqual(a, b)`

Synchronous constant-time comparison of two strings, over their UTF-8 bytes. It always walks the longer length and folds a length mismatch into the result, so there is no early return. It returns a plain `boolean`, never a Promise.

```typescript
if (safeEqual(providedToken, expectedToken)) grantAccess();
```

Constant time means the time does not depend on where the strings differ; the length of the inputs can still be observed.

Invalid input returns: `false` (non-string arguments).

### Replacing a local copy

Replace `a === b` on secrets and `crypto.timingSafeEqual` wrappers that throw on different lengths.

---

## `generateOpaqueToken(bytes = 32)`

Creates a random token and its hash. Store the `hash`, send the `token` to the client, and later compare `await sha256Hex(candidate)` with the stored hash using `safeEqual`.

```typescript
const { token, hash } = await generateOpaqueToken();
// token: 43 base64url characters for 32 bytes (no padding), hash: sha256Hex(token)
await db.sessions.insert({ tokenHash: hash });
```

`bytes` is the amount of randomness from `crypto.getRandomValues`; the minimum is 16.

Throws (rejects): [`HEROW_CRYPTO_INVALID_BYTES`](errors.md#herow_crypto_invalid_bytes) when `bytes` is not an integer from 16 to 65536.

Invalid input returns: not applicable, `bytes` outside 16 to 65536 rejects with `HEROW_CRYPTO_INVALID_BYTES`.

### Replacing a local copy

Replaces `Math.random().toString(36)` and `uuid`-as-secret. The token comes from `crypto.getRandomValues`, is base64url (URL-safe, no padding), and you get the hash to store, so the plain token never has to be saved.

---

[← Back to README](../README.md)
