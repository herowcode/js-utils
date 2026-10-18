---
"@herowcode/utils": minor
---

`/api`: export the `IRetryOptions` type. `retry.methods` and `retry.statusCodes` now accept readonly arrays, so shared `as const` configs type-check.
