# `@herowcode/utils/http`

Thin helpers over the Web `Request`, `Response` and `fetch` APIs: CORS headers, preflight answers, JSON responses, `fetch` with a timeout and a `fetchJson` that throws typed errors. Universal: no Node builtins, works in Node 20+, browsers, Cloudflare Workers, Deno and Bun.

```typescript
import {
  corsHeaders,
  fetchJson,
  fetchWithTimeout,
  jsonResponse,
  preflight,
} from '@herowcode/utils/http';
```

## Which one: `http`, `api` or `async`?

| You need | Use | Why |
|----------|-----|-----|
| One request that throws on failure, with a timeout | `http` `fetchJson` | Throws `HttpError` subclasses; no retries, no auth hooks |
| A raw `Response` with a timeout | `http` `fetchWithTimeout` | Same as `fetch` plus `timeoutMs` |
| CORS headers or a preflight answer in a Worker or route handler | `http` `corsHeaders`, `preflight` | Works on `Request`, returns `Headers` and `Response` |
| A client with base URL, auth tokens, retries and `{ data, error }` results that never throw | [`api`](api.md) `apiClient` | The full client |
| Your own retry loop, a timeout signal or a concurrency cap around any promise | [`async`](async.md) `retry`, `withTimeout`, `createConcurrencyLimiter` | Building blocks; `fetchWithTimeout` is built on `withTimeout` |

---

## `corsHeaders(request, options)`

Returns a `Headers` object with the CORS headers for this request. `origin` is required and the request's `Origin` is never reflected unless it matches.

```typescript
const headers = corsHeaders(request, {
  origin: ['https://app.example.com', 'https://admin.example.com'],
  methods: ['GET', 'POST'],
  headers: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600,
});

return new Response(body, { headers });
```

| Option | Default | Description |
|--------|---------|-------------|
| `origin` | required | `"*"`, one origin, an array of origins, or a predicate `(origin) => boolean` |
| `methods` | none | Sent as `Access-Control-Allow-Methods` |
| `headers` | none | Sent as `Access-Control-Allow-Headers` |
| `credentials` | `false` | Sends `Access-Control-Allow-Credentials: true` for a matched origin |
| `maxAge` | none | `Access-Control-Max-Age`, in seconds |

Rules:

- A string or array `origin` matches exactly and case-sensitively: `https://A.com` and `https://a.com/` do not match `https://a.com`.
- `"*"` always sends `Access-Control-Allow-Origin: *`, even when the request has no `Origin`.
- Any other `origin` adds `Vary: Origin`. When the request has no `Origin`, or it does not match, `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials` are left out and nothing throws (the browser then blocks the response).
- `credentials: true` together with `origin: "*"` throws [`HEROW_CORS_CREDENTIALS_WILDCARD`](errors.md#herow_cors_credentials_wildcard) when called, because browsers reject that combination.

Invalid input returns: not applicable. A missing or unmatched `Origin` returns headers without allow-origin; only the wildcard plus credentials combination throws.

### Replacing a local copy

Local `corsHeaders` helpers usually reflect whatever `Origin` arrives, which lets any site read credentialed responses. This one only echoes origins you listed, and refuses the wildcard with credentials.

---

## `preflight(request, options)`

For an `OPTIONS` request, returns a `204` `Response` carrying the CORS headers; for any other method returns `null`, so you can short-circuit at the top of a handler.

```typescript
export default {
  async fetch(request: Request) {
    const early = preflight(request, { origin: 'https://app.example.com' });
    if (early) return early;
    // ...
  },
};
```

Takes the same options as `corsHeaders`. When `headers` is not set, the answer echoes the request's `Access-Control-Request-Headers` (and adds `Vary: Access-Control-Request-Headers`); when `methods` is not set it allows `GET, HEAD, POST, PUT, PATCH, DELETE`. A non-matching origin still gets a `204`, just without allow-origin.

Invalid input returns: `null` for non-`OPTIONS` requests.

---

## `jsonResponse(data, init?)`

Builds a `Response` with `JSON.stringify(data)` and `Content-Type: application/json`. `init` is a normal `ResponseInit`; a `Content-Type` you set is kept.

```typescript
return jsonResponse({ id: 1 }, { status: 201, headers: corsHeaders(request, { origin: '*' }) });
```

`undefined` is sent as `null`. Statuses that cannot have a body (`204`, `205`, `304`) get none.

Invalid input returns: not applicable. Values `JSON.stringify` cannot serialize (circular objects, `BigInt`) throw its `TypeError`.

---

## `fetchWithTimeout(input, init?, { timeoutMs }?)`

`fetch` that also aborts after `timeoutMs` with a `TimeoutError`. A `signal` in `init` keeps working: either one aborts the request. `0`, negative or missing `timeoutMs` means no timeout.

```typescript
const res = await fetchWithTimeout('https://api.example.com/slow', { method: 'POST' }, { timeoutMs: 5000 });
```

Invalid input returns: not applicable; it rejects like `fetch`, with the signal's reason when aborted.

---

## `fetchJson<T>(input, init?, { timeoutMs }?)`

Fetches JSON and throws instead of returning an error object. Sends `Accept: application/json` unless you set one.

```typescript
try {
  const user = await fetchJson<User>('/api/me', undefined, { timeoutMs: 5000 });
} catch (error) {
  if (error instanceof NotFoundError) return null;
  if (isHttpError(error)) log(error.status, error.code);
  throw error;
}
```

| Response | Result |
|----------|--------|
| 2xx with JSON | the parsed value |
| `204`, `205` or an empty 2xx body | `undefined` |
| non-2xx | throws `HttpError`, or `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409), `TooManyRequestsError` (429, with `retryAfterSeconds` from `Retry-After`) |
| 2xx that is not JSON | throws `HttpError` with the real status and code [`HEROW_INVALID_JSON`](errors.md#herow_invalid_json) |

For non-2xx responses the error's `message` comes from the JSON body (`message`, `error` or `detail`) or is `HTTP <status>`; `code` is the body's `code` when it is a string, and `details` is the parsed body (or the first 200 characters when it is not JSON). For invalid JSON, `cause` is the `SyntaxError` and `details.body` holds the first 200 characters of the body. Both `HttpError` and the subclasses come from [`errors`](errors.md).

The return type is `Promise<T | undefined>` because of the empty-body case.

Invalid input returns: throws; there is no `fallback`. Network failures and timeouts reject with the original error.

### Replacing a local copy

A local `fetchJson` that calls `res.json()` throws an opaque `SyntaxError` on an HTML error page and loses the status. This keeps the status, a code you can branch on and the start of the body.

[← Back to README](../README.md)
