---
"@herowcode/utils": minor
---

`/api`: add an opt-in `timeout` (ms) per request or on `apiClient({ timeout })`. It covers the whole call, retries and backoff included, and combines with the caller's `signal`. Backoff waits now stop as soon as the request is aborted.
