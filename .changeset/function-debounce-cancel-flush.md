---
"@herowcode/utils": minor
---

`debounce` returns a function with `cancel()` and `flush()`; it is still assignable to `(...args) => void`.

```ts
import { debounce } from "@herowcode/utils/function"

const save = debounce(persist, 500)
save(draft)
save.flush() // runs persist(draft) now
```
