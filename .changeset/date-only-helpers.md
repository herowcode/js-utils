---
"@herowcode/utils": minor
---

`/date`: add timezone-safe date-only helpers that use `Intl` only (importing them does not pull in dayjs): `toISODate`, `getTodayISODate`, `addDaysISO`, `diffDaysISO`, `parseISODateLocal`, `getZonedHour` and `getDatePartsInTimeZone`. `timeZone` defaults to the runtime zone; servers should pass it explicitly.

```ts
import { addDaysISO, toISODate } from "@herowcode/utils/date"

toISODate(new Date("2026-01-02T01:30:00Z"), { timeZone: "America/Sao_Paulo" }) // "2026-01-01"
addDaysISO("2028-02-28", 1) // "2028-02-29"
```
