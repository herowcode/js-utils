---
"@herowcode/utils": minor
---

`/string`: add `removeAccents(text)` and `normalizeText(text)` (lowercase, no accents or punctuation, collapsed whitespace). `slugify` now builds on them with identical output.

```ts
import { normalizeText, removeAccents } from "@herowcode/utils/string"

removeAccents("Crème Brûlée") // "Creme Brulee"
normalizeText("  Olá,   Mundo! ") // "ola mundo"
```
