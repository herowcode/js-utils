---
"@herowcode/utils": minor
---

`markdownToText` accepts `{ keepLinkUrls, singleLine }`; the default output is unchanged.

```ts
import { markdownToText } from "@herowcode/utils/string"

markdownToText("[docs](https://x.dev)", { keepLinkUrls: true }) // "docs (https://x.dev)"
```
