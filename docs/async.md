# `@herowcode/utils/async`

Timing, retry and concurrency helpers. Universal: no Node builtins, works in browsers, Node and edge runtimes. Depends on [`/errors`](errors.md).

```typescript
import {
  backoffDelay,
  createConcurrencyLimiter,
  createSingleFlight,
  mapInChunks,
  parseRetryAfterMs,
  retry,
  sleep,
  withTimeout,
} from '@herowcode/utils/async';
```

> `retry` handles thrown errors only. For HTTP calls that return `{ data, error }`, use the retry built into [`apiClient`](api.md).

---

## `sleep(ms, signal?)`

Resolves after `ms`. If `signal` aborts first it rejects with `signal.reason` and clears its timer.

```typescript
await sleep(500);
await sleep(500, controller.signal);
```

Invalid input returns: not applicable; `ms` goes straight to `setTimeout`, so a negative or `NaN` value resolves on the next tick.

### Replacing a local copy

Replaces `new Promise((r) => setTimeout(r, ms))`. The difference is the optional `signal`: aborting rejects with `signal.reason` and clears the timer, so a cancelled flow does not keep the process alive.

---

## `withTimeout(signal, timeoutMs)`

Returns a signal that aborts when `signal` aborts or after `timeoutMs`, whichever comes first. The timeout abort reason is a `TimeoutError`. `timeoutMs` that is `undefined`, `0`, negative or non-finite means no timeout: the original `signal` (possibly `undefined`/`null`) is returned as is. Fractions round up.

It uses `AbortSignal.timeout` and `AbortSignal.any` when available and an `AbortController` plus `setTimeout` otherwise, removing its listeners and timer once either side fires.

```typescript
const signal = withTimeout(userSignal, 5000);
const res = await fetch(url, { signal });
```

Invalid input returns: the input `signal` unchanged.

### Replacing a local copy

Replaces `Promise.race([promise, timeoutPromise])` helpers, which leave the timer running and never cancel the work. This returns an `AbortSignal` you hand to `fetch`, so the request is actually aborted; the reason is a `TimeoutError`.

---

## `backoffDelay(attempt, options?)`

Exponential backoff with equal jitter, in ms: `min(2^attempt * baseMs, maxMs)`, then a random value between half of it and all of it.

| Option | Default | Description |
|--------|---------|-------------|
| `baseMs` | `100` | Base delay in ms |
| `maxMs` | `3000` | Cap on the delay before jitter |

```typescript
await sleep(backoffDelay(2)); // 200-400 ms
```

Invalid input returns: not applicable; a `NaN` attempt gives `NaN`, so pass an integer from 0.

### Replacing a local copy

Local `Math.pow(2, n) * 1000` loops have no cap and no jitter, so clients retry in lockstep. Defaults here are `baseMs: 100`, `maxMs: 3000`; raise both for slow upstreams.

---

## `parseRetryAfterMs(value, now?)`

Parses a `Retry-After` header (delta-seconds or an HTTP date) into milliseconds. Past dates give `0`.

```typescript
parseRetryAfterMs('120');                            // → 120000
parseRetryAfterMs('Wed, 21 Oct 2026 07:28:00 GMT');  // → ms until that date
```

Invalid input returns: `undefined` (also for `null`, `undefined`, `"1.5"`, `"-1"`).

### Replacing a local copy

Replaces `Number(header) * 1000`, which gives `NaN` for the HTTP-date form and a negative wait for past dates. Dates are converted to the remaining milliseconds (at least `0`) and bad values give `undefined`, so check it before sleeping.

---

## `retry(fn, options?)`

Calls `fn(attempt)` and retries when it throws a transient error. Returns the first successful value or rethrows the last error.

| Option | Default | Description |
|--------|---------|-------------|
| `attempts` | `3` | Total tries, first call included |
| `baseMs` / `maxMs` | `100` / `3000` | Backoff, see `backoffDelay` |
| `maxRetryAfterMs` | `30000` | Longest server-requested wait to honour |
| `shouldRetry` | transient only | `(error, attempt) => boolean` |
| `onRetry` | none | `(error, attempt, delayMs) => void`, called before each wait |
| `signal` | none | Aborting stops the wait and rethrows the last error |

```typescript
const user = await retry(() => fetchUser(id), {
  attempts: 4,
  onRetry: (err, attempt, delayMs) => log.warn({ attempt, delayMs }),
});
```

Default `shouldRetry`: `isTransientNetworkError(err) || isTransientStatus(getErrorStatus(err))`, so connection failures and 408/429/500/502/503/504 are retried and everything else (a 400, a bug) is thrown at once. To retry everything, pass `shouldRetry: () => true`. An `AbortError` is never retried, whatever `shouldRetry` says.

When the error carries `retryAfterSeconds` or a `Retry-After` header (on `error.headers` or `error.response.headers`), that wait replaces the computed backoff (capped by `maxRetryAfterMs`).

Invalid input returns: not applicable, the last error is rethrown.

### Replacing a local copy

A local `retry` that retries every error will now stop at the first non-transient one; add `shouldRetry: () => true` for the old behavior. Local helpers that sleep a fixed delay map to `baseMs`/`maxMs`.

---

## `mapInChunks(items, chunkSize, fn)`

Maps `items` with `fn(item, index)`, running `chunkSize` calls at a time, chunk after chunk. Results keep the input order. The first rejection rejects the whole call.

```typescript
const users = await mapInChunks(ids, 5, (id) => loadUser(id));
```

Invalid input returns: `[]` for empty `items`; a `chunkSize` below 1 or `NaN` runs one at a time.

### Replacing a local copy

Replaces hand-rolled `for` loops that `await Promise.all(slice)`. It is also chunk after chunk, not a sliding window: one slow item holds its whole chunk. Use `createConcurrencyLimiter` when every slot should refill immediately.

---

## `createConcurrencyLimiter(limit)`

Returns a function that runs tasks with at most `limit` in flight; extra tasks wait in FIFO order. A task that rejects or throws frees its slot.

```typescript
const limit = createConcurrencyLimiter(3);
const pages = await Promise.all(urls.map((url) => limit(() => fetch(url))));
```

Invalid input returns: a `limit` below 1 or `NaN` is treated as 1.

### Replacing a local copy

Replaces `p-limit` style wrappers and ad-hoc counters. Slots free on rejection too, and tasks start in FIFO order; combine with `mapInChunks` only when you need ordered results.

---

## `createSingleFlight(fn)`

Wraps `fn` so that calls made while it is running share the same promise instead of starting another run. As soon as the run settles, the slot is cleared (before any waiter resumes), so the next call starts a fresh run. A rejection reaches every waiter and is not cached.

```typescript
const refreshToken = createSingleFlight(() => api.refresh());

// Three requests hit a 401 at once: one refresh call, three identical results
const [a, b, c] = await Promise.all([refreshToken(), refreshToken(), refreshToken()]);
```

Calls that join a running flight ignore their own arguments: `fn` runs with the arguments of the call that started it. A synchronous throw from `fn` becomes a rejection.

Invalid input returns: not applicable, errors from `fn` reject the returned promise.

### Replacing a local copy

A local `let inflight` guard usually forgets to clear on rejection or clears too late. This clears in the settle handler, so a failed refresh can be retried on the next call.

[← Back to README](../README.md)
