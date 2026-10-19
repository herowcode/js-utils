---
"@herowcode/utils": minor
---

New `/http` subpath (universal, Web `Request`/`Response`): `corsHeaders(request, { origin, methods, headers, credentials, maxAge })` returning `Headers`, `preflight` (204 for `OPTIONS`, else `null`), `jsonResponse`, `fetchWithTimeout(input, init, { timeoutMs })` and `fetchJson`, which throws `HttpError` subclasses by status and `HEROW_INVALID_JSON` for a non-JSON 2xx body. `origin` is required and never reflected unchecked; `credentials: true` with `"*"` throws `HEROW_CORS_CREDENTIALS_WILDCARD`.

```ts
import { fetchJson, preflight } from "@herowcode/utils/http"

const early = preflight(request, { origin: ["https://app.example.com"] })
if (early) return early
const user = await fetchJson<User>("/api/me", undefined, { timeoutMs: 5000 })
```
