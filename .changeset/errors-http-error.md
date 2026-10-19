---
"@herowcode/utils": minor
---

`/errors` now ships the `HttpError` family: `HttpError(status, message?, { code, details, cause })` plus `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError` and `TooManyRequestsError` (with `retryAfterSeconds`). Instances carry the brand `Symbol.for("@herowcode/utils.HttpError")`, so `instanceof` and the new `isHttpError()` guard work across the CJS and ESM builds. `getErrorStatus` reads `HttpError.status` and `retry` honours `retryAfterSeconds`.

```ts
import { isHttpError, NotFoundError } from "@herowcode/utils/errors"

throw new NotFoundError("User not found")
if (isHttpError(err) && err.status === 404) return null
```
