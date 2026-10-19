---
"@herowcode/utils": minor
---

`formatDate` accepts `fallback` on its config-object form and returns it for an invalid date. Without it, an invalid date still throws `RangeError`.

```ts
import { formatDate } from "@herowcode/utils/date"

formatDate("not a date", { format: "DD/MM/YYYY", fallback: "-" }) // "-"
```
