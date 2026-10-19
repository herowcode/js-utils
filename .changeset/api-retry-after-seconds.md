---
"@herowcode/utils": minor
---

`IApiError.retryAfterSeconds` is set by `apiWrapper` from a `Retry-After` header on the thrown `Response`; the rest of the error shape is unchanged.

```ts
import { apiWrapper } from "@herowcode/utils/api"

const { error } = await apiWrapper(() => callApi())
error?.retryAfterSeconds // 30
```
