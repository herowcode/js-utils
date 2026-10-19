---
"@herowcode/utils": minor
---

`/logger` adds `redactSecrets(text, { extraPatterns })` for free text (bearer tokens, JWTs, `key=value` secrets, common API-key prefixes) and `redactDeep(value, { keys, patterns, maxDepth })` for objects, both built on the logger's existing redaction core. Objects deeper than `maxDepth` (default 8) become `"[MaxDepth]"`.

```ts
import { redactDeep, redactSecrets } from "@herowcode/utils/logger"

redactSecrets("Authorization: Bearer abc.def") // "Authorization: [REDACTED]"
redactDeep({ user: "ana", password: "x" }) // { user: "ana", password: "[REDACTED]" }
```

The browser `/logger` entry grows by about 0.5 kB.
