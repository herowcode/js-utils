# @herowcode/utils

## 2.3.0

### Minor Changes

- f2648cf: Ship `llms.txt`, a compact module and function index so LLMs and coding agents can see what the package offers.

## 2.2.0

### Minor Changes

- 9ddf221: `/api`: export `buildQueryString(params)`, the helper `apiClient` uses for `params`, and accept array values (repeated keys). Output for scalar values is unchanged, but JS callers that passed an array before now get repeated keys (`tag=a&tag=b`) instead of the old `tag=a,b`.
  
  ```ts
  import { buildQueryString } from "@herowcode/utils/api"
  
  buildQueryString({ page: 1, tag: ["a", "b"] }) // "?page=1&tag=a&tag=b"
  ```
- 9ddf221: `/api` adds `getOffset(page, pageSize)` and `buildPageMeta({ page, pageSize, total })` for paginated list endpoints. Invalid numbers are clamped instead of producing `NaN`.
  
  ```ts
  import { buildPageMeta, getOffset } from "@herowcode/utils/api"
  
  getOffset(3, 20) // 40
  buildPageMeta({ page: 2, pageSize: 10, total: 25 }).hasNext // true
  ```
- 9ddf221: `IApiError.retryAfterSeconds` is set by `apiWrapper` from a `Retry-After` header on the thrown `Response`; the rest of the error shape is unchanged.
  
  ```ts
  import { apiWrapper } from "@herowcode/utils/api"
  
  const { error } = await apiWrapper(() => callApi())
  error?.retryAfterSeconds // 30
  ```
- 9ddf221: `/array` adds `chunk`, `sumBy`, `groupBy` and `keyBy` (also exported from the package root). `groupBy` and `keyBy` are safe against `__proto__` keys and do not need `Object.groupBy`.
  
  ```ts
  import { chunk, groupBy } from "@herowcode/utils/array"
  
  chunk([1, 2, 3], 2) // [[1, 2], [3]]
  groupBy([1, 2, 3], (n) => (n % 2 ? "odd" : "even")) // { odd: [1, 3], even: [2] }
  ```
- 9ddf221: `/async` adds `createSingleFlight(fn)`: concurrent calls share one in-flight promise, the slot is cleared on settle (before waiters resume, on success and on failure), and the next call starts a fresh run.
  
  ```ts
  import { createSingleFlight } from "@herowcode/utils/async"
  
  const refreshToken = createSingleFlight(() => api.refresh())
  await Promise.all([refreshToken(), refreshToken()]) // one refresh call
  ```
- 9ddf221: New `/async` subpath (universal): `sleep`, `withTimeout(signal, timeoutMs)` (native `AbortSignal.any`/`timeout` with a manual fallback), `backoffDelay`, `parseRetryAfterMs`, `retry`, `mapInChunks` and `createConcurrencyLimiter`. `retry` only retries transient errors by default, never retries `AbortError`, and lets `Retry-After` / `retryAfterSeconds` override the backoff. The `/api` client now uses these helpers internally with unchanged behavior.
  
  ```ts
  import { retry } from "@herowcode/utils/async"
  
  const user = await retry(() => loadUser(id), { attempts: 4 })
  ```
  
  Migration note: a local `retry` that retried every error needs `shouldRetry: () => true` to keep that behavior.
- 9ddf221: New `/auth` subpath (universal): `decodeJWT` (does NOT verify signatures; `null` when malformed), `getJWTExp`, `isJWTExpired`, `isJWTExpiring(token, { marginSeconds = 30 })` and `extractBearerToken`. Expiry checks fail closed and margins are in seconds.
  
  ```ts
  import { isJWTExpiring } from "@herowcode/utils/auth"
  
  if (isJWTExpiring(token, { marginSeconds: 60 })) await refresh()
  ```
- 9ddf221: New `/br` subpath (universal) for Brazilian documents: `formatCEP`, `formatCPF`, `isValidCPF`, `formatCNPJ` and `isValidCNPJ`. Validators check the check digits and reject repeated digits; the CNPJ functions also accept the alphanumeric format. `format*` only checks the length and returns `fallback` (`""`) otherwise.
  
  ```ts
  import { formatCPF, isValidCPF } from "@herowcode/utils/br"
  
  if (isValidCPF(input)) formatCPF(input) // "529.982.247-25"
  ```
