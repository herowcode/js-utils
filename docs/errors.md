# `@herowcode/utils/errors`

Read messages, statuses and root causes from unknown thrown values, tell transient failures from permanent ones, and throw typed HTTP errors. Universal: no Node builtins, works in browsers, Node and edge runtimes.

```typescript
import {
  getErrorMessage,
  getErrorStatus,
  getRootCause,
  isHttpError,
  HttpError,
  NotFoundError,
  isTransientNetworkError,
  isTransientStatus,
  TRANSIENT_STATUS_CODES,
} from '@herowcode/utils/errors';
```

Cause chains are walked up to 10 links, stop at cycles, and inspect non-`Error` causes (strings, plain objects).

---

## `getErrorMessage(err, options?)`

Returns a readable message from a string, an `Error`, or an API error shape. It reads the top-level value only, not the cause chain, and never returns `"[object Object]"`.

```typescript
getErrorMessage(new Error('Boom'));                 // → "Boom"
getErrorMessage({ error: { message: 'Nope' } });    // → "Nope"
getErrorMessage({ detail: 'Bad input' });           // → "Bad input"
getErrorMessage(undefined, { fallback: 'Try again' }); // → "Try again"
```

| Option | Default | Description |
|--------|---------|-------------|
| `fallback` | `"Unknown error"` | Returned when no non-empty message is found |
| `keys` | `["message", "error", "detail"]` | Keys tried in order; an object found under a key is checked one level down |

Invalid input returns: `fallback` (empty or whitespace-only strings, `null`, numbers and objects without a string under `keys`).

### Replacing a local copy

A local `err instanceof Error ? err.message : String(err)` turns plain objects into `"[object Object]"`; this returns `fallback` instead.

---

## `getRootCause(err)`

Returns the last link of the `cause` chain, or `err` itself when there is no cause.

```typescript
getRootCause(new Error('a', { cause: new Error('b') })); // → Error: b
```

Invalid input returns: the input itself (`getRootCause(undefined)` is `undefined`).

### Replacing a local copy

Replaces `while (e.cause) e = e.cause` loops, which never end on a cyclic chain. This stops at 10 links and at cycles.

---

## `getErrorStatus(err)`

Reads an HTTP status from `status`, then `statusCode`, then `response.status` (axios style), on the error or any link of its cause chain.

```typescript
getErrorStatus({ response: { status: 503 } }); // → 503
getErrorStatus(new Error('x'));                // → undefined
```

Invalid input returns: `undefined`.

### Replacing a local copy

Local `err.status ?? err.response?.status` helpers miss `statusCode` and statuses on the cause chain. Returns `undefined` rather than `0` when none is found.

---

## `isTransientNetworkError(err, options?)`

True when the failure is worth retrying because the connection, not the request, failed. Rules, in order:

1. Any link of the cause chain has a transient `code`: `ECONNRESET`, `ECONNREFUSED`, `ETIMEDOUT`, `EPIPE`, `EAI_AGAIN`, `ENOTFOUND`, `UND_ERR_SOCKET`, `UND_ERR_CONNECT_TIMEOUT`, `UND_ERR_HEADERS_TIMEOUT`, `UND_ERR_BODY_TIMEOUT`.
2. A `TypeError` thrown by `fetch` is classified by its `cause` first. With a `cause` (Node/undici), only a transient code in the chain counts, so `fetch failed` caused by an expired certificate is not transient. Without a `cause` (browsers), the messages `Failed to fetch`, `NetworkError when attempting to fetch resource.` and `Load failed` count. Other `TypeError`s (invalid URL, programming errors) do not.
3. With `{ includeTimeouts: true }`, an error named `AbortError` or `TimeoutError`.
4. Everything else is `false`.

Errors are matched by `name`, so errors from another realm (iframe, `vm` context) work.

```typescript
isTransientNetworkError(new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } })); // → true
isTransientNetworkError(new TypeError('Invalid URL'));                                      // → false
isTransientNetworkError(timeoutError, { includeTimeouts: true });                           // → true
```

Invalid input returns: `false`.

### Replacing a local copy

