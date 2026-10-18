---
name: add-module
description: Checklist for adding a src/<module>/ subpath or a browser/node-split function to @herowcode/utils. Use when creating a module, adding index.browser.ts/index.node.ts, or adding a function with runtime-specific fallbacks.
---

Exports and tsup entries are generated from `src/` by `scripts/resolve-entries.cjs`. Everything below is not.

- Entry files are `index.ts` plus optional `index.browser.ts` / `index.node.ts`, never `index.tsx` (skipped). Without a plain `index.ts` the subpath resolves only under the browser/node conditions.
- Env split: same export names in both entries; stand-ins go in `<fn>-browser-fallback.ts` / `<fn>-node-fallback.ts`, tested in `src/<module>/runtime-fallbacks.test.ts` (see `src/files/`).
- New dependency or `node:` builtin: add it to `external` in `tsup.config.ts`; `platform: "neutral"` bundles anything unlisted.
- Root entry: add to `src/index.ts` only if the module has no external imports; `scripts/verify-exports.cjs` asserts the root and `array`/`function`/`string` stay dependency-free. Heavy deps belong in optional `peerDependencies`.
- Browser/node-split modules: add the expected export names to the hardcoded lists in `scripts/verify-exports.cjs`.
- Docs: `docs/<module>.md` in the format of an existing one, plus a row in the Modules table of `README.md` and `docs/pt-br/README.md`.
- Add a size-limit entry in `.size-limit.json` and a changeset (`pnpm changeset`, minor for a new module).
- Finish with `pnpm build && pnpm test:exports && pnpm test:package`, then commit the regenerated `package.json` exports: CI fails if the map differs from the build.
