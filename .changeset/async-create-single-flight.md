---
"@herowcode/utils": minor
---

`/async` adds `createSingleFlight(fn)`: concurrent calls share one in-flight promise, the slot is cleared on settle (before waiters resume, on success and on failure), and the next call starts a fresh run.

```ts
import { createSingleFlight } from "@herowcode/utils/async"

const refreshToken = createSingleFlight(() => api.refresh())
await Promise.all([refreshToken(), refreshToken()]) // one refresh call
```
