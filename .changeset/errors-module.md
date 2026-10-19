---
"@herowcode/utils": minor
---

New `/errors` subpath (universal): `getErrorMessage(err, { fallback, keys })`, `getRootCause`, `getErrorStatus` (reads `status`, `statusCode`, `response.status` through the cause chain), `isTransientNetworkError(err, { includeTimeouts })` (looks through `cause`, so Node's `fetch failed` is classified by its cause code) and `isTransientStatus` with `TRANSIENT_STATUS_CODES`. The `/api` client builds its default `retry.statusCodes` from that list.

```ts
import { getErrorMessage, isTransientNetworkError } from "@herowcode/utils/errors"

getErrorMessage({ error: { message: "Nope" } }) // "Nope"
isTransientNetworkError(new TypeError("fetch failed", { cause: { code: "ECONNRESET" } })) // true
```