- 9ddf221: New `/crypto` subpath (universal, WebCrypto only, no Node imports): `sha256Hex`, `hmacSha256Hex`, `safeEqual` (synchronous, constant-time), `generateOpaqueToken(bytes = 32)` returning `{ token, hash }` and `verifyHmacSignature(payload, signature, secret, { encoding, prefix })`. Everything except `safeEqual` returns a Promise, so always `await` (an un-awaited `verifyHmacSignature` is always truthy). Errors carry `HEROW_CRYPTO_UNAVAILABLE` or `HEROW_CRYPTO_INVALID_BYTES`.
  
  ```ts
  import { verifyHmacSignature } from "@herowcode/utils/crypto"
  
  const ok = await verifyHmacSignature(rawBody, header, secret, { prefix: "sha256=" })
  ```
- 9ddf221: `formatDate` accepts `fallback` on its config-object form and returns it for an invalid date. Without it, an invalid date still throws `RangeError`.
  
  ```ts
  import { formatDate } from "@herowcode/utils/date"
  
  formatDate("not a date", { format: "DD/MM/YYYY", fallback: "-" }) // "-"
  ```
- 9ddf221: `getRelativeTime(date, dateNow?, { style, calendar, locale, fallback })` can render through `Intl.RelativeTimeFormat` (default locale `pt-BR`). Without `style` or `calendar` the dayjs output is unchanged.
  
  ```ts
  import { getRelativeTime } from "@herowcode/utils/date"
  
  getRelativeTime(yesterday, now, { calendar: true }) // "ontem"
  getRelativeTime("garbage", now, { fallback: "-" }) // "-"
  ```
- 9ddf221: `/date`: add timezone-safe date-only helpers that use `Intl` only (importing them does not pull in dayjs): `toISODate`, `getTodayISODate`, `addDaysISO`, `diffDaysISO`, `parseISODateLocal`, `getZonedHour` and `getDatePartsInTimeZone`. `timeZone` defaults to the runtime zone; servers should pass it explicitly.
  
  ```ts
  import { addDaysISO, toISODate } from "@herowcode/utils/date"
  
  toISODate(new Date("2026-01-02T01:30:00Z"), { timeZone: "America/Sao_Paulo" }) // "2026-01-01"
  addDaysISO("2028-02-28", 1) // "2028-02-29"
  ```
- 9ddf221: New `/env` subpath (universal): `requireEnv(name, { minLength, env })`, `optionalEnv(name, fallback, { env })` and `parseBoolean(value, fallback)`. The source is injectable, so it works on runtimes without `process`. Errors carry `HEROW_ENV_MISSING`, `HEROW_ENV_NO_SOURCE` or `HEROW_PARSE_BOOLEAN_INVALID` codes, a fix hint and a link to `docs/errors.md`, and never include the value.
  
  ```ts
  import { parseBoolean, requireEnv } from "@herowcode/utils/env"
  
  const url = requireEnv("DATABASE_URL")
  const debug = parseBoolean(process.env.DEBUG, false)
  ```
- 9ddf221: `/errors` now ships the `HttpError` family: `HttpError(status, message?, { code, details, cause })` plus `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError` and `TooManyRequestsError` (with `retryAfterSeconds`). Instances carry the brand `Symbol.for("@herowcode/utils.HttpError")`, so `instanceof` and the new `isHttpError()` guard work across the CJS and ESM builds. `getErrorStatus` reads `HttpError.status` and `retry` honours `retryAfterSeconds`.
  
  ```ts
  import { isHttpError, NotFoundError } from "@herowcode/utils/errors"
  
  throw new NotFoundError("User not found")
  if (isHttpError(err) && err.status === 404) return null
  ```
