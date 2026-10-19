---
"@herowcode/utils": minor
---

New `/number` subpath (universal): `formatCurrency` (BRL/pt-BR by default, `fromCents`, `stripZeroCents`, `compact`, `{ fallback }`), `formatNumber`, `formatPercent`, `percentOf`, `parseLocaleNumber` (returns `NaN` on garbage, `asCents`) and `toNumber`. Output comes from `Intl`, so pt-BR currency uses a non-breaking space after `R$`.

```ts
import { formatCurrency, parseLocaleNumber } from "@herowcode/utils/number"

formatCurrency(123450, { fromCents: true }) // "R$ 1.234,50"
parseLocaleNumber("R$ 1.234,56") // 1234.56
```
