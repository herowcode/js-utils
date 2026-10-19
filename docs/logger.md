# `@herowcode/utils/logger`

Structured logger with a single, consistent contract across Node backend,
browser, and (via copy-paste template) Python. One log call → one line of
JSON in production, with the message kept as a stable identifier and dynamic
values carried in a context object.

```typescript
import { createLogger } from '@herowcode/utils/logger'
```

The same import resolves to:

- `pino`-backed logger when running on Node (Fastify, Express, scripts, jobs).
- Zero-dependency `console`-backed logger when bundled for the browser
  (Next.js client components, Vite, React Native).

For Python, copy `templates/python/logger.py` into your project — it provides
the same contract using stdlib `logging`.

---

## The contract: single emission, structured context

Every log call emits **one line** combining a constant `msg` with structured
fields. Always pass the message first, the context second.

```typescript
// ✅ msg is a stable identifier; dynamic values live in the object
logger.info("weekly_email_sent", { organizationsProcessed: 12, durationMs: 340 })
logger.error("job_processing_failed", { err, jobId: job.id, queueName: "ingest" })

// ❌ template strings make every msg unique → can't aggregate, can't query
logger.info(`Processed job ${jobData.event} in ${endTime - startTime}ms`)
logger.error(`Worker error in queue ${this.queueName}:`, { err })
logger.error({ msg: "socket_io_init_failed", error: err.message })
```

Why this matters: in Loki/CloudWatch/Datadog, queries like
`{service="api", msg="job_processing_failed"} | jobId="..."` only work when
`msg` stays constant and `jobId` is a real field — not text inside a unique
string.

### Standard JSON fields

Every line in production includes:

| Field | Source |
|-------|--------|
| `time` | ISO timestamp |
| `level` | `"debug"` / `"info"` / `"warn"` / `"error"` |
| `service` | from `createLogger({ service })` |
| `env` | from `NODE_ENV` |
| `msg` | the literal you passed |
| `request_id`, `user_id`, ... | from `child()` bindings |
| `err` | when context contains `err: Error` — expanded to `{name, message, stack}` |

---

## Node — `createLogger`

The Node logger needs `pino`, which is an optional peer dependency. Install it before using the Node entrypoint; without it `createLogger` throws a clear error. When bundling server code (Next.js standalone, esbuild, Lambda), keep `pino` external: it is resolved at runtime, so a bundler won't trace it.

```bash
npm install pino
```

```typescript
import { createLogger } from '@herowcode/utils/logger'

const logger = createLogger({ service: 'herow-utils' })

logger.info("server_started", { port: 3000 })
logger.error("queue_worker_error", { err, queueName: "ingest" })

const reqLog = logger.child({ request_id: req.id, user_id: req.user.id })
reqLog.warn("rate_limit_close", { remaining: 3, limit: 100 })
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `service` | required | Identifies the app in JSON output |
| `level` | `LOG_LEVEL` env (ignored if not a Pino level), else `info` (prod) / `debug` (dev) | Min level emitted |
| `redact` | extends defaults | Extra Pino redact paths |
| `bindings` | `{}` | Static fields included in every log |

### Pretty output in dev

Install `pino-pretty` as a dev dep to get colored output when
`NODE_ENV !== 'production'`. The logger detects it at construction time and
falls back to JSON if it isn't installed.

```bash
pnpm add -D pino-pretty
```

### Fastify integration

Fastify reads `request.log` and uses Pino's native `(ctx, msg)` order, so the
wrapper can't be the `loggerInstance`. Use `createPinoInstance` for that:

```typescript
import { createPinoInstance, createLogger } from '@herowcode/utils/logger'

const logger = createLogger({ service: 'herow-utils' })

const server = fastify({
  loggerInstance: createPinoInstance({ service: 'herow-utils' }),
  disableRequestLogging: true,
})

server.addHook('onRequest', (req, _reply, done) => {
  req.log = req.log.child({ request_id: req.id })
  done()
})

// Application code uses the wrapper for the canonical (msg, ctx) order:
logger.info("user_signed_up", { userId: user.id, plan: "pro" })
```

### Express integration

```typescript
import { createLogger } from '@herowcode/utils/logger'

const logger = createLogger({ service: 'herow-utils' })

app.use((req, _res, next) => {
  ;(req as any).log = logger.child({ request_id: req.headers['x-request-id'] })
  next()
})
```

### Default redact paths

`password`, `token`, `apiKey`, `authorization`, `cookie`,
`req.headers.authorization`, `req.headers.cookie`, plus the same keys nested
under any single level (e.g. `*.password`).

---

## Browser — `createLogger`

The browser entrypoint exposes the same API (`(msg, ctx?)`) backed by
`console.*`. In production, every call emits one `console.log(JSON.stringify(...))`.
In development, it uses the matching console level (`console.info`,
`console.warn`, ...) with the object passed as the second arg so DevTools'
object inspector still works — but still one console call per log.

```typescript
"use client"
import { createLogger } from '@herowcode/utils/logger'

const log = createLogger({ service: 'herow-utils' })

