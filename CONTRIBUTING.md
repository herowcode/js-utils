# Contributing

Setup, scripts and the release flow are in the [README](README.md#-development). `CLAUDE.md` has the repo rules for agents.

## Naming rules for public APIs

- **Verb first:** `get`, `format`, `parse`, `to`, `is`, `create`, `build`, `decode` (`getJWTExp`, `formatCEP`, `toISODate`, `isValidCPF`).
- **Acronyms stay uppercase:** `decodeJWT`, `buildWhatsAppLink`, `getBRMobileVariants`, `toCSV`. Existing names keep their spelling until 3.0.
- **Units in names:** time parameters and options end in `Ms` or `Seconds` (`timeoutMs`, `baseMs`, `marginSeconds`, `parseRetryAfterMs`). Never a bare `timeout` or `delay`.
- **Invalid input uses a `{ fallback }` option,** not a positional argument and not a throw: `formatCurrency(value, { fallback })`. Document the default in an "Invalid input returns: ..." line. `formatDate` takes `fallback` on its config-object form.
- **Errors thrown by the library carry a `HEROW_*` `code`.** The message says what happened and how to fix it, links to `docs/errors.md#<code>` and never contains the offending value. Add a `## HEROW_...` section to `docs/errors.md` (`pnpm test:exports` fails without one).
- **Types:** interfaces `I*`, type aliases `T*`, enums `E*` (Biome enforces it).

## Docs for every public export

- JSDoc: a one-line summary and one `@example`.
- `docs/<module>.md`: usage, an "Invalid input returns: ..." line and a "Replacing a local copy" section.
- Add a row to [docs/replacing-local-copies.md](docs/replacing-local-copies.md) and its pt-BR twin, and add the name to `GUIDED_EXPORTS` in `scripts/verify-docs.cjs`.
- A changeset (`pnpm changeset`) with a usage example.

## Helper index

The A-Z table in `README.md` and `docs/pt-br/README.md` is generated from the built package. After adding or renaming an export:

```bash
pnpm build && pnpm docs:index   # node scripts/generate-index.cjs --write
```

`pnpm test:exports` fails when the table has drifted.

## Before you push

```bash
pnpm check && pnpm test:run && pnpm build && pnpm test:exports && pnpm test:package && pnpm size
```
