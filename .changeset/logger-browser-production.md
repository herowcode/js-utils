---
"@herowcode/utils": patch
---

`/logger` (browser): production is now detected in bundled apps. The logger read `process.env?.NODE_ENV` behind a `typeof process` guard, which bundler `define` replacements never match, so browser builds always logged at debug level in dev format. It now reads the exact `process.env.NODE_ENV` expression.
