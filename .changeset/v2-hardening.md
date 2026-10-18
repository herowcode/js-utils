---
"@herowcode/utils": major
---

2.0: packaging cleanup, dependency diet and bug fixes across every module. Each breaking change below has its migration step.

### Packaging and runtime

- **Node.js 22.12+ required** (`engines.node: ">=22.12"`); output targets ES2022. Node 20 reached end of life on 2026-04-30. Migration: upgrade Node, or stay on 1.x.
- **`/nextjs` removed** (`OptimizedImage`). Migration: use `next/image` directly or copy the 1.x component into your app.
- **Root entry only re-exports `array`, `function` and `string`.** Migration: import from subpaths — `@herowcode/utils/api`, `/date`, `/files`, `/youtube` (`/logger` was already subpath-only).
- **`axios`, `clsx` and `tailwind-merge` are no longer dependencies.** `/api` is fetch-based and never needed axios at runtime. Migration: if your code imported them transitively, add them to your own `package.json`.
- **`pino` is now an optional peer dependency.** The Node logger throws a clear "install pino" error when it's missing. Migration: `npm install pino` if you use `@herowcode/utils/logger` on Node.

### `/api`

- **Default retry:** GET and HEAD are retried on 408, 429, 500, 502, 503, 504 and network errors (was GET on 413 only). Migration: pass `retry: { statusCodes: [413] }` to restore the old trigger, or `retry: { limit: 1 }` to disable retries.
- **`retry` options are merged with the defaults** instead of replacing them; `retry.limit` is capped at 10 and `retry.methods` is case-insensitive. Migration: set every field you rely on explicitly.
- **`Authorization` and `X-User-IP` are only sent to the `baseURL` origin.** Migration: pass the header yourself in `headers` for cross-origin calls.
- **A relative endpoint without `baseURL` throws** a clear error instead of requesting `"undefined/..."`. Absolute URLs are detected with `/^https?:\/\//i`, so `httpbin/get` is now relative. Migration: set `baseURL`, or pass a full `http(s)` URL.
- **Invalid JSON in a 2xx response** yields an `Error` with status, URL and a body snippet (was a raw `SyntaxError`). Migration: read `error.status`/`error.message` instead of checking for `SyntaxError`.
- **401 handling:** the sign-in path check uses only the URL pathname, and an error thrown by `onSignoutUnauthorized` no longer replaces the 401. Non-JSON error bodies now fill `message`/`details`; `null` fields no longer become the string `"null"`.
- Axios errors are still recognized, via `isAxiosError === true`.

### `/logger`

- An inherited name such as `LOG_LEVEL=toString` is ignored. In the pino logger, an invalid `LOG_LEVEL` falls back to the default level instead of throwing.
- Context and bindings can no longer overwrite `time`, `level`, `service`, `env` or `msg`. Migration: rename colliding context keys.
- Redaction keeps the content of `Date` (ISO string), `Error`, `Map`, `Set` and `URL` values instead of logging `{}`, and prints circular references as `"[Circular]"`.

### `/date`

- **`formatDate`:** dayjs tokens such as `"MM"`, `"DD"` and `"MMM"` are treated as formats, not locales, and `Intl.Locale` instances are honored. Migration: to pass a locale whose name equals a token, use `{ locale }`.
- **`parseTimeSpent`** throws `RangeError` for invalid dates (was NaN fields), and matches locales by language prefix (`"en"` → en-US, was pt-BR). Migration: validate inputs or wrap the call in `try/catch`.
- The `dayjs().formatIntl()` / `toIntlFormatter()` type augmentation now ships in the published `.d.ts`.

### `/string`

- **`camelCase`, `kebabCase`, `snakeCase`** transliterate accents (`"João Pessoa"` → `joao-pessoa`, was `joo-pessoa`) and keep existing camelCase boundaries (`camelCase("helloWorld")` → `helloWorld`). Migration: regenerate stored keys/slugs built from accented input.
- **`formatStringToTime`** keeps leading zeros (`"000123"` → `00:01:23`, was `01:23`).
- **`truncate`** never returns more than `length` characters and throws for non-finite lengths. Migration: don't pass `Infinity` to mean "no limit"; check the length yourself.
- **`formatSecondsToHMS` / `formatSecondsToFragment`** return `"00:00"` / `"0s"` for `NaN`/`Infinity`.
- **`markdownToText`** keeps intraword underscores (`my_variable_name`); **`removeHtmlTags`** no longer strips prose like `a < b and c > d` and runs in linear time.

### `/files`

- **Runtime fallbacks throw instead of silently doing nothing:** `fileExists`/`fileDelete` in the browser, and `downloadUrl`/`compressImage` in Node. Migration: guard calls by runtime, or catch the error.
- **`fileDelete`** uses `fs.rm(path, { force: true })` and rejects on errors other than ENOENT (was logged and swallowed). Migration: wrap cleanups that must never fail in `try/catch`.
- **`compressImage`** rejects (instead of throwing synchronously) for unsupported types, rejects on decode/read errors instead of hanging, respects both max bounds and never upscales.
- **`downloadUrl`** returns `false` for non-2xx responses (was `true`, with the error page saved as the file) and revokes its object URL.

### `/youtube`

- **`extractYouTubeId`** accepts only `youtube.com`, `youtube-nocookie.com`, `youtu.be` and their subdomains, plus 11-character IDs. Lookalike hosts, bad IDs and path segments such as `watch` return `null`. Migration: use real 11-character IDs in fixtures; every youtube helper goes through this function.
- **`getYoutubeVideoDuration` / `getYoutubeThumbnail` in Node** reject with a "not supported" error (was `null`).
- **`getYoutubeThumbnail` / `validateYoutubeLink`** treat YouTube's 120px placeholder as missing; oEmbed 401 (embedding disabled) counts as valid.
- **`getYoutubeVideoInfo`** aborts each request after 8 s and returns a fresh copy per call.
- The IFrame API loader no longer hangs when the script is blocked, and it chains any existing `onYouTubeIframeAPIReady` handler.
- New type exports: `TCreateYoutubeLinkOptions`, `ICustomRequestInit`, `TApiClientProps`.
