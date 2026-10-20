<div align="center">

# @herowcode/utils

> **A tree-shakable TypeScript utility library for dates, strings, arrays, API calls, YouTube, and files — one install, every project.**

[![npm](https://img.shields.io/npm/v/@herowcode/utils?style=for-the-badge&color=CB3837&logo=npm)](https://www.npmjs.com/package/@herowcode/utils)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/herowcode/js-utils/ci.yml?style=for-the-badge&label=CI)](https://github.com/herowcode/js-utils/actions)

</div>

---

## 📖 Context

### The Problem

Every application I built required the same utility functions: format a date, debounce an event, extract a YouTube video ID, wrap an API call with error handling. The result was copy-pasted code scattered across dozens of projects — and when something needed fixing, I had to hunt down every copy.

### The Goal

One library, one update, every project benefits. `@herowcode/utils` is built around two constraints:

- **Zero unnecessary overhead** — tree-shakable, `sideEffects: false`, import only what you need
- **Universal** — works in Node.js and browsers, with conditional exports per environment

### Solo Project

Designed, built, and maintained by [Judson Cairo](https://judsoncairo.com) as the shared foundation for all [HerowCode](https://herowcode.com) projects — and open to the community.

---

## 🛠️ Stack

| Layer | Technology |
|-------|------------|
| **Language** | TypeScript 5.x |
| **Build** | tsup — CJS + ESM + `.d.ts` declarations |
| **Testing** | Vitest + jsdom |
| **Linting** | Biome 2.x |
| **Package manager** | pnpm |
| **CI/CD** | GitHub Actions + npm OIDC provenance |

### Why this stack?

**tsup over Rollup/Webpack** — Zero-config dual CJS/ESM output with automatic `.d.ts` generation, code splitting, and treeshaking in a single config file.

**Biome over ESLint + Prettier** — One tool for linting and formatting with near-instant feedback. Enforces naming conventions (`I*` interfaces, `T*` types, `E*` enums) across the codebase.

**dayjs over date-fns** — Smaller base size with a plugin system. The `intl` plugin enables `Intl`-based formatting without shipping a full locale registry.

---

## 📦 Modules

> LLM and agent users: [`llms.txt`](llms.txt) is a compact index of every module and function (shipped in the npm package).

| Module | What it does | Docs |
|--------|-------------|------|
| `/api` | HTTP client with retry, auth tokens, standardized errors, buildQueryString, pagination helpers | [docs/api.md](docs/api.md) |
| `/array` | shuffle, unique, chunk, sumBy, groupBy, keyBy | [docs/array.md](docs/array.md) |
| `/async` | sleep, withTimeout, retry (transient-only), backoff, concurrency limiter, createSingleFlight _(universal)_ | [docs/async.md](docs/async.md) |
| `/auth` | decodeJWT (unverified), getJWTExp, isJWTExpired, isJWTExpiring, extractBearerToken _(universal)_ | [docs/auth.md](docs/auth.md) |
| `/br` | formatCEP, formatCPF/isValidCPF, formatCNPJ/isValidCNPJ with check digits (alphanumeric CNPJ included) _(universal)_ | [docs/br.md](docs/br.md) |
| `/crypto` | sha256Hex, hmacSha256Hex, safeEqual, generateOpaqueToken, verifyHmacSignature over WebCrypto _(universal)_ | [docs/crypto.md](docs/crypto.md) |
| `/date` | Format, relative time, timezone correction, time-spent parsing, timezone-safe date-only helpers (`toISODate`, `addDaysISO`) | [docs/date.md](docs/date.md) |
| `/env` | requireEnv, optionalEnv, parseBoolean with injectable source and coded errors _(universal)_ | [docs/env.md](docs/env.md) |
| `/errors` | getErrorMessage, getErrorStatus, getRootCause, transient-error detection, HttpError family _(universal)_ | [docs/errors.md](docs/errors.md) |
| `/files` | Compress images, download URLs/blobs, copy to clipboard, format bytes _(browser + Node)_; toCSV _(universal)_ | [docs/files.md](docs/files.md) |
| `/function` | debounce, throttle, tryCatch, tryCatchResult, isBrowser/isServer, safeJsonParse | [docs/function.md](docs/function.md) |
| `/http` | corsHeaders, preflight, jsonResponse, fetchWithTimeout, fetchJson over Web Request/Response _(universal)_ | [docs/http.md](docs/http.md) |
| `/logger` | Structured logger (Pino on Node, console-based on browser), redactSecrets, redactDeep | [docs/logger.md](docs/logger.md) |
| `/number` | formatCurrency, formatNumber, formatPercent, percentOf, parseLocaleNumber, toNumber _(universal)_ | [docs/number.md](docs/number.md) |
| `/phone` | onlyDigits, normalizePhone (E.164, BR/US), formatPhone, getBRMobileVariants, buildWhatsAppLink _(universal)_ | [docs/phone.md](docs/phone.md) |
| `/string` | Case conversion, slugify, removeAccents, normalizeText, truncate, markdownToText, getInitials, escapeHtml, escapeRegExp, pluralize, time formatting | [docs/string.md](docs/string.md) |
| `/youtube` | Extract IDs, generate URLs, video info with caching | [docs/youtube.md](docs/youtube.md) |

### Which one: `http`, `api` or `async`?

| You need | Use |
|----------|-----|
| One request that throws on failure, with a timeout | `http` `fetchJson` |
| A raw `Response` with a timeout | `http` `fetchWithTimeout` |
| CORS headers or a preflight answer in a Worker or route handler | `http` `corsHeaders`, `preflight` |
| A client with base URL, auth tokens, retries and `{ data, error }` results that never throw | [`api`](docs/api.md) `apiClient` |
| Your own retry loop, timeout signal or concurrency cap around any promise | [`async`](docs/async.md) `retry`, `withTimeout`, `createConcurrencyLimiter` |

### Find a helper (A-Z)

Replacing a home-made helper? See [Replacing a local copy](docs/replacing-local-copies.md) for behavior differences. Regenerate this table with `pnpm build && pnpm docs:index`.

<!-- helper-index:start -->
| Helper | Import from | Docs |
|---|---|---|
| `addDaysISO` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `apiClient` | `@herowcode/utils/api` | [api.md](docs/api.md) |
| `backoffDelay` | `@herowcode/utils/async` | [async.md](docs/async.md) |
| `BadRequestError` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `buildPageMeta` | `@herowcode/utils/api` | [api.md](docs/api.md) |
| `buildQueryString` | `@herowcode/utils/api` | [api.md](docs/api.md) |
| `buildWhatsAppLink` | `@herowcode/utils/phone` | [phone.md](docs/phone.md) |
| `camelCase` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `capitalize` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `chunk` | `@herowcode/utils/array` | [array.md](docs/array.md) |
| `compressImage` | `@herowcode/utils/files` | [files.md](docs/files.md) |
| `ConflictError` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `copyToClipboard` | `@herowcode/utils/files` | [files.md](docs/files.md) |
| `corsHeaders` | `@herowcode/utils/http` | [http.md](docs/http.md) |
| `createConcurrencyLimiter` | `@herowcode/utils/async` | [async.md](docs/async.md) |
| `createLogger` | `@herowcode/utils/logger` | [logger.md](docs/logger.md) |
| `createPinoInstance` | `@herowcode/utils/logger` | [logger.md](docs/logger.md) |
| `createSingleFlight` | `@herowcode/utils/async` | [async.md](docs/async.md) |
| `dayjs` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `debounce` | `@herowcode/utils/function` | [function.md](docs/function.md) |
| `decodeJWT` | `@herowcode/utils/auth` | [auth.md](docs/auth.md) |
| `diffDaysISO` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `downloadBlob` | `@herowcode/utils/files` | [files.md](docs/files.md) |
| `downloadUrl` | `@herowcode/utils/files` | [files.md](docs/files.md) |
| `escapeHtml` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `escapeRegExp` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `extractBearerToken` | `@herowcode/utils/auth` | [auth.md](docs/auth.md) |
| `extractYouTubeId` | `@herowcode/utils/youtube` | [youtube.md](docs/youtube.md) |
| `fetchJson` | `@herowcode/utils/http` | [http.md](docs/http.md) |
| `fetchWithTimeout` | `@herowcode/utils/http` | [http.md](docs/http.md) |
| `fileDelete` | `@herowcode/utils/files` | [files.md](docs/files.md) |
| `fileExists` | `@herowcode/utils/files` | [files.md](docs/files.md) |
| `fixTimezoneOffset` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `ForbiddenError` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `formatBytes` | `@herowcode/utils/files` | [files.md](docs/files.md) |
| `formatCEP` | `@herowcode/utils/br` | [br.md](docs/br.md) |
| `formatCNPJ` | `@herowcode/utils/br` | [br.md](docs/br.md) |
| `formatCPF` | `@herowcode/utils/br` | [br.md](docs/br.md) |
| `formatCurrency` | `@herowcode/utils/number` | [number.md](docs/number.md) |
| `formatDate` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `formatHMSToSeconds` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `formatNumber` | `@herowcode/utils/number` | [number.md](docs/number.md) |
| `formatPercent` | `@herowcode/utils/number` | [number.md](docs/number.md) |
| `formatPhone` | `@herowcode/utils/phone` | [phone.md](docs/phone.md) |
| `formatSecondsToFragment` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `formatSecondsToHMS` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `formatStringToTime` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `generateOpaqueToken` | `@herowcode/utils/crypto` | [crypto.md](docs/crypto.md) |
| `generateYoutubeURL` | `@herowcode/utils/youtube` | [youtube.md](docs/youtube.md) |
| `getBRMobileVariants` | `@herowcode/utils/phone` | [phone.md](docs/phone.md) |
| `getCurrentDateInUTC` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `getDateInUTC` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `getDatePartsInTimeZone` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `getDayjsGlobalIntl` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `getErrorMessage` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `getErrorStatus` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `getInitials` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `getJWTExp` | `@herowcode/utils/auth` | [auth.md](docs/auth.md) |
| `getOffset` | `@herowcode/utils/api` | [api.md](docs/api.md) |
| `getRelativeTime` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `getRootCause` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `getTodayISODate` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `getYoutubeThumbnail` | `@herowcode/utils/youtube` | [youtube.md](docs/youtube.md) |
| `getYoutubeVideoDuration` | `@herowcode/utils/youtube` | [youtube.md](docs/youtube.md) |
| `getYoutubeVideoInfo` | `@herowcode/utils/youtube` | [youtube.md](docs/youtube.md) |
| `getZonedHour` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `groupBy` | `@herowcode/utils/array` | [array.md](docs/array.md) |
| `hmacSha256Hex` | `@herowcode/utils/crypto` | [crypto.md](docs/crypto.md) |
| `HttpError` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `isBrowser` | `@herowcode/utils/function` | [function.md](docs/function.md) |
| `isHttpError` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `isJWTExpired` | `@herowcode/utils/auth` | [auth.md](docs/auth.md) |
| `isJWTExpiring` | `@herowcode/utils/auth` | [auth.md](docs/auth.md) |
| `isServer` | `@herowcode/utils/function` | [function.md](docs/function.md) |
| `isTransientNetworkError` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `isTransientStatus` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `isValidCNPJ` | `@herowcode/utils/br` | [br.md](docs/br.md) |
| `isValidCPF` | `@herowcode/utils/br` | [br.md](docs/br.md) |
| `jsonResponse` | `@herowcode/utils/http` | [http.md](docs/http.md) |
| `kebabCase` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `keyBy` | `@herowcode/utils/array` | [array.md](docs/array.md) |
| `mapInChunks` | `@herowcode/utils/async` | [async.md](docs/async.md) |
| `markdownToText` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `normalizePhone` | `@herowcode/utils/phone` | [phone.md](docs/phone.md) |
| `normalizeText` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `NotFoundError` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `onlyDigits` | `@herowcode/utils/phone` | [phone.md](docs/phone.md) |
| `optionalEnv` | `@herowcode/utils/env` | [env.md](docs/env.md) |
| `parseBoolean` | `@herowcode/utils/env` | [env.md](docs/env.md) |
| `parseISODateLocal` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `parseLocaleNumber` | `@herowcode/utils/number` | [number.md](docs/number.md) |
| `parseRetryAfterMs` | `@herowcode/utils/async` | [async.md](docs/async.md) |
| `parseTimeSpent` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `percentOf` | `@herowcode/utils/number` | [number.md](docs/number.md) |
| `pluralize` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `preflight` | `@herowcode/utils/http` | [http.md](docs/http.md) |
| `redactDeep` | `@herowcode/utils/logger` | [logger.md](docs/logger.md) |
| `redactSecrets` | `@herowcode/utils/logger` | [logger.md](docs/logger.md) |
| `removeAccents` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `removeHtmlTags` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `requireEnv` | `@herowcode/utils/env` | [env.md](docs/env.md) |
| `resetDayjsGlobalIntl` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `resolveDayjsIntlConfig` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `retry` | `@herowcode/utils/async` | [async.md](docs/async.md) |
| `safeEqual` | `@herowcode/utils/crypto` | [crypto.md](docs/crypto.md) |
| `safeJsonParse` | `@herowcode/utils/function` | [function.md](docs/function.md) |
| `safeStorage` | `@herowcode/utils/files` | [files.md](docs/files.md) |
| `setDayjsGlobalIntl` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `sha256Hex` | `@herowcode/utils/crypto` | [crypto.md](docs/crypto.md) |
| `shuffle` | `@herowcode/utils/array` | [array.md](docs/array.md) |
| `sleep` | `@herowcode/utils/async` | [async.md](docs/async.md) |
| `slugify` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `snakeCase` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `sumBy` | `@herowcode/utils/array` | [array.md](docs/array.md) |
| `throttle` | `@herowcode/utils/function` | [function.md](docs/function.md) |
| `toCSV` | `@herowcode/utils/files` | [files.md](docs/files.md) |
| `toISODate` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `toNumber` | `@herowcode/utils/number` | [number.md](docs/number.md) |
| `TooManyRequestsError` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `toSentenceCase` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `TRANSIENT_STATUS_CODES` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `truncate` | `@herowcode/utils/string` | [string.md](docs/string.md) |
| `tryCatch` | `@herowcode/utils/function` | [function.md](docs/function.md) |
| `tryCatchResult` | `@herowcode/utils/function` | [function.md](docs/function.md) |
| `UnauthorizedError` | `@herowcode/utils/errors` | [errors.md](docs/errors.md) |
| `unique` | `@herowcode/utils/array` | [array.md](docs/array.md) |
| `validateYoutubeLink` | `@herowcode/utils/youtube` | [youtube.md](docs/youtube.md) |
| `verifyHmacSignature` | `@herowcode/utils/crypto` | [crypto.md](docs/crypto.md) |
| `withDayjsGlobalIntl` | `@herowcode/utils/date` | [date.md](docs/date.md) |
| `withTimeout` | `@herowcode/utils/async` | [async.md](docs/async.md) |
<!-- helper-index:end -->

---

## 🚀 Installation

```bash
npm install @herowcode/utils
# or
pnpm add @herowcode/utils
# or
yarn add @herowcode/utils
```

Requires Node.js 22.12 or newer. Ships ESM and CommonJS.

**Optional peer dependencies** (only for `/logger` on Node):

```bash
npm install pino            # required by the Node logger
npm install -D pino-pretty  # pretty output in dev; JSON in prod always works
```

> A Python template covering the same contract is shipped in `templates/python/logger.py` — copy it into your Python services. See [docs/logger.md](docs/logger.md).

---

## ⚡ Quick Start

Always import from the specific module to keep your bundle small:

```typescript
import { formatDate, getRelativeTime } from '@herowcode/utils/date';
import { capitalize, slugify, truncate } from '@herowcode/utils/string';
import { debounce, tryCatch } from '@herowcode/utils/function';
import { apiClient } from '@herowcode/utils/api';
import { extractYouTubeId, getYoutubeVideoInfo } from '@herowcode/utils/youtube';
```

The root entry only re-exports the dependency-free modules (`array`, `function`, `string`):

```typescript
import { capitalize, debounce, shuffle } from '@herowcode/utils';
```

Every other module (`api`, `async`, `auth`, `br`, `crypto`, `date`, `env`, `errors`, `files`, `http`, `logger`, `number`, `phone` and `youtube`) is subpath-only. Upgrading from 1.x? See [CHANGELOG.md](CHANGELOG.md) for the 2.0 migration notes.

---

## 💡 Key Challenge: Universal Exports

The hardest part of building this library was making modules like `files` and `youtube` work seamlessly in both browser and Node.js environments — without requiring consumers to configure anything.

Some functions only make sense in a browser (`compressImage`, `downloadUrl`); others only in Node.js (`fileExists`, `fileDelete`). The solution is conditional exports in `package.json`, resolved automatically by bundlers and the Node.js runtime:

```json
"./files": {
  "browser": { "import": "./dist/files/index.browser.js" },
  "node":    { "import": "./dist/files/index.node.js" },
  "import":  { "default": "./dist/files/index.js" }
}
```

The `exports` field is **auto-generated** by `scripts/sync-exports.cjs` on every build — never edit it manually.

For `getYoutubeVideoInfo` specifically, the Node.js environment queries **four sources in parallel** and merges the results — each field picks the first non-empty value and thumbnails are deduped across sources:

```
1. InnerTube player endpoint (ANDROID → WEB client)  →  full metadata (primary)
2. Watch page HTML (ytInitialPlayerResponse)         →  full metadata
3. YouTube oEmbed API                                →  title + thumbnail
4. NoEmbed public API                                →  title + description + upload date
```

The InnerTube endpoint is used because it works reliably from datacenter/containerized environments where YouTube serves a consent interstitial instead of the normal watch page. Sources complement each other: if InnerTube returns metadata but oEmbed contributes an extra thumbnail size, the merged result has both.

Results are cached by video ID as a Promise — concurrent calls for the same video hit the network only once, and failed requests evict themselves from the cache automatically.

---

## 📋 Development

```bash
pnpm install          # Install dependencies
pnpm test             # Run tests in watch mode
pnpm test:run         # Single test run
pnpm test:coverage    # Coverage report (V8)
pnpm build            # Compile CJS + ESM + declarations
pnpm check            # Biome check + tsc --noEmit (read-only)
pnpm lint             # Same, but Biome rewrites files
pnpm test:package     # publint + arethetypeswrong on the packed tarball
pnpm size             # Bundle-size limits per entry
pnpm docs:index       # Rewrite the A-Z helper index in both READMEs (run after pnpm build)
pnpm docs:index       # Rewrite the A-Z helper index in both READMEs (after pnpm build)
```

Run a single test file:

```bash
pnpm vitest run src/string/capitalize.test.ts
```

> **Note:** `package.json` exports are auto-generated on every build. Do not edit the `exports` field manually.

### Releasing

Releases use [Changesets](https://github.com/changesets/changesets):

1. Run `pnpm changeset` in your PR and describe the change (patch/minor/major).
2. After merge to `main`, the Release workflow opens a "chore: version packages" PR with the version bump and `CHANGELOG.md`.
3. Merging that PR publishes to npm with provenance via npm trusted publishing (OIDC) — no npm token is stored in the repo.

---

## 📊 Metrics

| Metric | Value |
|--------|-------|
| npm downloads / month | ![npm monthly downloads](https://img.shields.io/npm/dm/@herowcode/utils?style=flat-square&color=CB3837) |
| npm downloads / week | ![npm weekly downloads](https://img.shields.io/npm/dw/@herowcode/utils?style=flat-square&color=CB3837) |
| Latest release | ![GitHub tag](https://img.shields.io/github/v/tag/herowcode/js-utils?style=flat-square&color=0075ca) |
| Last commit | ![GitHub last commit](https://img.shields.io/github/last-commit/herowcode/js-utils?style=flat-square) |

---

<div align="center">
  <sub>
    Built by <a href="https://judsoncairo.com">Judson Cairo</a> ·
    <a href="https://herowcode.com">HerowCode</a> ·
    <a href="docs/pt-br/README.md">🇧🇷 Português</a>
  </sub>
</div>