log.error("checkout_failed", { orderId, err })
log.info("share_link_clicked", { feature: "share-link", channel: "whatsapp" })
```

### Default level

- `info` in production. Override at runtime via `localStorage.LOG_LEVEL = 'debug'`
  to debug a live session without redeploying.
- `debug` in development.

Production means `process.env.NODE_ENV === 'production'` as inlined by your
bundler (webpack, Next.js, Vite and esbuild `define` all replace that exact
expression). With no bundler and no `process`, the logger falls back to
development.

### Redaction

The same key list applies, matched case-insensitively at any depth, plus
`secret`. `redact` entries use pino's path syntax: a plain key (`ssn`) is
matched at any depth, while an entry with `.`, `[` or `*` is a path from the
log root (`user.ssn`, `headers["x-api-key"]`, `items[*].pan`, `*.card`), where
`*` matches exactly one segment. Bindings from `child()` are redacted along
with the context. While walking, `Date` becomes an ISO string, nested `Error`s are
serialized (name, message, stack, own props), `Map`/`Set` become an object/array,
`URL`/`RegExp` become strings and circular references become `"[Circular]"`.
Standard fields (`time`, `level`, `service`, `env`, `msg`) can't be overwritten
by context or bindings.

### What this logger doesn't do

- No `window.onerror` / `unhandledrejection` capture. Wire those up explicitly
  in your app entry if you need them.
- No transport to Sentry/Datadog/LogRocket. The JSON output is structured so
  any of those can be added later without changing call sites.

---

## Redaction helpers: `redactSecrets` and `redactDeep`

Both are exported from `@herowcode/utils/logger` in every runtime and share the logger's redaction core and `"[REDACTED]"` placeholder.

```typescript
import { redactDeep, redactSecrets } from '@herowcode/utils/logger'
```

### `redactSecrets(text, options?)`

Masks secrets inside free text: `Authorization`/`Bearer` tokens, JWT-shaped strings, `key=value` and `"key": "value"` pairs whose key is one of the logger's secret keys (`password`, `token`, `apiKey`/`api_key`, `authorization`, `cookie`, `secret`), whole `Cookie:` header lines, and common API-key prefixes (`sk-`, `sk_live_`, `ghp_`, `github_pat_`, `xoxb-`, `AKIA`, `AIza`). Keys and quotes are kept; only the value is replaced.

```typescript
redactSecrets('Authorization: Bearer abc.def')       // → "Authorization: [REDACTED]"
redactSecrets('retry failed password=hunter2&id=7')  // → "retry failed password=[REDACTED]&id=7"
redactSecrets('customer CUS-42', { extraPatterns: [/CUS-\d+/] }) // → "customer [REDACTED]"
```

| Option | Description |
|--------|-------------|
| `extraPatterns` | `RegExp` or string (literal) list; every match is replaced. A `RegExp` without the `g` flag is applied globally. You are responsible for keeping your own patterns free of catastrophic backtracking. |

The built-in patterns run in linear time (a 100 KB adversarial input stays under 50 ms in the tests). It is a best-effort scrubber for text you cannot structure; prefer structured context and key-based redaction.

Invalid input returns: `""` for non-string input; text without secrets is returned unchanged.

#### Replacing a local copy

Replaces a hand-rolled `.replace(/Bearer .../)` chain in error reporters. It also covers JWTs and `key=value` pairs that such chains usually miss.

### `redactDeep(value, options?)`

Returns a redacted copy of any value (the input is never mutated). Keys are matched with the logger's rules (default keys at any depth, extra `keys` and paths with the same syntax as the `redact` option), and every string value is passed through `redactSecrets` (plus `patterns`). Like the logger, it turns `Date` into ISO strings, serializes `Error`s and replaces circular references with `"[Circular]"`.

```typescript
redactDeep({ user: 'ana', password: 'x', note: 'token=abc' })
// → { user: 'ana', password: '[REDACTED]', note: 'token=[REDACTED]' }

redactDeep(payload, { keys: ['ssn', 'user.card'], patterns: [/CUS-\d+/], maxDepth: 4 })
```

| Option | Default | Description |
|--------|---------|-------------|
| `keys` | none | Extra keys/paths to redact |
| `patterns` | none | Extra patterns for string values |
| `maxDepth` | `8` | Objects nested deeper than this become `"[MaxDepth]"`, never the raw value |

Invalid input returns: the value itself for primitives (strings are scrubbed); there is no throw path. A 10,000-key object is processed in under 50 ms.

#### Replacing a local copy

Replaces recursive "mask these keys" helpers that miss arrays, cycles and secrets embedded in message strings.

---

## Python — `templates/python/logger.py`

Copy the file from `templates/python/logger.py` into your project. Stdlib
only; `rich` is optional for prettier dev output.

```python
from logger import setup_logging, get_logger, bind

setup_logging(service="herow-utils")
log = get_logger(__name__)

# Same contract: msg constant, dynamics in extra={}
log.info("job_started", extra={"job_id": job_id, "queue": "ingest"})

req = bind(log, request_id=request_id, user_id=user_id)
req.error("downstream_failed", extra={"endpoint": "/ai/chat"}, exc_info=err)
```

See `templates/python/README.md` for full instructions.

---

## Anti-pattern catalog

| Anti-pattern | Why it's bad | Fix |
|--------------|--------------|-----|
| `log.info(\`Processed ${jobId} in ${ms}ms\`)` | every msg is unique | `log.info("job_processed", { jobId, durationMs: ms })` |
| `log.error("Failed:", err)` (string + extra arg) | not Pino canonical, may split or lose fields | `log.error("operation_failed", { err })` |
| `log.error({ msg: "x", error: ... })` | mixes msg into context, easy to typo | `log.error("x", { error })` |
| `console.log` in committed app code | bypasses level gating, redaction, structured fields | `logger.info("evt", { ... })` |
| Multiple log calls for one event | breaks 1-event-1-line | combine into a single call with structured context |
