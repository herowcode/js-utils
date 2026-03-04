# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm build          # Sync exports + compile with tsup (CJS + ESM)
pnpm lint           # Biome check with auto-fix
pnpm test           # Vitest in watch mode
pnpm test:run       # Vitest single run
pnpm test:coverage  # Coverage report (V8)
```

Run a single test file:
```bash
pnpm vitest run src/string/capitalize.test.ts
```

## Architecture

This is a tree-shakable TypeScript utility library (`@herowcode/utils`) published to npm as both CJS and ESM. It targets ES2018 and supports Node.js and browser environments.

### Module layout

Each module under `src/` follows the same pattern:
- `index.ts` — primary export (re-exports all functions)
- `index.browser.ts` / `index.node.ts` — environment-specific exports (only in `files/` and `youtube/`)
- Individual function files with inline input validation and TypeScript generics

Modules: `api`, `array`, `date`, `files`, `function`, `string`, `youtube`, `types`

### Export sync

`package.json` exports are **auto-generated** by `scripts/sync-exports.cjs` (run as `prebuild`). Do not manually edit the `exports` field in `package.json`.

### Build

`tsup.config.ts` compiles to `dist/` with splitting, treeshaking, sourcemaps, and `.d.ts`/`.d.mts` declarations. Node built-ins (`fs`, `path`, `os`, `crypto`) are externalized.

### Linting conventions

Biome enforces:
- Interfaces prefixed `I*`, type aliases `T*`, enums `E*`, enum members `CONSTANT_CASE`
- `import type` for type-only imports
- No unused variables or imports

### Testing

Vitest runs with jsdom environment. Tests live alongside source files as `*.test.ts`. Setup file: `vitest-setup.ts`.
