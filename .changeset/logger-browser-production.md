---
"@herowcode/utils": patch
---

`/logger` (browser): production is now detected in bundled apps. The logger read `process.env?.NODE_ENV` behind a `typeof process` guard, which bundler `define` replacements never match, so browser builds always logged at debug level in dev format. It now reads the exact `process.env.NODE_ENV` expression.

Upgrade note: in bundled production browser apps, every level (including `warn` and `error`) is now one JSON line through `console.log`, and `debug` is dropped. Error trackers that hook `console.error`/`console.warn` (e.g. Sentry's console integration) stop seeing these logs; forward them explicitly or set `level`/`localStorage.LOG_LEVEL` as needed.
