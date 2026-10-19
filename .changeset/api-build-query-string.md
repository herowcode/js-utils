---
"@herowcode/utils": minor
---

`/api`: export `buildQueryString(params)`, the helper `apiClient` uses for `params`, and accept array values (repeated keys). Output for scalar values is unchanged, but JS callers that passed an array before now get repeated keys (`tag=a&tag=b`) instead of the old `tag=a,b`.

```ts
import { buildQueryString } from "@herowcode/utils/api"

buildQueryString({ page: 1, tag: ["a", "b"] }) // "?page=1&tag=a&tag=b"
```
