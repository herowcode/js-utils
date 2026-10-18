# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Run tests with `pnpm test:run` or `pnpm vitest run <file>`. `pnpm test` is watch mode and never exits.
- `pnpm lint` rewrites files (`biome check --write --unsafe`) before running `tsc`; review the diff after it. For read-only checks use the Health Stack below.
- `pnpm build` regenerates `exports` in `package.json` (prebuild runs `scripts/sync-exports.cjs`). Never edit `exports` by hand, and commit the regenerated map: CI publishes whatever is committed.

## Modules

- Each `src/<module>/index.ts` is a public subpath; `index.browser.ts` / `index.node.ts` add env conditions. Entry files must be `.ts`: an `index.tsx` is silently skipped.
- Adding a module or a browser/node-split function: use the `add-module` skill, several steps are manual.
- When a public function's signature or behavior changes, update `docs/<module>.md`. When a module is added or removed, update the Modules table in `README.md` and `docs/pt-br/README.md`.
- Biome naming: interfaces `I*`, type aliases `T*`, enums `E*` with CONSTANT_CASE members.

## Releases

Every user-facing change needs a changeset (`pnpm changeset`); breaking changes get a migration note in it. Merging to `main` opens a "chore: version packages" PR via `.github/workflows/release.yml`, and merging that PR publishes to npm through OIDC trusted publishing. Never run `npm publish`, `changeset version` or create/push tags by hand.

## Health Stack

- typecheck: pnpm tsc --noEmit
- lint: pnpm biome check .
- package: pnpm test:package
- size: pnpm size
- test: pnpm test:run
- build: pnpm build
- exports: pnpm test:exports
