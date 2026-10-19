---
"@herowcode/utils": minor
---

`/function` adds `isBrowser`, `isServer` and `safeJsonParse(text, { fallback })` (also exported from the package root).

```ts
import { safeJsonParse } from "@herowcode/utils/function"

safeJsonParse(localStorage.getItem("prefs"), { fallback: {} })
```
