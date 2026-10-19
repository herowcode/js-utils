---
"@herowcode/utils": minor
---

`/function` adds `tryCatchResult`, a discriminated `{ ok }` variant of `tryCatch`.

```ts
import { tryCatchResult } from "@herowcode/utils/function"

const r = await tryCatchResult(() => fetchUser(id))
if (!r.ok) return report(r.error)
r.data // User
```
