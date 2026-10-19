---
"@herowcode/utils": minor
---

`throttle` accepts `{ leading, trailing }`, both `true` by default (the previous timing).

```ts
import { throttle } from "@herowcode/utils/function"

const onScroll = throttle(update, 100, { trailing: false })
```
