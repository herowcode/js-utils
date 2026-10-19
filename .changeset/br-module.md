---
"@herowcode/utils": minor
---

New `/br` subpath (universal) for Brazilian documents: `formatCEP`, `formatCPF`, `isValidCPF`, `formatCNPJ` and `isValidCNPJ`. Validators check the check digits and reject repeated digits; the CNPJ functions also accept the alphanumeric format. `format*` only checks the length and returns `fallback` (`""`) otherwise.

```ts
import { formatCPF, isValidCPF } from "@herowcode/utils/br"

if (isValidCPF(input)) formatCPF(input) // "529.982.247-25"
```