- 9ddf221: New `/errors` subpath (universal): `getErrorMessage(err, { fallback, keys })`, `getRootCause`, `getErrorStatus` (reads `status`, `statusCode`, `response.status` through the cause chain), `isTransientNetworkError(err, { includeTimeouts })` (looks through `cause`, so Node's `fetch failed` is classified by its cause code) and `isTransientStatus` with `TRANSIENT_STATUS_CODES`. The `/api` client builds its default `retry.statusCodes` from that list.
  
  ```ts
  import { getErrorMessage, isTransientNetworkError } from "@herowcode/utils/errors"
  
  getErrorMessage({ error: { message: "Nope" } }) // "Nope"
  isTransientNetworkError(new TypeError("fetch failed", { cause: { code: "ECONNRESET" } })) // true
  ```
- 9ddf221: `/files` adds `toCSV` (universal, RFC 4180, neutralizes spreadsheet formulas by default while keeping numbers and numeric strings untouched) and the browser helpers `copyToClipboard` and `downloadBlob` (they reject or throw in the Node entry like the other browser-only helpers). `downloadUrl` now reuses `downloadBlob`'s code with unchanged behavior.
  
  ```ts
  import { downloadBlob, toCSV } from "@herowcode/utils/files"
  
  downloadBlob(new Blob([toCSV(rows, { bom: true })], { type: "text/csv" }), "report.csv")
  ```
  
  Note: text cells starting with `=`, `+`, `-` or `@` (for example `"+55 11 99999-0000"`) get a leading `'`; pass `neutralizeFormulas: false` for trusted data.
- 9ddf221: `formatBytes` accepts `{ decimals, base, locale }`; the default output is unchanged.
  
  ```ts
  import { formatBytes } from "@herowcode/utils/files"
  
  formatBytes(1500, { base: 1000, decimals: 1 }) // "1.5 KB"
  formatBytes(1536, { locale: "pt-BR" }) // "1,50 KB"
  ```
- 9ddf221: `/files` adds `safeStorage(kind?)`, a `localStorage`/`sessionStorage` wrapper that never throws: blocked storage, quota errors and SSR fall back to per-instance memory. `set` and `setJSON` return `false` when the value is only in memory. The Node.js entry exports a memory-only version.
  
  ```ts
  import { safeStorage } from "@herowcode/utils/files"
  
  const prefs = safeStorage()
  prefs.setJSON("prefs", { theme: "dark" }) // true when persisted
  prefs.getJSON("prefs", { fallback: { theme: "light" } })
  ```
- 9ddf221: `debounce` returns a function with `cancel()` and `flush()`; it is still assignable to `(...args) => void`.
  
  ```ts
  import { debounce } from "@herowcode/utils/function"
  
  const save = debounce(persist, 500)
  save(draft)
  save.flush() // runs persist(draft) now
  ```
- 9ddf221: `/function` adds `isBrowser`, `isServer` and `safeJsonParse(text, { fallback })` (also exported from the package root).
  
  ```ts
  import { safeJsonParse } from "@herowcode/utils/function"
  
  safeJsonParse(localStorage.getItem("prefs"), { fallback: {} })
  ```
- 9ddf221: `throttle` accepts `{ leading, trailing }`, both `true` by default (the previous timing).
  
  ```ts
  import { throttle } from "@herowcode/utils/function"
  
  const onScroll = throttle(update, 100, { trailing: false })
  ```
- 9ddf221: `/function` adds `tryCatchResult`, a discriminated `{ ok }` variant of `tryCatch`.
  
  ```ts
  import { tryCatchResult } from "@herowcode/utils/function"
  
  const r = await tryCatchResult(() => fetchUser(id))
  if (!r.ok) return report(r.error)
  r.data // User
  ```
- 9ddf221: New `/http` subpath (universal, Web `Request`/`Response`): `corsHeaders(request, { origin, methods, headers, credentials, maxAge })` returning `Headers`, `preflight` (204 for `OPTIONS`, else `null`), `jsonResponse`, `fetchWithTimeout(input, init, { timeoutMs })` and `fetchJson`, which throws `HttpError` subclasses by status and `HEROW_INVALID_JSON` for a non-JSON 2xx body. `origin` is required and never reflected unchecked; `credentials: true` with `"*"` throws `HEROW_CORS_CREDENTIALS_WILDCARD`.
  
  ```ts
  import { fetchJson, preflight } from "@herowcode/utils/http"
  
  const early = preflight(request, { origin: ["https://app.example.com"] })
  if (early) return early
  const user = await fetchJson<User>("/api/me", undefined, { timeoutMs: 5000 })
  ```
- 9ddf221: `/logger` adds `redactSecrets(text, { extraPatterns })` for free text (bearer tokens, JWTs, `key=value` secrets, common API-key prefixes) and `redactDeep(value, { keys, patterns, maxDepth })` for objects, both built on the logger's existing redaction core. Objects deeper than `maxDepth` (default 8) become `"[MaxDepth]"`.
  
  ```ts
  import { redactDeep, redactSecrets } from "@herowcode/utils/logger"
  
  redactSecrets("Authorization: Bearer abc.def") // "Authorization: [REDACTED]"
  redactDeep({ user: "ana", password: "x" }) // { user: "ana", password: "[REDACTED]" }
  ```
  
  The browser `/logger` entry grows by about 0.5 kB.
- 9ddf221: New `/number` subpath (universal): `formatCurrency` (BRL/pt-BR by default, `fromCents`, `stripZeroCents`, `compact`, `{ fallback }`), `formatNumber`, `formatPercent`, `percentOf`, `parseLocaleNumber` (returns `NaN` on garbage, `asCents`) and `toNumber`. Output comes from `Intl`, so pt-BR currency uses a non-breaking space after `R$`.
  
  ```ts
  import { formatCurrency, parseLocaleNumber } from "@herowcode/utils/number"
  
  formatCurrency(123450, { fromCents: true }) // "R$ 1.234,50"
  parseLocaleNumber("R$ 1.234,56") // 1234.56
  ```
- 9ddf221: New `/phone` subpath (universal) for BR and US numbers: `onlyDigits`, `normalizePhone` (E.164), `formatPhone`, `getBRMobileVariants` (with and without the 9th digit) and `buildWhatsAppLink`. Invalid numbers return the `fallback` option (`null` for `normalizePhone`, `""` for the formatters, `[]` for `getBRMobileVariants`).
  
  ```ts
  import { buildWhatsAppLink, normalizePhone } from "@herowcode/utils/phone"
  
  normalizePhone("(11) 99999-9999") // "+5511999999999"
  buildWhatsAppLink("11999999999", { message: "Olá!" })
  ```
- 9ddf221: `formatSecondsToHMS` accepts `{ alwaysShowHours, rounding }` and `formatSecondsToFragment` accepts `{ separator, rounding }`; the default output is unchanged.
  
  ```ts
  import { formatSecondsToFragment, formatSecondsToHMS } from "@herowcode/utils/string"
  
  formatSecondsToHMS(65, { alwaysShowHours: true }) // "00:01:05"
  formatSecondsToFragment(3723, { separator: " " }) // "1h 2m 3s"
  ```
- 9ddf221: `/string` adds `getInitials`, `escapeHtml`, `escapeRegExp` and `pluralize` (also exported from the package root). `docs/array.md` no longer lists `markdownToText`, which has always been exported from `/string`.
  
  ```ts
  import { getInitials, pluralize } from "@herowcode/utils/string"
  
  getInitials("Maria da Silva") // "MS"
  `${3} ${pluralize(3, "item")}` // "3 items"
  ```
- 9ddf221: `markdownToText` accepts `{ keepLinkUrls, singleLine }`; the default output is unchanged.
  
  ```ts
  import { markdownToText } from "@herowcode/utils/string"
  
  markdownToText("[docs](https://x.dev)", { keepLinkUrls: true }) // "docs (https://x.dev)"
  ```
- 9ddf221: `/string`: add `removeAccents(text)` and `normalizeText(text)` (lowercase, no accents or punctuation, collapsed whitespace). `slugify` now builds on them with identical output.
  
  ```ts
  import { normalizeText, removeAccents } from "@herowcode/utils/string"
  
  removeAccents("Crème Brûlée") // "Creme Brulee"
  normalizeText("  Olá,   Mundo! ") // "ola mundo"
  ```
- 9ddf221: `removeHtmlTags` accepts `{ decodeEntities, collapseWhitespace }`; the default output is unchanged.
  
  ```ts
  import { removeHtmlTags } from "@herowcode/utils/string"
  
  removeHtmlTags("<p>a &amp;  b</p>", { decodeEntities: true, collapseWhitespace: true }) // "a & b"
  ```
- 9ddf221: `slugify` accepts `{ separator, maxLength }`; the default output is unchanged.
  
  ```ts
  import { slugify } from "@herowcode/utils/string"
  
  slugify("Olá Mundo", { separator: "_" }) // "ola_mundo"
  slugify("hello brave world", { maxLength: 7 }) // "hello-b"
  ```
- 9ddf221: `truncate` accepts `{ suffix, wordBoundary }` as its third argument (a plain suffix string still works).
  
  ```ts
  import { truncate } from "@herowcode/utils/string"
  
  truncate("hello brave world", 14, { wordBoundary: true }) // "hello brave..."
  ```

### Patch Changes

- 9ddf221: Docs: new "Replacing a local copy" guide (English and pt-BR) mapping local helper patterns to imports, behavior differences and the bugs they fix, plus a generated A-Z helper index and an `http`/`api`/`async` comparison in the README. `pnpm test:exports` now fails when the index, the guide anchors or the `docs/errors.md` code sections drift.
- 9ddf221: `HttpError` now rejects an invalid `status` (anything but an integer from 100 to 599) with a `RangeError` coded `HEROW_HTTP_INVALID_STATUS` and ignores a negative or non-finite `retryAfterSeconds`. `redactSecrets` also masks passwords in connection URLs (`postgres://user:[REDACTED]@host`) and handles escaped quotes inside quoted values. `sleep` and `withTimeout` clamp delays to the 32-bit timer limit. `tryCatchResult` now types `error` as `unknown` by default.

## 2.1.0

### Minor Changes

- 6e70f1a: `/api`: `IApiError` gains an optional `name` with the thrown error's name when it is not a plain `Error`, so a timeout (`"TimeoutError"`) can be told apart from a caller abort (`"AbortError"`) without matching the legacy numeric `code` (`"23"`/`"20"`, unchanged). `DOMException`s are now recognised even where they don't extend `Error` (e.g. jsdom), instead of collapsing to the message `"{}"`.
- 6e70f1a: `/api`: add a client-level `redirect` option (`apiClient({ redirect: "error" })`) applied to every request; a per-request `redirect` still wins. The default stays `"follow"`.
- 6e70f1a: `/api`: retries honour `Retry-After` (seconds or HTTP date) and add jitter to the exponential backoff, which now waits between half and all of the previous delay. The `Retry-After` wait is capped by the new `retry.maxRetryAfter` (10 s by default).
- 6e70f1a: `/api`: export the `IRetryOptions` type. `retry.methods` and `retry.statusCodes` now accept readonly arrays, so shared `as const` configs type-check.
- 6e70f1a: `/api`: add an opt-in `timeout` (ms) per request or on `apiClient({ timeout })`. It covers `getAccessToken`, `getUserIP`, the network requests, retries and backoff waits, and combines with the caller's `signal`; `timeout: 0` opts a request out of the client default. Once aborted, the request stops waiting for `onSignoutUnauthorized` and still returns the 401. Backoff waits now stop as soon as the request is aborted.
- 6e70f1a: `/youtube`: `getYoutubeVideoInfo`, `getYoutubeVideoDuration`, `getYoutubeThumbnail` and `validateYoutubeLink` accept an opt-in `{ onError }` that receives each failure reason (`{ source, message, status?, cause? }`) instead of only returning `null`/`false`. Invalid URLs are reported with source `"validation"`, and every caller sharing an in-flight `getYoutubeVideoInfo` request gets its failures. The `IYouTubeErrorOptions`, `IYouTubeSourceError` and `TYouTubeErrorSource` types are exported.

### Patch Changes

- 6e70f1a: `/logger` (browser): production is now detected in bundled apps. The logger read `process.env?.NODE_ENV` behind a `typeof process` guard, which bundler `define` replacements never match, so browser builds always logged at debug level in dev format. It now reads the exact `process.env.NODE_ENV` expression.
  
  Upgrade note: in bundled production browser apps, every level (including `warn` and `error`) is now one JSON line through `console.log`, and `debug` is dropped. Error trackers that hook `console.error`/`console.warn` (e.g. Sentry's console integration) stop seeing these logs; forward them explicitly or set `level`/`localStorage.LOG_LEVEL` as needed.
- 6e70f1a: `/logger` (browser): `redact` entries now follow pino's path syntax (`user.ssn`, `headers["x-api-key"]`, `items[*].pan`, `*.card`) instead of being treated as literal key names that never matched. Plain keys still match at any depth. Secrets passed as `child()` bindings are now redacted too.
- 6e70f1a: `/youtube`: `getYoutubeVideoInfo` caches each result for 1 hour and keeps at most the 100 most recently used videos, instead of holding every video forever.

## 2.0.0

### Major Changes

- 80e2297: 2.0: packaging cleanup, dependency diet and bug fixes across every module. Breaking changes carry a migration step where callers need to act.
  
  ### Packaging and runtime
  
  - **Node.js 22.12+ required** (`engines.node: ">=22.12"`); output targets ES2022. Node 20 reached end of life on 2026-04-30. Migration: upgrade Node, or stay on 1.x.
  - **`/nextjs` removed** (`OptimizedImage`). Migration: use `next/image` directly or copy the 1.x component into your app.
  - **Root entry only re-exports `array`, `function` and `string`.** Migration: import from subpaths — `@herowcode/utils/api`, `/date`, `/files`, `/youtube` (`/logger` was already subpath-only).
  - **`axios`, `clsx` and `tailwind-merge` are no longer dependencies.** `/api` is fetch-based and never needed axios at runtime. Migration: if your code imported them transitively, add them to your own `package.json`.
  - **`pino` is now an optional peer dependency.** The Node logger throws a clear "install pino" error when it's missing. Migration: `npm install pino` if you use `@herowcode/utils/logger` on Node.
  
  ### `/api`
  
  - **Default retry:** GET and HEAD are retried on 408, 429, 500, 502, 503, 504 and network errors (was GET on 413 only). Migration: `retry: { methods: ["get"], statusCodes: [413] }` comes closest to 1.x (network errors on GET are still retried), and `retry: { limit: 1 }` disables retries entirely.
  - **`retry` options are merged with the defaults** instead of replacing them; `retry.limit` is capped at 10 and `retry.methods` is case-insensitive. Migration: set every field you rely on explicitly.
  - **`Authorization` and `X-User-IP` are only sent to the `baseURL` origin** (a relative `baseURL` resolves against the page; without `baseURL` the page origin is used, and in Node no credentials are sent). `onSignoutUnauthorized` only fires for 401s from that origin. Migration: set `baseURL`, or pass the header yourself in `headers` for cross-origin calls.
  - **A relative endpoint without `baseURL` throws** a clear error instead of requesting `"undefined/..."`. Absolute URLs are detected with `/^https?:\/\//i`, so `httpbin/get` is now relative. Migration: set `baseURL`, or pass a full `http(s)` URL.
  - **Invalid JSON in a 2xx response** yields an `Error` with status, URL and a body snippet (was a raw `SyntaxError`). Migration: read `error.status`/`error.message` instead of checking for `SyntaxError`.
  - **401 handling:** the sign-in path check uses only the URL pathname, and an error thrown by `onSignoutUnauthorized` no longer replaces the 401. Non-JSON error bodies now fill `message`/`details`; `null` fields no longer become the string `"null"`.
  - Axios errors are still recognized, via `isAxiosError === true`.
  - New type exports: `ICustomRequestInit`, `TApiClientProps`.
  
  ### `/logger`
  
  - An inherited name such as `LOG_LEVEL=toString` is ignored. In the pino logger, an invalid `LOG_LEVEL` falls back to the default level instead of throwing. Migration: use one of `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` (lowercase).
  - Context and bindings can no longer overwrite `time`, `level`, `service`, `env` or `msg` (Node and browser loggers; on Node those keys are dropped from context). Migration: rename colliding context keys.
  - Browser logger redaction keeps the content of `Date` (ISO string), `Error`, `Map`, `Set` and `URL` values instead of logging `{}`, and prints circular references as `"[Circular]"`.
  
  ### `/date`
  
  - **`formatDate`:** dayjs tokens such as `"MM"`, `"DD"`, `"MMM"` and `"DD-MM"` are treated as formats, not locales, and `Intl.Locale` instances are honored. Migration: to pass a locale whose name equals a token, use `{ locale }`.
  - **`parseTimeSpent`** throws `RangeError` for invalid dates (was NaN fields), and matches locales by language prefix (`"en"` → en-US, was pt-BR). Migration: validate inputs or wrap the call in `try/catch`.
  - The `dayjs().formatIntl()` / `toIntlFormatter()` type augmentation now ships in the published `.d.ts`.
  
  ### `/string`
  
  - **`camelCase`, `kebabCase`, `snakeCase`** transliterate accents (`"João Pessoa"` → `joao-pessoa`, was `joo-pessoa`) and keep existing camelCase boundaries (`camelCase("helloWorld")` → `helloWorld`). Migration: regenerate stored keys/slugs built from accented input.
  - **`formatStringToTime`** keeps leading zeros (`"000123"` → `00:01:23`, was `01:23`).
  - **`truncate`** never returns more than `length` characters and throws for non-finite lengths. Migration: don't pass `Infinity` to mean "no limit"; check the length yourself.
  - **`formatSecondsToHMS` / `formatSecondsToFragment`** return `"00:00"` / `"0s"` for `NaN`/`Infinity`.
  - **`markdownToText`** keeps intraword underscores (`my_variable_name`); **`removeHtmlTags`** no longer strips prose like `a < b and c > d`, runs in linear time, and never leaves a tag reassembled from nested `<` (it is a text stripper, not an HTML sanitizer).
  
  ### `/files`
  
  - **Runtime fallbacks throw instead of silently doing nothing:** `fileExists`/`fileDelete` in the browser, and `downloadUrl`/`compressImage` in Node. Migration: guard calls by runtime, or catch the error.
  - **`fileDelete`** uses `fs.rm(path, { force: true })` and rejects on errors other than ENOENT (was logged and swallowed). Migration: wrap cleanups that must never fail in `try/catch`.
  - **`compressImage`** rejects (instead of throwing synchronously) for unsupported types, rejects on decode/read errors instead of hanging, respects both max bounds and never upscales. Migration: `await` the call (or attach `.catch`) instead of a synchronous `try/catch`.
  - **`downloadUrl`** returns `false` for non-2xx responses (was `true`, with the error page saved as the file) and revokes its object URL shortly after the download starts. Migration: treat `false` as "not downloaded" for HTTP errors too.
  
  ### `/youtube`
  
  - **`extractYouTubeId`** accepts only `youtube.com`, `youtube-nocookie.com`, `youtu.be` and their subdomains, plus 11-character IDs. Lookalike hosts, bad IDs and paths other than `?v=`, `/embed/`, `/shorts/`, `/live/`, `/v/`, `/e/` and `youtu.be/` (e.g. `/channel/...`, `/embed/videoseries`) return `null`. Migration: use real 11-character IDs in fixtures; every youtube helper goes through this function.
  - **`getYoutubeVideoDuration` / `getYoutubeThumbnail` in Node** reject with a "not supported" error (was `null`). Migration: call them in the browser only, or catch the rejection.
  - **`getYoutubeThumbnail` / `validateYoutubeLink`** treat YouTube's 120px placeholder as missing; oEmbed 401 (embedding disabled) counts as valid.
  - **`getYoutubeVideoInfo`** aborts each request after 8 s and returns a fresh copy per call.
  - The IFrame API loader no longer hangs when the script is blocked, and it chains any existing `onYouTubeIframeAPIReady` handler.
  - New type export: `TCreateYoutubeLinkOptions`.
