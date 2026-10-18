---
"@herowcode/utils": patch
---

`/logger` (browser): `redact` entries now follow pino's path syntax (`user.ssn`, `headers["x-api-key"]`, `items[*].pan`, `*.card`) instead of being treated as literal key names that never matched. Plain keys still match at any depth. Secrets passed as `child()` bindings are now redacted too.
