# `@herowcode/utils/errors`

Read messages, statuses and root causes from unknown thrown values, and tell transient failures from permanent ones. Universal: no Node builtins, works in browsers, Node and edge runtimes.

```typescript
import {
  getErrorMessage,
  getErrorStatus,
  getRootCause,
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

---

## `getErrorStatus(err)`

Reads an HTTP status from `status`, then `statusCode`, then `response.status` (axios style), on the error or any link of its cause chain.

```typescript
getErrorStatus({ response: { status: 503 } }); // → 503
getErrorStatus(new Error('x'));                // → undefined
```

Invalid input returns: `undefined`.

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

---

## Error codes

Errors thrown by this library will carry a stable `HEROW_*` code with a section here; no module throws one yet.

[← Back to README](../README.md)
