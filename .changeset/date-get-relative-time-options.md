---
"@herowcode/utils": minor
---

`getRelativeTime(date, dateNow?, { style, calendar, locale, fallback })` can render through `Intl.RelativeTimeFormat` (default locale `pt-BR`). Without `style` or `calendar` the dayjs output is unchanged.

```ts
import { getRelativeTime } from "@herowcode/utils/date"

getRelativeTime(yesterday, now, { calendar: true }) // "ontem"
getRelativeTime("garbage", now, { fallback: "-" }) // "-"
```
