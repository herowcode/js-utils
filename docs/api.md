# `@herowcode/utils/api`

HTTP client with retry logic, async auth token injection, and standardized error handling.

```typescript
import { apiClient, apiWrapper } from '@herowcode/utils/api';
```

---

## `apiClient(config?)`

Factory that returns a typed HTTP client. All methods return `{ data, error }` — never throw.

```typescript
const client = apiClient({
  baseURL: 'https://api.example.com',
  getAccessToken: async () => localStorage.getItem('token'),
  onSignoutUnauthorized: () => router.push('/login'),
});

// GET
const { data, error } = await client.get<User[]>('/users', { params: { page: 1 } });

// POST
const { data, error } = await client.post<User>('/users', { name: 'Alice' });

// PUT / PATCH / DELETE
await client.put<User>('/users/1', { name: 'Alice Updated' });
await client.patch<User>('/users/1', { name: 'Alice Patched' });
await client.delete('/users/1');
```

### Config options

| Option | Type | Description |
|--------|------|-------------|
| `baseURL` | `string` | Base URL prepended to all requests |
| `getAccessToken` | `() => Promise<string \| null>` | Called before every request; result injected as `Authorization: Bearer` |
| `onSignoutUnauthorized` | `() => void` | Called on 401 responses (except `/sign-in` paths) |
| `getUserIP` | `() => Promise<string \| null>` | Called before every request; result injected as `x-forwarded-for` |

### Return type

```typescript
type TApiResult<T> = {
  data: T | null;
  error: IApiError | null;
};

interface IApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  path?: string;
  timestamp?: string;
}
```

### Retry behavior

Requests are automatically retried on network failures and 5xx responses. The client uses exponential backoff and only retries idempotent methods (`GET`, `PUT`, `DELETE`, `PATCH`).

---

## `apiWrapper<T>(fn, defaultData?)`

Wraps any async function that may throw and returns `{ data, error }`. Handles `Response`, `AxiosError`, and `Error` objects.

```typescript
const { data, error } = await apiWrapper(
  () => fetch('https://api.example.com/users').then(r => r.json()),
  [] // default data if error occurs
);
```

```typescript
// With a typed result
const { data, error } = await apiWrapper<User[]>(async () => {
  const res = await fetch('/api/users');
  if (!res.ok) throw res;
  return res.json();
});

if (error) {
  console.error(error.message, error.status);
} else {
  console.log(data); // User[]
}
```

---

[← Back to README](../README.md)
