---
"@herowcode/utils": minor
---

New `/async` subpath (universal): `sleep`, `withTimeout(signal, timeoutMs)` (native `AbortSignal.any`/`timeout` with a manual fallback), `backoffDelay`, `parseRetryAfterMs`, `retry`, `mapInChunks` and `createConcurrencyLimiter`. `retry` only retries transient errors by default, never retries `AbortError`, and lets `Retry-After` / `retryAfterSeconds` override the backoff. The `/api` client now uses these helpers internally with unchanged behavior.

```ts
import { retry } from "@herowcode/utils/async"

const user = await retry(() => loadUser(id), { attempts: 4 })
```

Migration note: a local `retry` that retried every error needs `shouldRetry: () => true` to keep that behavior.
