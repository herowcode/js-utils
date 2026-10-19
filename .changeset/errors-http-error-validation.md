---
"@herowcode/utils": patch
---

`HttpError` now rejects an invalid `status` (anything but an integer from 100 to 599) with a `RangeError` coded `HEROW_HTTP_INVALID_STATUS` and ignores a negative or non-finite `retryAfterSeconds`. `redactSecrets` also masks passwords in connection URLs (`postgres://user:[REDACTED]@host`) and handles escaped quotes inside quoted values. `sleep` and `withTimeout` clamp delays to the 32-bit timer limit. `tryCatchResult` now types `error` as `unknown` by default.
