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

---

## `throttle(fn, delay)`

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

Replaces `typeof window !== 'undefined'` checks. They do not detect a React Native or web-worker context as a browser.

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

---

[← Back to README](../README.md)
