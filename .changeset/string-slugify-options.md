---
"@herowcode/utils": minor
---

`slugify` accepts `{ separator, maxLength }`; the default output is unchanged.

```ts
import { slugify } from "@herowcode/utils/string"

slugify("Olá Mundo", { separator: "_" }) // "ola_mundo"
slugify("hello brave world", { maxLength: 7 }) // "hello-b"
```
