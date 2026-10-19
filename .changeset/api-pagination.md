---
"@herowcode/utils": minor
---

`/api` adds `getOffset(page, pageSize)` and `buildPageMeta({ page, pageSize, total })` for paginated list endpoints. Invalid numbers are clamped instead of producing `NaN`.

```ts
import { buildPageMeta, getOffset } from "@herowcode/utils/api"

getOffset(3, 20) // 40
buildPageMeta({ page: 2, pageSize: 10, total: 25 }).hasNext // true
```