Local checks usually test `err.code` on the top-level error only (missing Node's `cause.code`) or retry every `TypeError`. This helper looks through `cause` and only trusts the message list when there is no cause.

---

## `isTransientStatus(status)` and `TRANSIENT_STATUS_CODES`

`true` for `408, 429, 500, 502, 503, 504`. The `/api` client builds its default `retry.statusCodes` from `TRANSIENT_STATUS_CODES`, so the two cannot drift.

```typescript
isTransientStatus(503); // → true
isTransientStatus(400); // → false
```

Invalid input returns: `false`.

### Replacing a local copy

Local `status >= 500` checks retry 501/505 and skip 408/429. The set is `408, 429, 500, 502, 503, 504`, shared with `retry` and `apiClient`.

---

## `HttpError` and subclasses

An `Error` that carries an HTTP `status`. Subclasses fix the status: `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409) and `TooManyRequestsError` (429).

```typescript
throw new HttpError(502, 'Bad gateway', { code: 'UPSTREAM_DOWN', details: { upstream: 'billing' }, cause: err });
throw new NotFoundError('User not found');
throw new TooManyRequestsError('Slow down', { retryAfterSeconds: 30 });
```

| Field | Description |
|-------|-------------|
| `status` | HTTP status number (the same name as `Response.status` and `IApiError.status`) |
| `code` | Optional machine-readable code from the server or your app |
| `details` | Optional extra payload, e.g. validation issues |
| `retryAfterSeconds` | Set on `TooManyRequestsError` and on 503 errors from `fetchJson`; [`retry`](async.md#retryfn-options) waits that long |
| `cause` | Standard `Error` cause |

Subclass constructors are `(message?, options?)`, with a default message ("Not Found", ...). `HttpError` itself is `(status, message?, options?)`, default message `HTTP <status>`.

### `isHttpError(value)`

Type guard for the whole family. Prefer it, or plain `instanceof`, whenever one process can load this package twice (CJS and ESM builds, duplicated installs, bundled copies). Every instance carries the brand `Symbol.for("@herowcode/utils.HttpError")`, and `HttpError[Symbol.hasInstance]` checks it, so `err instanceof NotFoundError` stays true for an error created by the other copy. Your own subclasses of `HttpError` use the normal prototype check.

```typescript
if (isHttpError(err) && err.status === 404) return null;
```

`getErrorStatus` reads `HttpError.status`, `getErrorMessage` reads its message, and `retry` treats a 429/5xx `HttpError` as transient and honours `retryAfterSeconds`.

Invalid input returns: `false`.

### Replacing a local copy

Local `class HttpError { statusCode }` copies break `instanceof` across bundles and name the field `statusCode`. Rename the field to `status` and delete the class; `getErrorStatus` still reads `statusCode` from errors you do not control.

---

## Error codes

Errors thrown by this library carry a stable `err.code` starting with `HEROW_`. The message states what happened and how to fix it, ends with a link to the matching section below, and never contains the offending value (it may be a secret). Branch on `err.code`, not on the message text.

## HEROW_ENV_MISSING

Thrown by `requireEnv(name)` when the variable is unset, empty or whitespace-only, or when its value is shorter than `minLength`. The message names the variable, never its value.

Fix: set the variable in the environment (or `.env`) and restart. When the error mentions a minimum length, provide a longer value.

```typescript
requireEnv('DATABASE_URL');                    // throws HEROW_ENV_MISSING when unset
requireEnv('SESSION_SECRET', { minLength: 32 }); // throws when shorter than 32 characters
```

## HEROW_ENV_NO_SOURCE

Thrown by `requireEnv` and `optionalEnv` when the runtime has no environment source: `globalThis.process?.env` is missing (Cloudflare Workers, Deno Deploy, browsers) or you passed `{ env: undefined }`.

Fix: pass the source your runtime provides.

```typescript
export default {
  fetch(request, env) {
    const key = requireEnv('API_KEY', { env }); // Workers bindings
  },
};
```

## HEROW_PARSE_BOOLEAN_INVALID

Thrown by `parseBoolean(value)` (as a `TypeError`) when the value is not one of the recognized strings, `true`/`false` or `1`/`0`, and no `fallback` was given. The value is not echoed.

Fix: normalize the input, or pass a fallback so unknown values never throw.

```typescript
parseBoolean(process.env.FEATURE_X, false); // "maybe" or undefined gives false
```

## HEROW_CRYPTO_UNAVAILABLE

Thrown (as a rejected promise) by `sha256Hex`, `hmacSha256Hex`, `verifyHmacSignature` and `generateOpaqueToken` when `globalThis.crypto.subtle` does not exist.

Fix: run on Node 20+, an edge runtime, or a browser over HTTPS (browsers hide `crypto.subtle` on insecure origins).

```typescript
await sha256Hex('x'); // rejects with HEROW_CRYPTO_UNAVAILABLE where WebCrypto is missing
```

## HEROW_CRYPTO_INVALID_BYTES

Thrown (as a `RangeError`, in a rejected promise) by `generateOpaqueToken(bytes)` when `bytes` is not a whole number from 16 to 65536.

Fix: pass an integer byte count; use at least 16.

```typescript
await generateOpaqueToken(8); // rejects with HEROW_CRYPTO_INVALID_BYTES
await generateOpaqueToken();  // 32 bytes, the default
```

## HEROW_CORS_CREDENTIALS_WILDCARD

Thrown synchronously by `corsHeaders` and `preflight` when `credentials: true` is combined with `origin: "*"`. Browsers refuse credentialed responses that allow every origin, so the combination can never work.

Fix: list the origins that may send credentials, or pass a predicate.

```typescript
corsHeaders(request, { origin: '*', credentials: true });                        // throws
corsHeaders(request, { origin: ['https://app.example.com'], credentials: true }); // ok
```

## HEROW_INVALID_JSON

Set as `err.code` on the `HttpError` that `fetchJson` throws when a 2xx response body is not valid JSON. `err.status` is the real response status, `err.cause` is the `SyntaxError` and `err.details.body` holds the first 200 characters of the body. The message never includes the body.

Fix: check that the endpoint returns JSON; an HTML error page from a proxy or a login redirect is the usual cause. Retrying does not help until the response changes.

```typescript
try {
  await fetchJson('/api/report');
} catch (error) {
  if (isHttpError(error) && error.code === 'HEROW_INVALID_JSON') {
    console.error(error.status, error.details);
  }
}
```

[← Back to README](../README.md)
