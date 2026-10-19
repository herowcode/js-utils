---
"@herowcode/utils": minor
---

`/files` adds `safeStorage(kind?)`, a `localStorage`/`sessionStorage` wrapper that never throws: blocked storage, quota errors and SSR fall back to per-instance memory. `set` and `setJSON` return `false` when the value is only in memory. The Node.js entry exports a memory-only version.

```ts
import { safeStorage } from "@herowcode/utils/files"

const prefs = safeStorage()
prefs.setJSON("prefs", { theme: "dark" }) // true when persisted
prefs.getJSON("prefs", { fallback: { theme: "light" } })
```
