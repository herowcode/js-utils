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

| Module | What it does | Docs |
|--------|-------------|------|
| `/api` | HTTP client with retry, auth tokens, and standardized errors | [docs/api.md](docs/api.md) |
| `/array` | shuffle, unique, markdownToText | [docs/array.md](docs/array.md) |
| `/date` | Format, relative time, timezone correction, time-spent parsing | [docs/date.md](docs/date.md) |
| `/files` | Compress images, download URLs, format bytes _(browser + Node)_ | [docs/files.md](docs/files.md) |
| `/function` | debounce, throttle, tryCatch | [docs/function.md](docs/function.md) |
| `/nextjs` | OptimizedImage component | [docs/nextjs.md](docs/nextjs.md) |
| `/string` | Case conversion, slugify, truncate, time formatting | [docs/string.md](docs/string.md) |
| `/youtube` | Extract IDs, generate URLs, video info with caching | [docs/youtube.md](docs/youtube.md) |

---

## 🚀 Installation

```bash
npm install @herowcode/utils
# or
pnpm add @herowcode/utils
# or
yarn add @herowcode/utils
```

**Peer dependencies** (only needed for specific modules):

```bash
# /nextjs and /youtube React hook
npm install react next
```

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

Or import from the root entry (all modules bundled together):

```typescript
import { formatDate, capitalize, debounce } from '@herowcode/utils';
```

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

For `getYoutubeVideoInfo` specifically, the Node.js environment required a three-tier fallback since the IFrame API isn't available server-side:

```
1. Parse ytInitialPlayerResponse from the watch page HTML  →  full metadata
2. YouTube oEmbed API                                       →  title + thumbnail
3. NoEmbed public API                                       →  last resort
```

Results are cached by video ID as a Promise — concurrent calls for the same video hit the network only once, and failed requests evict themselves from the cache automatically.

---

## 📋 Development

```bash
pnpm install          # Install dependencies
pnpm test             # Run tests in watch mode
pnpm test:run         # Single test run
pnpm test:coverage    # Coverage report (V8)
pnpm build            # Compile CJS + ESM + declarations
pnpm lint             # Biome check + tsc --noEmit
```

Run a single test file:

```bash
pnpm vitest run src/string/capitalize.test.ts
```

> **Note:** `package.json` exports are auto-generated on every build. Do not edit the `exports` field manually.

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
