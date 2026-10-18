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

## Deploy Configuration (configured by /setup-deploy)
- Platform: npm (Changesets via GitHub Actions)
- Production URL: https://www.npmjs.com/package/@herowcode/utils
- Deploy workflow: .github/workflows/release.yml
- Deploy status command: GH_CONFIG_DIR=$HOME/.config/gh-herowcode gh run list --repo herowcode/js-utils --workflow release.yml --branch main --limit 1 --json headSha,status,conclusion
- Merge method: squash
- Project type: library
- Post-deploy health check: test "$(npm view @herowcode/utils version)" = "$(node -p 'require("./package.json").version')"

### Custom deploy hooks
- Pre-merge: pnpm check && pnpm test:run && pnpm build && pnpm test:exports && pnpm test:package && pnpm size
- Deploy trigger: merging a feature PR to main only opens/updates the "chore: version packages" PR; merging that PR publishes to npm
- Deploy status: GH_CONFIG_DIR=$HOME/.config/gh-herowcode gh run list --repo herowcode/js-utils --workflow release.yml --branch main --limit 1 --json headSha,status,conclusion
- Health check: test "$(npm view @herowcode/utils version)" = "$(node -p 'require("./package.json").version')"
