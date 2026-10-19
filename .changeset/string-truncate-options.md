---
"@herowcode/utils": minor
---

`truncate` accepts `{ suffix, wordBoundary }` as its third argument (a plain suffix string still works).

```ts
import { truncate } from "@herowcode/utils/string"

truncate("hello brave world", 14, { wordBoundary: true }) // "hello brave..."
```
