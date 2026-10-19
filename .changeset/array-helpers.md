---
"@herowcode/utils": minor
---

`/array` adds `chunk`, `sumBy`, `groupBy` and `keyBy` (also exported from the package root). `groupBy` and `keyBy` are safe against `__proto__` keys and do not need `Object.groupBy`.

```ts
import { chunk, groupBy } from "@herowcode/utils/array"

chunk([1, 2, 3], 2) // [[1, 2], [3]]
groupBy([1, 2, 3], (n) => (n % 2 ? "odd" : "even")) // { odd: [1, 3], even: [2] }
```
