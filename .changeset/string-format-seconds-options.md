---
"@herowcode/utils": minor
---

`formatSecondsToHMS` accepts `{ alwaysShowHours, rounding }` and `formatSecondsToFragment` accepts `{ separator, rounding }`; the default output is unchanged.

```ts
import { formatSecondsToFragment, formatSecondsToHMS } from "@herowcode/utils/string"

formatSecondsToHMS(65, { alwaysShowHours: true }) // "00:01:05"
formatSecondsToFragment(3723, { separator: " " }) // "1h 2m 3s"
```
