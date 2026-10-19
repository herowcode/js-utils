# `@herowcode/utils/function`

Control flow utilities (debounce, throttle, tryCatch), runtime checks and safe JSON parsing.

```typescript
import {
  debounce,
  isBrowser,
  isServer,
  safeJsonParse,
  throttle,
  tryCatch,
  tryCatchResult,
} from '@herowcode/utils/function';
```

---

## `debounce(fn, delay)`

Returns a debounced version of `fn` that only executes after `delay` ms have elapsed since the last call. Resets the timer on every invocation.

```typescript
const handleSearch = debounce((query: string) => {
  fetchResults(query);
}, 300);

// Typing quickly — only the last call fires after 300ms of inactivity
input.addEventListener('input', (e) => handleSearch(e.target.value));
```

```typescript
// With window resize
const onResize = debounce(() => {
  recalculateLayout();
}, 200);

window.addEventListener('resize', onResize);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `fn` | `(...args: A) => unknown` | The function to debounce; its parameter types carry over to the returned function |
| `delay` | `number` | Milliseconds to wait after the last call |

The returned function also has `cancel()` (drops the pending call) and `flush()` (runs the pending call now with the last arguments; no-op when nothing is pending).

```typescript
const save = debounce(persist, 500);
save(draft);
window.addEventListener('beforeunload', () => save.flush());
// later, on unmount: save.cancel();
```

---

## `throttle(fn, delay, options?)`

Returns a throttled version of `fn` that executes at most once every `delay` ms, regardless of how often it is called.

```typescript
const onScroll = throttle(() => {
  updateProgressBar();
}, 100);

window.addEventListener('scroll', onScroll);
```

```typescript
// Limit API calls on rapid user interaction
const saveChanges = throttle(async (data) => {
  await api.save(data);
}, 1000);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `fn` | `(...args: A) => unknown` | The function to throttle; its parameter types carry over to the returned function |
| `delay` | `number` | Minimum milliseconds between invocations |
| `options.leading` | `boolean` | Default `true`: invoke on the first call of a window |
| `options.trailing` | `boolean` | Default `true`: invoke once more at the window end with the last arguments |

Both default to `true`, which is the previous behavior. Disabling both throws, since the function could never run.

```typescript
const onScroll = throttle(update, 100, { trailing: false }); // drops calls inside the window
```

---

## `isBrowser()` / `isServer()`

`isBrowser()` is `true` when both `window` and `document` exist; `isServer()` is its negation (Node, edge workers, SSR). Both are functions so they are evaluated at call time and are safe to import in any runtime.

```typescript
if (isBrowser()) {
  window.addEventListener('resize', onResize);
}
```

Invalid input returns: not applicable (no arguments).

### Replacing a local copy

Replaces `typeof window !== 'undefined'` checks, which are also true in React Native (it defines `window` but has no `document`).

---

## `safeJsonParse(text, options?)`

`JSON.parse` that never throws.

```typescript
safeJsonParse<{ page: number }>('{"page":2}');               // → { page: 2 }
safeJsonParse('{broken', { fallback: { page: 1 } });         // → { page: 1 }
safeJsonParse(localStorage.getItem('prefs'), { fallback: {} });
```

| Option | Default | Description |
|--------|---------|-------------|
| `fallback` | `undefined` | Returned when parsing fails or the input is not a string |

Invalid input returns: `fallback` (malformed JSON, `null`, `undefined`, or any non-string). The type argument is not validated; check the shape with Zod when the source is untrusted.

### Replacing a local copy

Replaces `try { return JSON.parse(x) } catch { return fallback }` helpers. A valid value such as `false`, `0` or `null` is returned as parsed, never replaced by the fallback.

---

## `tryCatch(fn, defaultData?)`

Executes a function or promise and returns `{ data, error }` — never throws. A typed alternative to `try/catch` blocks.

```typescript
const { data, error } = await tryCatch(() => fetchUser(userId));

if (error) {
  console.error('Failed:', error.message);
} else {
  console.log('User:', data);
}
```

```typescript
// With a default value on error
const { data } = await tryCatch(
  () => loadSettings(),
  { theme: 'light', language: 'en' } // returned when fn throws
);
```

```typescript
// Works with async functions and plain promises
const { data, error } = await tryCatch(fetch('/api/status'));

// With explicit typing
const { data, error } = await tryCatch<User[], Error>(
  () => client.get<User[]>('/users')
);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `fn` | `Promise<T> \| (() => Promise<T> \| T)` | Async or sync function to execute |
| `defaultData` | `D` | Value returned as `data` when `fn` throws |

**Return:** `Promise<{ data: T | D; error: E | null }>`

Invalid input returns: not applicable; a throw or rejection becomes `{ data: defaultData ?? null, error }`.

---

## `tryCatchResult(fn)`

Same input as `tryCatch` (a promise, or a function returning a value or promise), but returns a discriminated `{ ok }` result, so `if (!r.ok)` narrows without null checks. It has no default-data parameter.

```typescript
const r = await tryCatchResult(() => fetchUser(id));
if (!r.ok) {
  report(r.error); // E (defaults to unknown; narrow it or pass E explicitly)
  return;
}
r.data; // User
```

**Return:** `Promise<{ ok: true; data: T } | { ok: false; error: E }>`

### Which result shape to use

| Helper | Shape | Use when |
|--------|-------|----------|
| `tryCatch(fn, defaultData?)` | `{ data, error }` | You want a fallback `data` on failure, or already destructure `{ data, error }` |
| `tryCatchResult(fn)` | `{ ok: true, data } \| { ok: false, error }` | You want narrowing on `ok`, and `data` may legitimately be `null` |
| `apiWrapper(fn)` (`/api`) | `{ data, error: IApiError }` | The call is an HTTP request and you want a normalized error (`status`, `retryAfterSeconds`) |
| `safeJsonParse(text, { fallback })` | the value or the fallback | The operation is synchronous `JSON.parse` |

Invalid input returns: not applicable; failures become `{ ok: false, error }`.

### Replacing a local copy

Replaces local `Result<T>` helpers shaped `{ ok, data } | { ok, error }` or `[error, data]` tuples. Map `[err, data]` call sites to `r.ok ? r.data : r.error`.

---

[← Back to README](../README.md)
