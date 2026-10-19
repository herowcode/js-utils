# `@herowcode/utils/api`

HTTP client with retry logic, async auth token injection, and standardized error handling.

```typescript
import { apiClient, apiWrapper, buildPageMeta, buildQueryString, getOffset } from '@herowcode/utils/api';
```

---

## `apiClient(config?)`

Factory that returns a typed HTTP client. All methods return `{ data, error }` — never throw.

```typescript
const client = apiClient({
  baseURL: 'https://api.example.com',
  getAccessToken: async () => localStorage.getItem('token'),
  onSignoutUnauthorized: () => router.push('/login'),
});

// GET
const { data, error } = await client.get<User[]>('/users', { params: { page: 1 } });

// POST
const { data, error } = await client.post<User>('/users', { json: { name: 'Alice' } });

// PUT / PATCH / DELETE
await client.put<User>('/users/1', { json: { name: 'Alice Updated' } });
await client.patch<User>('/users/1', { json: { name: 'Alice Patched' } });
await client.delete('/users/1');
```

### Config options

| Option | Type | Description |
|--------|------|-------------|
| `baseURL` | `string` | Base URL prepended to relative endpoints. Required unless every endpoint is an absolute `http(s)` URL |
| `getAccessToken` | `() => Promise<string \| null>` | Called before every request; result injected as `Authorization: Bearer`. Only sent when the request origin equals the `baseURL` origin |
| `onSignoutUnauthorized` | `(body?: unknown) => void` | Called on 401 responses, except when the URL path contains `signin`, `sign-in` or `login`. Errors thrown by the callback are ignored |
| `getUserIP` | `() => Promise<string \| undefined>` | Called before every request; result injected as `X-User-IP`. Only sent when the request origin equals the `baseURL` origin |
| `timeout` | `number` | Default request timeout in ms. Unset, `0`, negative or non-finite means no timeout |
| `redirect` | `RequestRedirect` | Default `redirect` mode (`"follow"`, `"error"` or `"manual"`). Unset means the fetch default, `"follow"` |

### Timeouts

Pass `timeout` (ms) per request or on the client; the per-request value wins, and `timeout: 0` opts a request out of the client default. Fractions round up to whole milliseconds. It is one deadline for `getAccessToken`, `getUserIP`, the network requests, retries and backoff waits, and it is combined with your own `signal` so either can abort. The callbacks themselves can't be cancelled; the request just stops waiting for them. On a 401, the request stops waiting for `onSignoutUnauthorized` once aborted and still resolves with the 401 error. A timed-out request is not retried and resolves with `error.name === "TimeoutError"`; a request aborted through your `signal` has `error.name === "AbortError"`.

```typescript
const { data, error } = await client.get('/slow', { timeout: 5000 });
```

### Return type

```typescript
type TApiResult<T> = {
  data: T | null;
  error: IApiError | null;
};

interface IApiError {
  message: string;
  name?: string;    // thrown error's name unless plain "Error", e.g. "TimeoutError", "AbortError", "TypeError"
  status?: number;
  code?: string;
  details?: unknown;
  path?: string;
  timestamp?: string;
}
```

### Retry behavior

By default `GET` and `HEAD` requests are retried on network errors and on status `408`, `429`, `500`, `502`, `503` and `504`, up to 5 attempts with jittered exponential backoff (between half and all of `2^attempt × 100` ms, capped at `backoffLimit`, 3000 ms by default). Aborted requests are never retried.

The default status list is `TRANSIENT_STATUS_CODES` from [`/errors`](errors.md), and the sleep, timeout, backoff and `Retry-After` parsing are the [`/async`](async.md) helpers.

A `Retry-After` header on a retryable response (seconds or an HTTP date) replaces the backoff for that attempt. The wait is capped at `maxRetryAfter` (10000 ms by default).

Override per request with `retry: { limit, methods, statusCodes, backoffLimit, maxRetryAfter }` (exported as the `IRetryOptions` type; arrays may be `readonly`). Provided fields are merged with the defaults, `methods` are matched case-insensitively, and `limit` is capped at 10 attempts. Network errors are retried only for the configured `methods`.

### Cross-origin requests

