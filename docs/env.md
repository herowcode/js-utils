# `@herowcode/utils/env`

Read environment variables with clear failures and one documented boolean format. Universal: no Node builtins; the default source is `globalThis.process?.env`, and you can inject any source (Workers bindings, a test fixture).

```typescript
import { optionalEnv, parseBoolean, requireEnv } from '@herowcode/utils/env';
```

Errors thrown here carry a stable `err.code` and a message with what happened, how to fix it and a link to [errors.md](errors.md). Messages name the variable and never include its value.

---

## `requireEnv(name, options?)`

Returns the variable, or throws when it is unset, empty or whitespace-only, or shorter than `minLength`.

```typescript
const databaseUrl = requireEnv('DATABASE_URL');
const secret = requireEnv('SESSION_SECRET', { minLength: 32 });

// Cloudflare Workers: pass the bindings explicitly
export default { fetch: (req, env) => run(requireEnv('API_KEY', { env })) };
```

| Option | Default | Description |
|--------|---------|-------------|
| `minLength` | none | Reject shorter values |
| `env` | `globalThis.process?.env` | Source object (`Record<string, string \| undefined>`) |

Throws: [`HEROW_ENV_MISSING`](errors.md#herow_env_missing) when the variable is missing or too short; [`HEROW_ENV_NO_SOURCE`](errors.md#herow_env_no_source) when the runtime has no environment and no `env` was passed. An `env` key that is present but `undefined` counts as "no source", so a typo in `{ env: context?.env }` fails loudly instead of reading the wrong place.

Invalid input returns: not applicable, it throws.

### Replacing a local copy

Replaces `process.env.X!` and `if (!process.env.X) throw new Error('Missing X')`. Differences: whitespace-only counts as missing, and it works where `process` does not exist once you pass `env`.

---

## `optionalEnv(name, fallback?, options?)`

Returns the variable, or `fallback` when it is unset, empty or whitespace-only.

```typescript
const region = optionalEnv('AWS_REGION', 'us-east-1');   // string
const sentry = optionalEnv('SENTRY_DSN');                // string | undefined
```

Throws: [`HEROW_ENV_NO_SOURCE`](errors.md#herow_env_no_source) when the runtime has no environment and no `env` was passed.

Invalid input returns: `fallback` (or `undefined` without one) for unset, empty and whitespace-only values.

### Replacing a local copy

Replaces `process.env.X ?? 'default'`, which keeps an empty string (`X=`) instead of using the default.

---

## `parseBoolean(value, fallback?)`

Parses env-style booleans after trimming and lowercasing strings.

| Input | Result |
|-------|--------|
| `"true"`, `"1"`, `"yes"`, `"y"`, `"on"` | `true` |
| `"false"`, `"0"`, `"no"`, `"n"`, `"off"`, `""` (also whitespace-only) | `false` |
| `true` / `false` | passed through |
| `1` / `0` | `true` / `false` |
| anything else (`undefined`, `null`, `"maybe"`, `2`, objects) | `fallback` if given, otherwise throws |

```typescript
parseBoolean(process.env.FEATURE_X, false); // unset or garbage → false
parseBoolean('Yes');                        // → true
parseBoolean('maybe');                      // throws
```

Throws: [`HEROW_PARSE_BOOLEAN_INVALID`](errors.md#herow_parse_boolean_invalid) (a `TypeError`) when the value is not recognized and no `fallback` was passed. The value is not included in the message.

Invalid input returns: `fallback` when one is passed (`false` is a valid fallback); an empty string is a recognized `false`, so it does not use the fallback.

### Replacing a local copy

Replaces `process.env.X === 'true'`, which treats `"1"`, `"TRUE"` and `"yes"` as false, and `Boolean(process.env.X)`, which treats `"false"` as true. Pass a fallback to keep the lenient behavior.

---

[← Back to README](../README.md)
