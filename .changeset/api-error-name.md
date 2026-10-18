---
"@herowcode/utils": minor
---

`/api`: `IApiError` gains an optional `name` with the thrown error's name when it is not a plain `Error`, so a timeout (`"TimeoutError"`) can be told apart from a caller abort (`"AbortError"`) without matching the legacy numeric `code` (`"23"`/`"20"`, unchanged). `DOMException`s are now recognised even where they don't extend `Error` (e.g. jsdom), instead of collapsing to the message `"{}"`.
