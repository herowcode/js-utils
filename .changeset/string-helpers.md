---
"@herowcode/utils": minor
---

`/string` adds `getInitials`, `escapeHtml`, `escapeRegExp` and `pluralize` (also exported from the package root). `docs/array.md` no longer lists `markdownToText`, which has always been exported from `/string`.

```ts
import { getInitials, pluralize } from "@herowcode/utils/string"

getInitials("Maria da Silva") // "MS"
`${3} ${pluralize(3, "item")}` // "3 items"
```
