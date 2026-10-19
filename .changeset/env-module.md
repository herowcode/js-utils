---
"@herowcode/utils": minor
---

New `/env` subpath (universal): `requireEnv(name, { minLength, env })`, `optionalEnv(name, fallback, { env })` and `parseBoolean(value, fallback)`. The source is injectable, so it works on runtimes without `process`. Errors carry `HEROW_ENV_MISSING`, `HEROW_ENV_NO_SOURCE` or `HEROW_PARSE_BOOLEAN_INVALID` codes, a fix hint and a link to `docs/errors.md`, and never include the value.

```ts
import { parseBoolean, requireEnv } from "@herowcode/utils/env"

const url = requireEnv("DATABASE_URL")
const debug = parseBoolean(process.env.DEBUG, false)
```
