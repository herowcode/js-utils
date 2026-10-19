---
"@herowcode/utils": minor
---

New `/phone` subpath (universal) for BR and US numbers: `onlyDigits`, `normalizePhone` (E.164), `formatPhone`, `getBRMobileVariants` (with and without the 9th digit) and `buildWhatsAppLink`. Invalid numbers return the `fallback` option (`null` for `normalizePhone`, `""` for the formatters, `[]` for `getBRMobileVariants`).

```ts
import { buildWhatsAppLink, normalizePhone } from "@herowcode/utils/phone"

normalizePhone("(11) 99999-9999") // "+5511999999999"
buildWhatsAppLink("11999999999", { message: "Olá!" })
```
