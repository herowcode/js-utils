---
"@herowcode/utils": minor
---

`formatBytes` accepts `{ decimals, base, locale }`; the default output is unchanged.

```ts
import { formatBytes } from "@herowcode/utils/files"

formatBytes(1500, { base: 1000, decimals: 1 }) // "1.5 KB"
formatBytes(1536, { locale: "pt-BR" }) // "1,50 KB"
```
