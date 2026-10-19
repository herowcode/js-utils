---
"@herowcode/utils": minor
---

New `/auth` subpath (universal): `decodeJWT` (does NOT verify signatures; `null` when malformed), `getJWTExp`, `isJWTExpired`, `isJWTExpiring(token, { marginSeconds = 30 })` and `extractBearerToken`. Expiry checks fail closed and margins are in seconds.

```ts
import { isJWTExpiring } from "@herowcode/utils/auth"

if (isJWTExpiring(token, { marginSeconds: 60 })) await refresh()
```
