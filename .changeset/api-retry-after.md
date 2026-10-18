---
"@herowcode/utils": minor
---

`/api`: retries honour `Retry-After` (seconds or HTTP date) and add jitter to the exponential backoff, which now waits between half and all of the previous delay. The `Retry-After` wait is capped by the new `retry.maxRetryAfter` (10 s by default).
