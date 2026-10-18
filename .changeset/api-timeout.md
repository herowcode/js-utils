---
"@herowcode/utils": minor
---

`/api`: add an opt-in `timeout` (ms) per request or on `apiClient({ timeout })`. It covers the network requests, retries and backoff waits, and combines with the caller's `signal`; `timeout: 0` opts a request out of the client default. Backoff waits now stop as soon as the request is aborted.
