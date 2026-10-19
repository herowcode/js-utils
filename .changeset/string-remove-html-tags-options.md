---
"@herowcode/utils": minor
---

`removeHtmlTags` accepts `{ decodeEntities, collapseWhitespace }`; the default output is unchanged.

```ts
import { removeHtmlTags } from "@herowcode/utils/string"

removeHtmlTags("<p>a &amp;  b</p>", { decodeEntities: true, collapseWhitespace: true }) // "a & b"
```
