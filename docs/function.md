# `@herowcode/utils/function`

Control flow utilities: debounce, throttle, and a safe async wrapper.

```typescript
import { debounce, throttle, tryCatch } from '@herowcode/utils/function';
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
| `fn` | `Function` | The function to debounce |
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
| `fn` | `Function` | The function to throttle |
| `delay` | `number` | Minimum milliseconds between invocations |

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