`Authorization` and `X-User-IP` are attached only when the request origin equals the `baseURL` origin. Absolute URLs pointing to another origin are sent without them. Only these injected headers are origin-scoped: cookies still follow `credentials` (default `"include"`), and headers you pass yourself go wherever the request goes. A relative `baseURL` such as `"/api"` resolves against the page origin, and without `baseURL` the page origin is used; in Node, a missing or relative `baseURL` means no credentials are attached. `onSignoutUnauthorized` only fires for 401s from that same origin.

Fetch drops `Authorization` when a redirect crosses origins, but not custom headers such as `X-User-IP`. To keep them from following a redirect to another host, set `redirect: "error"` (fail on any redirect) or `"manual"` (return the 3xx, or an opaque redirect in browsers, as an error) on the client or per request.

### Invalid JSON responses

If a successful response body is not valid JSON, the call fails with an `Error` whose message includes the status, URL and a truncated snippet of the body.

---

## `buildQueryString(params)`

Builds the query string the client appends for `params`. Returns `""` when nothing is left, otherwise a string starting with `?`. `null` and `undefined` values are skipped; an array repeats the key (`a=1&a=2`) and skips its own `null`/`undefined` entries; an empty array adds nothing. Use it when you build a URL yourself and want the same encoding as `apiClient`.

```typescript
buildQueryString({ page: 1, q: 'a b' });        // → "?page=1&q=a+b"
buildQueryString({ tag: ['x', 'y'], skip: null }); // → "?tag=x&tag=y"
buildQueryString({});                           // → ""
```

Invalid input returns: `""` for an empty or all-nullish `params`. `apiClient` accepts the same array values in `params`.

### Replacing a local copy

A hand-written `new URLSearchParams(...)` helper maps to `buildQueryString`. Differences: output keeps the leading `?` (and is `""`, not `"?"`, when empty), and arrays become repeated keys instead of `a=1,2`.

---

## `getOffset(page, pageSize)`

Row offset for a 1-based page: `(page - 1) * pageSize`.

```typescript
getOffset(3, 20); // → 40
const rows = await db.select().from(users).limit(20).offset(getOffset(page, 20));
```

Invalid input returns: `0` (page or page size below 1, `NaN`, `Infinity`). Fractions are floored.

### Replacing a local copy

Replaces `(page - 1) * limit`, which goes negative for `page=0` and `NaN` for a missing query param.

---

## `buildPageMeta({ page, pageSize, total })`

Pagination metadata for list responses: `{ page, pageSize, total, totalPages, offset, hasNext, hasPrev }`.

```typescript
buildPageMeta({ page: 2, pageSize: 10, total: 25 });
// → { page: 2, pageSize: 10, total: 25, totalPages: 3, offset: 10, hasNext: true, hasPrev: true }
```

Invalid input returns: clamped values, never `NaN`: `page` and `pageSize` below 1 or not numbers become `1`, an invalid or negative `total` becomes `0` (`totalPages: 0`). A page past the end keeps `hasPrev: true`.

### Replacing a local copy

Replaces hand-built `{ totalPages: Math.ceil(total / limit), hasNext: page * limit < total }` objects; `total: 0` gives `totalPages: 0`, not `1`.

---

## `apiWrapper<T>(fn, defaultData?)`

Wraps any async function that may throw and returns `{ data, error }`. Handles `Response`, Axios-style errors (any object with `isAxiosError: true`; axios itself is not a dependency), and `Error` objects. When a `Response` body is not JSON, a truncated copy of the text is used as `message` and `details`.

```typescript
const { data, error } = await apiWrapper(
  () => fetch('https://api.example.com/users').then(r => r.json()),
  [] // default data if error occurs
);
```

When the thrown `Response` carries a valid `Retry-After` header (seconds or HTTP date), `error.retryAfterSeconds` holds the wait in whole seconds (rounded up); the field is absent otherwise and the rest of the error shape is unchanged.

```typescript
const { error } = await apiWrapper(() => callApi());
if (error?.status === 429 && error.retryAfterSeconds !== undefined) {
  await sleep(error.retryAfterSeconds * 1000);
}
```

```typescript
// With a typed result
const { data, error } = await apiWrapper<User[]>(async () => {
  const res = await fetch('/api/users');
  if (!res.ok) throw res;
  return res.json();
});

if (error) {
  console.error(error.message, error.status);
} else {
  console.log(data); // User[]
}
```

---

[← Back to README](../README.md)
