# Replacing a local copy

Found a home-made helper in your code? Find its pattern below, swap the import, and check the **behavior differences** column before you run your tests. Every row links to the helper's section, which has the details and an "Invalid input returns" line. To find a helper by name, see the [A-Z index](../README.md#find-a-helper-a-z).

## Known traps

- **`formatCurrency` uses a non-breaking space (U+00A0) after `R$`.** Snapshots with a typed space fail; compare against `Intl.NumberFormat` output.
- **`retry` retries transient errors only** (connection failures and 408/429/500/502/503/504). A 400 is thrown at once; pass `shouldRetry: () => true` for the old retry-everything behavior.
- **`requireEnv` and `optionalEnv` in Workers or Deno have no `process`.** Pass the bindings as `{ env }`, or they throw `HEROW_ENV_NO_SOURCE`.
- **Date helpers need an explicit `timeZone` on servers.** Servers usually run in UTC, so the default gives the UTC day, the same bug as `toISOString().slice(0, 10)`.
- **`safeEqual` is synchronous; `verifyHmacSignature`, `sha256Hex`, `hmacSha256Hex` and `generateOpaqueToken` return Promises.** An un-awaited `verifyHmacSignature` is always truthy.
- **`toCSV` neutralizes spreadsheet formulas.** A text cell starting with `=`, `+`, `-` or `@` gets a leading `'`; pass numbers, or set `neutralizeFormulas: false` for trusted data.
- **`decodeJWT` does not verify signatures.** Use the `auth` helpers for UX decisions only.
- **Units are in the name:** `timeoutMs`, `baseMs`, `maxMs`, `marginSeconds`, `retryAfterSeconds`. `getJWTExp` returns seconds.
- **Errors use `status`, not `statusCode`,** and library errors carry a `HEROW_*` code documented in [errors.md](errors.md#error-codes).
- **Invalid input never throws on the pure helpers.** It returns the `fallback` option or the value named in the "Invalid input returns" line. `tryCatch` and `tryCatchResult` have different result shapes (see [function.md](function.md#which-result-shape-to-use)).

## `/api`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `{ totalPages: Math.ceil(total / limit), hasNext: page * limit < total }` | `{ buildPageMeta }` from `@herowcode/utils/api` | `page` and `pageSize` below 1 or not numbers become `1`; an invalid `total` becomes `0`; `total: 0` gives `totalPages: 0`. | `NaN` and `Infinity` pages from a missing query param. | [api.md](api.md#buildpagemeta-page-pagesize-total-) |
| `(page - 1) * limit` | `{ getOffset }` from `@herowcode/utils/api` | Returns `0` for `page` below 1, `NaN` or `Infinity`; fractions are floored. | Negative `OFFSET` errors from `?page=0`. | [api.md](api.md#getoffsetpage-pagesize) |

## `/array`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `for (i = 0; i < n; i += size) out.push(a.slice(i, i + size))`, or a `splice` loop | `{ chunk }` from `@herowcode/utils/array` | `size` below 1 or not a number returns `[]`; the input is not mutated. | Infinite loop with `size = 0`; the `splice` variant emptied the caller's array. | [array.md](array.md#chunkarray-size) |
| `reduce` pushing into `acc[key]`, or `Object.groupBy` | `{ groupBy }` from `@herowcode/utils/array` | Plain object; order kept inside groups; the callback also receives the index. | A `"__proto__"` key polluting the accumulator. | [array.md](array.md#groupbyarray-fn) |
| `Object.fromEntries(list.map((x) => [x.id, x]))` | `{ keyBy }` from `@herowcode/utils/array` | On duplicate keys the last item wins; the callback also receives the index. | Lookup tables built with prototype-key surprises. | [array.md](array.md#keybyarray-fn) |
| `items.reduce((sum, x) => sum + x.price, 0)` | `{ sumBy }` from `@herowcode/utils/array` | Results that are not finite numbers are skipped; an empty array gives `0`. | One `undefined` price turning the whole total into `NaN`. | [array.md](array.md#sumbyarray-fn) |

## `/async`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `new Promise((r) => setTimeout(r, ms))` (`sleep`, `delay`, `wait`) | `{ sleep }` from `@herowcode/utils/async` | Optional `signal`: aborting rejects with `signal.reason` and clears the timer. | Timers that outlive a cancelled request or unmounted component. | [async.md](async.md#sleepms-signal) |
| `Promise.race([work, timeoutPromise])` or `setTimeout(() => controller.abort(), ms)` | `{ withTimeout }` from `@herowcode/utils/async` | Returns an `AbortSignal` (`withTimeout(signal, timeoutMs)`) that also follows your own signal; the reason is a `TimeoutError`. `0`, negative or missing means no timeout. | Leaked timers and requests that keep running after the race is lost. | [async.md](async.md#withtimeoutsignal-timeoutms) |
| `2 ** attempt * 1000`, `Math.min(...)` without jitter | `{ backoffDelay }` from `@herowcode/utils/async` | Equal jitter between half and the full delay; `baseMs` 100 and `maxMs` 3000 by default. | Clients retrying in lockstep and waiting without bound. | [async.md](async.md#backoffdelayattempt-options) |
| `Number(res.headers.get('retry-after')) * 1000` | `{ parseRetryAfterMs }` from `@herowcode/utils/async` | Understands delta-seconds and HTTP dates, returns milliseconds (`parseRetryAfterMs`); past dates give `0`, garbage gives `undefined`. | `NaN` waits from the date form of the header. | [async.md](async.md#parseretryaftermsvalue-now) |
| A `for` loop with `try/catch` and `sleep`, retrying every error | `{ retry }` from `@herowcode/utils/async` | **Transient errors only** (connection failures, 408/429/500/502/503/504): a 400 or a bug is thrown at once. Pass `shouldRetry: () => true` for the old behavior. `AbortError` is never retried; `Retry-After` replaces the backoff. | Hammering an endpoint that answered 400/401/404 three more times. | [async.md](async.md#retryfn-options) |
| `for` loop awaiting `Promise.all(items.slice(i, i + n).map(fn))` | `{ mapInChunks }` from `@herowcode/utils/async` | Chunk after chunk (not a sliding window); results keep input order; the first rejection rejects the call. | Unbounded `Promise.all` over thousands of items. | [async.md](async.md#mapinchunksitems-chunksize-fn) |
| `p-limit`-style wrapper or a manual in-flight counter | `{ createConcurrencyLimiter }` from `@herowcode/utils/async` | FIFO queue; a rejected or throwing task frees its slot; a `limit` below 1 is treated as 1. | A failed task leaking a slot and stalling the queue. | [async.md](async.md#createconcurrencylimiterlimit) |
| `let inflight: Promise<T> \| null` guard around a token refresh | `{ createSingleFlight }` from `@herowcode/utils/async` | Slot cleared as soon as the run settles, before waiters resume; a rejection reaches every waiter and is not cached. Joiners ignore their own arguments. | A failed refresh staying cached forever, or ten refreshes fired by ten parallel 401s. | [async.md](async.md#createsingleflightfn) |

## `/auth`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `JSON.parse(atob(token.split('.')[1]))` | `{ decodeJWT }` from `@herowcode/utils/auth` | **Does not verify the signature.** Handles base64url and UTF-8; returns `null` instead of throwing. | Crashes on `-`/`_` characters and accented names; never use it to authorize. | [auth.md](auth.md#decodejwttoken) |
| `payload.exp * 1000 < Date.now()` | `{ getJWTExp, isJWTExpired }` from `@herowcode/utils/auth` | `getJWTExp` returns **seconds**; `isJWTExpired` fails closed (`true`) for malformed tokens or a missing `exp`. | A token without `exp` counting as valid forever. | [auth.md](auth.md#getjwtexptoken) |
| `isTokenExpiring(token, thresholdSeconds)` with a hand-computed margin | `{ isJWTExpiring }` from `@herowcode/utils/auth` | `{ marginSeconds }` (default 30); expired tokens count as expiring; fails closed. | Seconds treated as minutes (or milliseconds) in the margin. | [auth.md](auth.md#isjwtexpiringtoken-options) |
| `header.replace('Bearer ', '')` or `header.split(' ')[1]` | `{ extractBearerToken }` from `@herowcode/utils/auth` | Scheme is case-insensitive; only a single `Bearer <token>` pair passes; otherwise `null`. | `Basic abc` or a missing header being used as a token. | [auth.md](auth.md#extractbearertokenheader) |

## `/br`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `value.replace(/(\d{5})(\d{3})/, '$1-$2')` | `{ formatCEP }` from `@herowcode/utils/br` | Exactly 8 digits or `fallback` (`""`); no partial masks. | Half-formatted `1234` shown in forms. | [br.md](br.md#formatcepvalue-options) |
| A mask regex plus a check-digit function | `{ formatCPF, isValidCPF }` from `@herowcode/utils/br` | `formatCPF` never validates (`111.111.111-11` formats); `isValidCPF` checks digits and rejects repeated digits. Pass strings, not numbers. | `000.000.000-00` passing validation; leading zeros lost in numbers. | [br.md](br.md#formatcpfvalue-options) |
| 14-digit mask and validator | `{ formatCNPJ, isValidCNPJ }` from `@herowcode/utils/br` | Accepts the alphanumeric CNPJ (letters uppercased); the last two characters must be digits. | Rejecting valid alphanumeric CNPJs issued from July 2026. | [br.md](br.md#formatcnpjvalue-options) |

## `/crypto`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `createHash('sha256').update(s).digest('hex')` | `{ sha256Hex }` from `@herowcode/utils/crypto` | WebCrypto, so it returns a Promise: add `await`. Input is hashed as UTF-8. | `node:crypto` and `Buffer` breaking on edge runtimes and browsers. | [crypto.md](crypto.md#sha256hexdata) |
| `createHmac('sha256', key).update(data).digest('hex')` | `{ hmacSha256Hex }` from `@herowcode/utils/crypto` | Async (WebCrypto); argument order is `(key, data)`; lowercase hex. | Same edge-runtime break; swapped key and data arguments. | [crypto.md](crypto.md#hmacsha256hexkey-data) |
| `a === b` on secrets, or `timingSafeEqual` wrapped in a length check | `{ safeEqual }` from `@herowcode/utils/crypto` | **Synchronous** (returns a boolean), unlike `verifyHmacSignature`; different lengths return `false` instead of throwing; non-strings return `false`. | Timing leaks and `RangeError` on mismatched lengths. | [crypto.md](crypto.md#safeequala-b) |
| Compare `hmac(body) === header` after stripping a prefix | `{ verifyHmacSignature }` from `@herowcode/utils/crypto` | **Returns a Promise: always `await`** (an un-awaited call is truthy and accepts everything). Takes `{ encoding, prefix }`, accepts uppercase hex and base64url, compares in constant time, returns `false` instead of throwing. | Webhooks accepted by `if (verify(...))` without `await`; timing leaks; a re-serialized body. | [crypto.md](crypto.md#verifyhmacsignaturepayload-signature-secret-options) |
| `Math.random().toString(36)`, `uuid` as a secret | `{ generateOpaqueToken }` from `@herowcode/utils/crypto` | Returns `{ token, hash }` (Promise); `bytes` default 32, base64url without padding; store the hash. | Predictable tokens and plain tokens stored in the database. | [crypto.md](crypto.md#generateopaquetokenbytes--32) |

## `/date`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `date.toISOString().slice(0, 10)` | `{ toISODate }` from `@herowcode/utils/date` | Uses a calendar `timeZone` (**pass it explicitly on servers**, which default to UTC); a bare `YYYY-MM-DD` string is returned as is; `fallback` for invalid dates. | Tomorrow's date after 21:00 in Brazil (the slice gives the UTC day). | [date.md](date.md#toisodatedate-options) |
| `new Date().toISOString().slice(0, 10)` | `{ getTodayISODate }` from `@herowcode/utils/date` | `getTodayISODate({ timeZone })`; `now` is injectable for tests. Without `timeZone` it uses the runtime zone, which is UTC on most servers. | "Today" flipping to tomorrow in the evening. | [date.md](date.md#gettodayisodateoptions) |
| `d.setDate(d.getDate() + n)`, `Math.round((a - b) / 86400000)` | `{ addDaysISO, diffDaysISO }` from `@herowcode/utils/date` | Calendar math on the Y/M/D parts: DST cannot shift the result. Invalid input returns `fallback` (`""` and `NaN`). | Off-by-one days around DST changes and `Invalid Date` strings. | [date.md](date.md#adddaysisoisodate-days-options) |
| `new Date('2026-01-01')` | `{ parseISODateLocal }` from `@herowcode/utils/date` | Local midnight instead of UTC midnight; `fallback` (`null`) for malformed or nonexistent days. | A date-only value showing the previous day west of UTC. | [date.md](date.md#parseisodatelocalisodate-options) |
| `date.getHours()` and `toLocaleString` parsing | `{ getZonedHour, getDatePartsInTimeZone }` from `@herowcode/utils/date` | Reads the hour/parts in an explicit `timeZone` (midnight is `0`, never `24`); **pass `timeZone` on servers**; an unknown zone throws `RangeError`. | Business-hours checks that run in UTC on the server. | [date.md](date.md#getzonedhourdate-options) |

## `/env`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `process.env.X!` or `if (!process.env.X) throw new Error('Missing X')` | `{ requireEnv }` from `@herowcode/utils/env` | Whitespace-only counts as missing; `minLength`; **on Workers there is no `process`: pass `{ env }`** or it throws `HEROW_ENV_NO_SOURCE`. Errors have a code and never include the value. | `undefined` leaking in as a string, and non-actionable "Missing X" errors. | [env.md](env.md#requireenvname-options) |
| `process.env.X ?? 'default'` | `{ optionalEnv }` from `@herowcode/utils/env` | Empty and whitespace-only values use the fallback too; same `{ env }` rule on Workers. | `X=` in `.env` overriding the default with an empty string. | [env.md](env.md#optionalenvname-fallback-options) |
| `process.env.X === 'true'` or `Boolean(process.env.X)` | `{ parseBoolean }` from `@herowcode/utils/env` | Accepts `true/1/yes/y/on` and `false/0/no/n/off/""`, case-insensitive; anything else throws unless you pass a `fallback`. | `"1"` or `"TRUE"` read as false; `"false"` read as true. | [env.md](env.md#parsebooleanvalue-fallback) |

## `/errors`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `err instanceof Error ? err.message : String(err)` | `{ getErrorMessage }` from `@herowcode/utils/errors` | Reads `message`, `error`, `detail` (configurable `keys`); `{ fallback }` instead of `"[object Object]"`. | `[object Object]` shown to users. | [errors.md](errors.md#geterrormessageerr-options) |
| `err.status ?? err.response?.status` | `{ getErrorStatus }` from `@herowcode/utils/errors` | Reads `status`, `statusCode`, `response.status`, also along the cause chain; `undefined` when none. | Statuses lost behind a wrapped `cause`. | [errors.md](errors.md#geterrorstatuserr) |
| `while (e.cause) e = e.cause` | `{ getRootCause }` from `@herowcode/utils/errors` | Stops at 10 links and at cycles; returns the input when there is no cause. | Infinite loop on a cyclic cause chain. | [errors.md](errors.md#getrootcauseerr) |
| `class HttpError extends Error { statusCode }` | `{ HttpError, NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError, ConflictError, TooManyRequestsError, isHttpError }` from `@herowcode/utils/errors` | The field is **`status`**, not `statusCode`; `isHttpError` and `instanceof` work across the CJS/ESM copies of the package; `TooManyRequestsError` carries `retryAfterSeconds`. | `instanceof` failing across bundles; two incompatible error classes. | [errors.md](errors.md#httperror-and-subclasses) |
| `err.code === 'ECONNRESET' \|\| err instanceof TypeError` | `{ isTransientNetworkError }` from `@herowcode/utils/errors` | Looks through `cause` (Node's `fetch failed`); other `TypeError`s (invalid URL) are not transient; timeouts only with `{ includeTimeouts: true }`. | Retrying programming errors, or missing the real code under `cause`. | [errors.md](errors.md#istransientnetworkerrorerr-options) |
| `status >= 500` or a hand-typed status list | `{ isTransientStatus, TRANSIENT_STATUS_CODES }` from `@herowcode/utils/errors` | Exactly `408, 429, 500, 502, 503, 504`, shared with `retry` and `apiClient`. | Retrying 501/505 or giving up on 408/429. | [errors.md](errors.md#istransientstatusstatus-and-transient_status_codes) |

## `/files`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `navigator.clipboard.writeText(text)` in a `try` | `{ copyToClipboard }` from `@herowcode/utils/files` | Falls back to `execCommand('copy')`; resolves a boolean and never throws. Call from a user gesture. | Clipboard failing silently on HTTP pages and iframes. | [files.md](files.md#copytoclipboardtext) |
| `createObjectURL` + `<a download>` + `click()` + `revokeObjectURL` | `{ downloadBlob }` from `@herowcode/utils/files` | Removes the link at once and revokes the URL about a second later; returns a boolean. | Downloads cancelled by an immediate `revokeObjectURL` in Safari and Firefox. | [files.md](files.md#downloadblobblob-filename) |
| `try { localStorage.getItem(k) } catch {}` wrappers | `{ safeStorage }` from `@herowcode/utils/files` | Falls back to memory in SSR, private mode and quota errors; `set` returns `false` when only memory kept it; `getJSON(key, { fallback })`. | `SecurityError` and `QuotaExceededError` crashing render. | [files.md](files.md#safestoragekind) |
| `rows.map((r) => r.join(',')).join('\n')` | `{ toCSV }` from `@herowcode/utils/files` | RFC 4180 quoting, `CRLF` line endings, optional `bom`, `delimiter`; **formula neutralization**: cells starting with `=`, `+`, `-`, `@` get a leading `'` (disable with `neutralizeFormulas: false`). | Broken columns on commas and quotes; `=HYPERLINK(...)` injection. | [files.md](files.md#tocsvrows-options) |

## `/function`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `typeof window !== 'undefined'` | `{ isBrowser, isServer }` from `@herowcode/utils/function` | Function calls (`isBrowser()`), true only with both `window` and `document`. | React Native (which defines `window`) counted as a browser. | [function.md](function.md#isbrowser--isserver) |
| `try { return JSON.parse(x) } catch { return fallback }` | `{ safeJsonParse }` from `@herowcode/utils/function` | `{ fallback }` option; valid `false`, `0` and `null` are returned as parsed. | A valid `0` or `false` replaced by the default. | [function.md](function.md#safejsonparsetext-options) |
| `Result<T>` helpers shaped `{ ok, data } \| { ok, error }` or `[err, data]` tuples | `{ tryCatchResult }` from `@herowcode/utils/function` | Discriminated on `ok`, no default-data argument; see "Which result shape to use" in the function docs (`tryCatch` is `{ data, error }`). | `data` being `null` hiding whether the call failed. | [function.md](function.md#trycatchresultfn) |

## `/http`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `headers.set('Access-Control-Allow-Origin', req.headers.get('origin') ?? '*')` | `{ corsHeaders }` from `@herowcode/utils/http` | Only echoes origins you list (exact match) and adds `Vary: Origin`; `credentials: true` with `origin: '*'` throws `HEROW_CORS_CREDENTIALS_WILDCARD`. | Any site reading credentialed responses. | [http.md](http.md#corsheadersrequest-options) |
| `if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers })` | `{ preflight }` from `@herowcode/utils/http` | Returns a `204` for `OPTIONS` and `null` otherwise; echoes the requested headers when `headers` is unset. | Preflights failing on custom headers. | [http.md](http.md#preflightrequest-options) |
| `new Response(JSON.stringify(x), { headers })` | `{ jsonResponse }` from `@herowcode/utils/http` | Sets `Content-Type: application/json` (yours wins); `undefined` is sent as `null`; `204/205/304` get no body. | `TypeError` from a body on a 204; missing content type. | [http.md](http.md#jsonresponsedata-init) |
| `fetch` + `AbortController` + `setTimeout` | `{ fetchWithTimeout }` from `@herowcode/utils/http` | `{ timeoutMs }` third argument; aborts with a `TimeoutError`; your own `signal` still works. | Hung requests and timers left running. | [http.md](http.md#fetchwithtimeoutinput-init--timeoutms-) |
| `const res = await fetch(url); return res.json()` | `{ fetchJson }` from `@herowcode/utils/http` | Throws `HttpError` subclasses on non-2xx (`status`, `code`, `details`), `HEROW_INVALID_JSON` on a 2xx that is not JSON, no retries; resolves `undefined` for empty bodies. Use `apiClient` for `{ data, error }`. | Opaque `SyntaxError` on an HTML error page; lost status codes. | [http.md](http.md#fetchjsontinput-init--timeoutms-) |

## `/logger`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `.replace(/Bearer .../)` chains in error reporters | `{ redactSecrets }` from `@herowcode/utils/logger` | Also masks JWTs, `key=value` pairs, `Cookie:` lines and common API-key prefixes; linear time; `extraPatterns` for your own. | Tokens leaking in error messages and URLs. | [logger.md](logger.md#redaction-helpers-redactsecrets-and-redactdeep) |
| A recursive "mask these keys" helper | `{ redactDeep }` from `@herowcode/utils/logger` | Copy, never mutates; handles arrays, cycles (`[Circular]`), `Error`s, `maxDepth`; scrubs strings too. | Secrets inside arrays or message strings, and stack overflows on cycles. | [logger.md](logger.md#redaction-helpers-redactsecrets-and-redactdeep) |

## `/number`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `formatBRL(value)` built on `toLocaleString` or string concatenation | `{ formatCurrency }` from `@herowcode/utils/number` | **The space after `R$` is a non-breaking space (U+00A0)**, so snapshots with a typed space fail; `fromCents` replaces `value / 100`; invalid input gives `fallback`. | `R$ NaN` and float cents shown to users. | [number.md](number.md#formatcurrencyvalue-options) |
| `n.toLocaleString('pt-BR', ...)` | `{ formatNumber }` from `@herowcode/utils/number` | pt-BR default, `decimals`, `compact`, and `fallback`. | `NaN` printed in the UI. | [number.md](number.md#formatnumbervalue-options) |
| `` `${n.toFixed(1)}%` `` or `style: 'percent'` with `/ 100` | `{ formatPercent }` from `@herowcode/utils/number` | Input is already in percent units (`25` is 25%), matching `percentOf`. | Percentages off by a factor of 100. | [number.md](number.md#formatpercentvalue-options) |
| `(part / total) * 100` | `{ percentOf }` from `@herowcode/utils/number` | `total` of `0` or a non-finite input returns `fallback` (default `0`); optional `decimals`. | `NaN` and `Infinity` on an empty total. | [number.md](number.md#percentofpart-total-options) |
| `parseFloat(s.replace('.', '').replace(',', '.'))` | `{ parseLocaleNumber }` from `@herowcode/utils/number` | Locale decides separators (pt-BR default; `"0.5"` is rejected there); accepts currency symbols, NBSP, `%` and parenthesized negatives; returns `NaN`, never throws; `asCents`. | `"12abc"` parsed as 12 and only the first group dot removed. | [number.md](number.md#parselocalenumbertext-options) |
| `Number(x) \|\| 0`, `parseInt(x, 10) \|\| 0` | `{ toNumber }` from `@herowcode/utils/number` | Never `NaN` or `Infinity`; `""` uses the fallback; `"1,5"` is not parsed; `{ fallback, integer }`. | `\|\| 0` swallowing a legitimate fallback choice; `""` becoming `0`. | [number.md](number.md#tonumbervalue-options) |

## `/phone`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `value.replace(/\D/g, '')` | `{ onlyDigits }` from `@herowcode/utils/phone` | `null`, `undefined` and non-numbers give `""`; finite numbers are stringified. | `TypeError` on a missing phone. | [phone.md](phone.md#onlydigitsvalue) |
| Strip non-digits and prepend `55` | `{ normalizePhone }` from `@herowcode/utils/phone` | Checks the shape (area code, 8 or 9 digits), handles `+55`, `0055`, the trunk zero, and `US`; returns E.164 or `fallback` (`null`). | `5555...` doubled country codes and any length accepted. | [phone.md](phone.md#normalizephoneinput-options) |
| Mask regexes assuming 11 digits | `{ formatPhone }` from `@herowcode/utils/phone` | Normalizes first, picks the 8 or 9 digit layout, optional `international`; `fallback` (`""`) otherwise. | Half-formatted landlines and numbers that carry the country code. | [phone.md](phone.md#formatphoneinput-options) |
| Manual `slice` logic adding or removing the 9th digit | `{ getBRMobileVariants }` from `@herowcode/utils/phone` | Returns both E.164 spellings (with the 9 first); landlines return one entry; invalid input returns `[]`. | Contacts missed because they are stored without the 9th digit. | [phone.md](phone.md#getbrmobilevariantsinput) |
| `` `https://wa.me/${phone}?text=${msg}` `` | `{ buildWhatsAppLink }` from `@herowcode/utils/phone` | Normalizes to digits only (no `+`), URL-encodes the message, `fallback` (`""`) for invalid numbers. | Unencoded messages and links `wa.me` rejects. | [phone.md](phone.md#buildwhatsapplinkphone-options) |

## `/string`

| Local pattern | Import | Behavior differences | Bug it fixes | Docs |
|---|---|---|---|---|
| `.replace(/&/g, '&amp;').replace(/</g, '&lt;')...` chains | `{ escapeHtml }` from `@herowcode/utils/string` | Escapes all five characters (`& < > " '`) in one pass; it escapes text, it does not sanitize HTML. | Double-escaped `&` and broken single-quoted attributes. | [string.md](string.md#escapehtmltext) |
| `s.replace(/[.*+?^${}()\|[\]\\]/g, '\\$&')` | `{ escapeRegExp }` from `@herowcode/utils/string` | Same escaping as the MDN snippet; non-strings give `""`. | User input read as regex syntax. | [string.md](string.md#escaperegexptext) |
| `name.split(' ').map((w) => w[0]).slice(0, 2).join('')` | `{ getInitials }` from `@herowcode/utils/string` | First and last word (`Maria da Silva` is `MS`), `{ max, fallback }`. | `MD` for `Maria da Silva`, and crashes on empty names. | [string.md](string.md#getinitialsname-options) |
| `s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` | `{ normalizeText, removeAccents }` from `@herowcode/utils/string` | `removeAccents` keeps case and punctuation; `normalizeText` also lowercases, drops punctuation and collapses spaces (non-Latin letters such as CJK are dropped). | Accent-sensitive search and comparisons. | [string.md](string.md#normalizetexttext) |
| `` `${n} item${n === 1 ? '' : 's'}` `` | `{ pluralize }` from `@herowcode/utils/string` | Returns the word only (`n` is 1 or -1 for singular); custom plural as third argument; English-style rules. | "1 items" and ad-hoc ternaries everywhere. | [string.md](string.md#pluralizecount-singular-plural) |

---

[← Back to README](../README.md)
