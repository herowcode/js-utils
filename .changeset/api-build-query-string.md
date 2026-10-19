---
"@herowcode/utils": minor
---

`/api`: export `buildQueryString(params)`, the helper `apiClient` uses for `params`, and accept array values (repeated keys). Existing output is unchanged.

```ts
import { buildQueryString } from "@herowcode/utils/api"

buildQueryString({ page: 1, tag: ["a", "b"] }) // "?page=1&tag=a&tag=b"
```
