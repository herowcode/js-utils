---
"@herowcode/utils": minor
---

`/files` adds `toCSV` (universal, RFC 4180, neutralizes spreadsheet formulas by default while keeping numbers and numeric strings untouched) and the browser helpers `copyToClipboard` and `downloadBlob` (they reject or throw in the Node entry like the other browser-only helpers). `downloadUrl` now reuses `downloadBlob`'s code with unchanged behavior.

```ts
import { downloadBlob, toCSV } from "@herowcode/utils/files"

downloadBlob(new Blob([toCSV(rows, { bom: true })], { type: "text/csv" }), "report.csv")
```

Note: text cells starting with `=`, `+`, `-` or `@` (for example `"+55 11 99999-0000"`) get a leading `'`; pass `neutralizeFormulas: false` for trusted data.
