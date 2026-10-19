<div align="center">

# @herowcode/utils

> **Uma biblioteca TypeScript de utilitários tree-shakable para datas, strings, arrays, chamadas de API, YouTube e arquivos — uma instalação, todos os projetos.**

[![npm](https://img.shields.io/npm/v/@herowcode/utils?style=for-the-badge&color=CB3837&logo=npm)](https://www.npmjs.com/package/@herowcode/utils)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/herowcode/js-utils/ci.yml?style=for-the-badge&label=CI)](https://github.com/herowcode/js-utils/actions)

</div>

---

## 📖 Contexto

### O Problema

Todo aplicativo que desenvolvo precisava das mesmas funções utilitárias: formatar uma data, debounce em um evento, extrair um ID de vídeo do YouTube, encapsular uma chamada de API com tratamento de erros. O resultado era código copiado e colado espalhado por dezenas de projetos — e quando algo precisava ser corrigido, eu tinha que procurar cada cópia.

### O Objetivo

Uma biblioteca, uma atualização, todos os projetos se beneficiam. O `@herowcode/utils` é construído em torno de duas restrições:

- **Zero overhead desnecessário** — tree-shakable, `sideEffects: false`, importe apenas o que precisa
- **Universal** — funciona em Node.js e browsers, com exports condicionais por ambiente

### Projeto Solo

Projetado, construído e mantido por [Judson Cairo](https://judsoncairo.com) como a base compartilhada para todos os projetos da [HerowCode](https://herowcode.com) — e aberto à comunidade.

---

## 🛠️ Stack

| Camada | Tecnologia |
|--------|------------|
| **Linguagem** | TypeScript 5.x |
| **Build** | tsup — CJS + ESM + declarações `.d.ts` |
| **Testes** | Vitest + jsdom |
| **Linting** | Biome 2.x |
| **Gerenciador de pacotes** | pnpm |
| **CI/CD** | GitHub Actions + npm OIDC provenance |

### Por que essa stack?

**tsup em vez de Rollup/Webpack** — Saída dual CJS/ESM sem configuração, com geração automática de `.d.ts`, code splitting e treeshaking em um único arquivo de configuração.

**Biome em vez de ESLint + Prettier** — Uma ferramenta para linting e formatação com feedback quase instantâneo. Aplica convenções de nomenclatura (`I*` interfaces, `T*` types, `E*` enums) em todo o codebase.

**dayjs em vez de date-fns** — Tamanho base menor com sistema de plugins. O plugin `intl` habilita formatação baseada em `Intl` sem carregar um registro completo de locais.

---

## 📦 Módulos

| Módulo | O que faz | Docs |
|--------|-----------|------|
| `/api` | Cliente HTTP com retry, tokens de auth, erros padronizados, buildQueryString, helpers de paginação | [docs/api.md](../api.md) |
| `/array` | shuffle, unique, chunk, sumBy, groupBy, keyBy | [docs/array.md](../array.md) |
| `/async` | sleep, withTimeout, retry (somente transitórios), backoff, limitador de concorrência, createSingleFlight _(universal)_ | [docs/async.md](../async.md) |
| `/auth` | decodeJWT (sem verificar assinatura), getJWTExp, isJWTExpired, isJWTExpiring, extractBearerToken _(universal)_ | [docs/auth.md](../auth.md) |
| `/br` | formatCEP, formatCPF/isValidCPF, formatCNPJ/isValidCNPJ com dígitos verificadores (inclui CNPJ alfanumérico) _(universal)_ | [docs/br.md](../br.md) |
| `/crypto` | sha256Hex, hmacSha256Hex, safeEqual, generateOpaqueToken, verifyHmacSignature sobre WebCrypto _(universal)_ | [docs/crypto.md](../crypto.md) |
| `/date` | Formatação, tempo relativo, timezone, tempo gasto, helpers de data (YYYY-MM-DD) com timezone (`toISODate`, `addDaysISO`) | [docs/date.md](../date.md) |
| `/env` | requireEnv, optionalEnv, parseBoolean com fonte injetável e erros com código _(universal)_ | [docs/env.md](../env.md) |
| `/errors` | getErrorMessage, getErrorStatus, getRootCause, detecção de erros transitórios, família HttpError _(universal)_ | [docs/errors.md](../errors.md) |
| `/files` | Comprimir imagens, download de URLs/blobs, copiar para a área de transferência, formatar bytes _(browser + Node)_; toCSV _(universal)_ | [docs/files.md](../files.md) |
| `/function` | debounce, throttle, tryCatch, tryCatchResult, isBrowser/isServer, safeJsonParse | [docs/function.md](../function.md) |
| `/http` | corsHeaders, preflight, jsonResponse, fetchWithTimeout, fetchJson sobre Request/Response da Web _(universal)_ | [docs/http.md](../http.md) |
| `/logger` | Logger estruturado (Pino no Node, baseado em console no browser), redactSecrets, redactDeep | [docs/logger.md](../logger.md) |
| `/number` | formatCurrency, formatNumber, formatPercent, percentOf, parseLocaleNumber, toNumber _(universal)_ | [docs/number.md](../number.md) |
| `/phone` | onlyDigits, normalizePhone (E.164, BR/US), formatPhone, getBRMobileVariants, buildWhatsAppLink _(universal)_ | [docs/phone.md](../phone.md) |
| `/string` | Conversão de case, slugify, removeAccents, normalizeText, truncate, markdownToText, getInitials, escapeHtml, escapeRegExp, pluralize, formatação de tempo | [docs/string.md](../string.md) |
| `/youtube` | Extrair IDs, gerar URLs, informações de vídeo com cache | [docs/youtube.md](../youtube.md) |

### Qual usar: `http`, `api` ou `async`?

| Você precisa de | Use |
|-----------------|-----|
| Uma requisição que lança em caso de falha, com timeout | `http` `fetchJson` |
| Uma `Response` crua com timeout | `http` `fetchWithTimeout` |
| Headers CORS ou resposta de preflight em um Worker ou route handler | `http` `corsHeaders`, `preflight` |
| Um cliente com base URL, tokens de auth, retries e resultados `{ data, error }` que nunca lançam | [`api`](../api.md) `apiClient` |
| Seu próprio loop de retry, signal de timeout ou limite de concorrência em volta de qualquer promise | [`async`](../async.md) `retry`, `withTimeout`, `createConcurrencyLimiter` |

### Encontre um helper (A-Z)

Substituindo um helper caseiro? Veja [Substituindo uma cópia local](replacing-local-copies.md) para as diferenças de comportamento. Regenere esta tabela com `pnpm build && pnpm docs:index`.

<!-- helper-index:start -->
| Helper | Importar de | Docs |
|---|---|---|
| `addDaysISO` | `@herowcode/utils/date` | [date.md](../date.md) |
| `apiClient` | `@herowcode/utils/api` | [api.md](../api.md) |
| `backoffDelay` | `@herowcode/utils/async` | [async.md](../async.md) |
| `BadRequestError` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `buildPageMeta` | `@herowcode/utils/api` | [api.md](../api.md) |
| `buildQueryString` | `@herowcode/utils/api` | [api.md](../api.md) |
| `buildWhatsAppLink` | `@herowcode/utils/phone` | [phone.md](../phone.md) |
| `camelCase` | `@herowcode/utils/string` | [string.md](../string.md) |
| `capitalize` | `@herowcode/utils/string` | [string.md](../string.md) |
| `chunk` | `@herowcode/utils/array` | [array.md](../array.md) |
| `compressImage` | `@herowcode/utils/files` | [files.md](../files.md) |
| `ConflictError` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `copyToClipboard` | `@herowcode/utils/files` | [files.md](../files.md) |
| `corsHeaders` | `@herowcode/utils/http` | [http.md](../http.md) |
| `createConcurrencyLimiter` | `@herowcode/utils/async` | [async.md](../async.md) |
| `createLogger` | `@herowcode/utils/logger` | [logger.md](../logger.md) |
| `createPinoInstance` | `@herowcode/utils/logger` | [logger.md](../logger.md) |
| `createSingleFlight` | `@herowcode/utils/async` | [async.md](../async.md) |
| `dayjs` | `@herowcode/utils/date` | [date.md](../date.md) |
| `debounce` | `@herowcode/utils/function` | [function.md](../function.md) |
| `decodeJWT` | `@herowcode/utils/auth` | [auth.md](../auth.md) |
| `diffDaysISO` | `@herowcode/utils/date` | [date.md](../date.md) |
| `downloadBlob` | `@herowcode/utils/files` | [files.md](../files.md) |
| `downloadUrl` | `@herowcode/utils/files` | [files.md](../files.md) |
| `escapeHtml` | `@herowcode/utils/string` | [string.md](../string.md) |
| `escapeRegExp` | `@herowcode/utils/string` | [string.md](../string.md) |
| `extractBearerToken` | `@herowcode/utils/auth` | [auth.md](../auth.md) |
| `extractYouTubeId` | `@herowcode/utils/youtube` | [youtube.md](../youtube.md) |
| `fetchJson` | `@herowcode/utils/http` | [http.md](../http.md) |
| `fetchWithTimeout` | `@herowcode/utils/http` | [http.md](../http.md) |
| `fileDelete` | `@herowcode/utils/files` | [files.md](../files.md) |
| `fileExists` | `@herowcode/utils/files` | [files.md](../files.md) |
| `fixTimezoneOffset` | `@herowcode/utils/date` | [date.md](../date.md) |
| `ForbiddenError` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `formatBytes` | `@herowcode/utils/files` | [files.md](../files.md) |
| `formatCEP` | `@herowcode/utils/br` | [br.md](../br.md) |
| `formatCNPJ` | `@herowcode/utils/br` | [br.md](../br.md) |
| `formatCPF` | `@herowcode/utils/br` | [br.md](../br.md) |
| `formatCurrency` | `@herowcode/utils/number` | [number.md](../number.md) |
| `formatDate` | `@herowcode/utils/date` | [date.md](../date.md) |
| `formatHMSToSeconds` | `@herowcode/utils/string` | [string.md](../string.md) |
| `formatNumber` | `@herowcode/utils/number` | [number.md](../number.md) |
| `formatPercent` | `@herowcode/utils/number` | [number.md](../number.md) |
| `formatPhone` | `@herowcode/utils/phone` | [phone.md](../phone.md) |
| `formatSecondsToFragment` | `@herowcode/utils/string` | [string.md](../string.md) |
| `formatSecondsToHMS` | `@herowcode/utils/string` | [string.md](../string.md) |
| `formatStringToTime` | `@herowcode/utils/string` | [string.md](../string.md) |
| `generateOpaqueToken` | `@herowcode/utils/crypto` | [crypto.md](../crypto.md) |
| `generateYoutubeURL` | `@herowcode/utils/youtube` | [youtube.md](../youtube.md) |
| `getBRMobileVariants` | `@herowcode/utils/phone` | [phone.md](../phone.md) |
| `getCurrentDateInUTC` | `@herowcode/utils/date` | [date.md](../date.md) |
| `getDateInUTC` | `@herowcode/utils/date` | [date.md](../date.md) |
| `getDatePartsInTimeZone` | `@herowcode/utils/date` | [date.md](../date.md) |
| `getDayjsGlobalIntl` | `@herowcode/utils/date` | [date.md](../date.md) |
| `getErrorMessage` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `getErrorStatus` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `getInitials` | `@herowcode/utils/string` | [string.md](../string.md) |
| `getJWTExp` | `@herowcode/utils/auth` | [auth.md](../auth.md) |
| `getOffset` | `@herowcode/utils/api` | [api.md](../api.md) |
| `getRelativeTime` | `@herowcode/utils/date` | [date.md](../date.md) |
| `getRootCause` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `getTodayISODate` | `@herowcode/utils/date` | [date.md](../date.md) |
| `getYoutubeThumbnail` | `@herowcode/utils/youtube` | [youtube.md](../youtube.md) |
| `getYoutubeVideoDuration` | `@herowcode/utils/youtube` | [youtube.md](../youtube.md) |
| `getYoutubeVideoInfo` | `@herowcode/utils/youtube` | [youtube.md](../youtube.md) |
| `getZonedHour` | `@herowcode/utils/date` | [date.md](../date.md) |
| `groupBy` | `@herowcode/utils/array` | [array.md](../array.md) |
| `hmacSha256Hex` | `@herowcode/utils/crypto` | [crypto.md](../crypto.md) |
| `HttpError` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `isBrowser` | `@herowcode/utils/function` | [function.md](../function.md) |
| `isHttpError` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `isJWTExpired` | `@herowcode/utils/auth` | [auth.md](../auth.md) |
| `isJWTExpiring` | `@herowcode/utils/auth` | [auth.md](../auth.md) |
| `isServer` | `@herowcode/utils/function` | [function.md](../function.md) |
| `isTransientNetworkError` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `isTransientStatus` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `isValidCNPJ` | `@herowcode/utils/br` | [br.md](../br.md) |
| `isValidCPF` | `@herowcode/utils/br` | [br.md](../br.md) |
| `jsonResponse` | `@herowcode/utils/http` | [http.md](../http.md) |
| `kebabCase` | `@herowcode/utils/string` | [string.md](../string.md) |
| `keyBy` | `@herowcode/utils/array` | [array.md](../array.md) |
| `mapInChunks` | `@herowcode/utils/async` | [async.md](../async.md) |
| `markdownToText` | `@herowcode/utils/string` | [string.md](../string.md) |
| `normalizePhone` | `@herowcode/utils/phone` | [phone.md](../phone.md) |
| `normalizeText` | `@herowcode/utils/string` | [string.md](../string.md) |
| `NotFoundError` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `onlyDigits` | `@herowcode/utils/phone` | [phone.md](../phone.md) |
| `optionalEnv` | `@herowcode/utils/env` | [env.md](../env.md) |
| `parseBoolean` | `@herowcode/utils/env` | [env.md](../env.md) |
| `parseISODateLocal` | `@herowcode/utils/date` | [date.md](../date.md) |
| `parseLocaleNumber` | `@herowcode/utils/number` | [number.md](../number.md) |
| `parseRetryAfterMs` | `@herowcode/utils/async` | [async.md](../async.md) |
| `parseTimeSpent` | `@herowcode/utils/date` | [date.md](../date.md) |
| `percentOf` | `@herowcode/utils/number` | [number.md](../number.md) |
| `pluralize` | `@herowcode/utils/string` | [string.md](../string.md) |
| `preflight` | `@herowcode/utils/http` | [http.md](../http.md) |
| `redactDeep` | `@herowcode/utils/logger` | [logger.md](../logger.md) |
| `redactSecrets` | `@herowcode/utils/logger` | [logger.md](../logger.md) |
| `removeAccents` | `@herowcode/utils/string` | [string.md](../string.md) |
| `removeHtmlTags` | `@herowcode/utils/string` | [string.md](../string.md) |
| `requireEnv` | `@herowcode/utils/env` | [env.md](../env.md) |
| `resetDayjsGlobalIntl` | `@herowcode/utils/date` | [date.md](../date.md) |
| `resolveDayjsIntlConfig` | `@herowcode/utils/date` | [date.md](../date.md) |
| `retry` | `@herowcode/utils/async` | [async.md](../async.md) |
| `safeEqual` | `@herowcode/utils/crypto` | [crypto.md](../crypto.md) |
| `safeJsonParse` | `@herowcode/utils/function` | [function.md](../function.md) |
| `safeStorage` | `@herowcode/utils/files` | [files.md](../files.md) |
| `setDayjsGlobalIntl` | `@herowcode/utils/date` | [date.md](../date.md) |
| `sha256Hex` | `@herowcode/utils/crypto` | [crypto.md](../crypto.md) |
| `shuffle` | `@herowcode/utils/array` | [array.md](../array.md) |
| `sleep` | `@herowcode/utils/async` | [async.md](../async.md) |
| `slugify` | `@herowcode/utils/string` | [string.md](../string.md) |
| `snakeCase` | `@herowcode/utils/string` | [string.md](../string.md) |
| `sumBy` | `@herowcode/utils/array` | [array.md](../array.md) |
| `throttle` | `@herowcode/utils/function` | [function.md](../function.md) |
| `toCSV` | `@herowcode/utils/files` | [files.md](../files.md) |
| `toISODate` | `@herowcode/utils/date` | [date.md](../date.md) |
| `toNumber` | `@herowcode/utils/number` | [number.md](../number.md) |
| `TooManyRequestsError` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `toSentenceCase` | `@herowcode/utils/string` | [string.md](../string.md) |
| `TRANSIENT_STATUS_CODES` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `truncate` | `@herowcode/utils/string` | [string.md](../string.md) |
| `tryCatch` | `@herowcode/utils/function` | [function.md](../function.md) |
| `tryCatchResult` | `@herowcode/utils/function` | [function.md](../function.md) |
| `UnauthorizedError` | `@herowcode/utils/errors` | [errors.md](../errors.md) |
| `unique` | `@herowcode/utils/array` | [array.md](../array.md) |
| `validateYoutubeLink` | `@herowcode/utils/youtube` | [youtube.md](../youtube.md) |
| `verifyHmacSignature` | `@herowcode/utils/crypto` | [crypto.md](../crypto.md) |
| `withDayjsGlobalIntl` | `@herowcode/utils/date` | [date.md](../date.md) |
| `withTimeout` | `@herowcode/utils/async` | [async.md](../async.md) |
<!-- helper-index:end -->

---

## 🚀 Instalação

```bash
npm install @herowcode/utils
# ou
pnpm add @herowcode/utils
# ou
yarn add @herowcode/utils
```

Requer Node.js 22.12 ou mais recente. Publica ESM e CommonJS.

**Peer dependencies opcionais** (só para `/logger` no Node):

```bash
npm install pino            # obrigatório para o logger no Node
npm install -D pino-pretty  # saída formatada em dev; JSON em produção sempre funciona
```

---

## ⚡ Quick Start

Sempre importe do módulo específico para manter seu bundle pequeno:

```typescript
import { formatDate, getRelativeTime } from '@herowcode/utils/date';
import { capitalize, slugify, truncate } from '@herowcode/utils/string';
import { debounce, tryCatch } from '@herowcode/utils/function';
import { apiClient } from '@herowcode/utils/api';
import { extractYouTubeId, getYoutubeVideoInfo } from '@herowcode/utils/youtube';
```

O entry point raiz só reexporta os módulos sem dependências (`array`, `function`, `string`):

```typescript
import { capitalize, debounce, shuffle } from '@herowcode/utils';
```

Todos os outros módulos (`api`, `async`, `auth`, `br`, `crypto`, `date`, `env`, `errors`, `files`, `http`, `logger`, `number`, `phone` e `youtube`) só existem via subpath. Atualizando da 1.x? Veja as notas de migração da 2.0 no [CHANGELOG.md](../../CHANGELOG.md).

---

## 💡 Principal Desafio: Exports Universais

A parte mais difícil de construir essa biblioteca foi fazer módulos como `files` e `youtube` funcionarem perfeitamente em ambos os ambientes — browser e Node.js — sem que o consumidor precisasse configurar nada.

Algumas funções só fazem sentido no browser (`compressImage`, `downloadUrl`); outras só no Node.js (`fileExists`, `fileDelete`). A solução são exports condicionais no `package.json`, resolvidos automaticamente por bundlers e pelo runtime do Node.js:

```json
"./files": {
  "browser": { "import": "./dist/files/index.browser.js" },
  "node":    { "import": "./dist/files/index.node.js" },
  "import":  { "default": "./dist/files/index.js" }
}
```

O campo `exports` é **gerado automaticamente** pelo `scripts/sync-exports.cjs` em cada build — nunca edite manualmente.

Para `getYoutubeVideoInfo` especificamente, o ambiente Node.js exigiu uma estratégia de fallback em três níveis, já que a IFrame API não está disponível no servidor:

```
1. Parsear ytInitialPlayerResponse do HTML da página  →  metadata completo
2. YouTube oEmbed API                                  →  título + thumbnail
3. API pública NoEmbed                                 →  último recurso
```

Os resultados são cacheados por ID de vídeo como uma Promise — chamadas concorrentes para o mesmo vídeo fazem apenas uma requisição de rede, e requisições com falha se removem do cache automaticamente.

---

## 📋 Desenvolvimento

```bash
pnpm install          # Instalar dependências
pnpm test             # Rodar testes em modo watch
pnpm test:run         # Execução única dos testes
pnpm test:coverage    # Relatório de cobertura (V8)
pnpm build            # Compilar CJS + ESM + declarações
pnpm check            # Biome check + tsc --noEmit (somente leitura)
pnpm lint             # O mesmo, mas o Biome reescreve arquivos
pnpm test:package     # publint + arethetypeswrong no tarball empacotado
pnpm size             # Limites de tamanho de bundle por entry
pnpm docs:index       # Reescreve o índice A-Z de helpers nos dois READMEs (rode após pnpm build)
```

Rodar um único arquivo de teste:

```bash
pnpm vitest run src/string/capitalize.test.ts
```

> **Nota:** Os exports do `package.json` são gerados automaticamente em cada build. Não edite o campo `exports` manualmente.

### Releases

Os releases usam [Changesets](https://github.com/changesets/changesets):

1. Rode `pnpm changeset` no seu PR e descreva a mudança (patch/minor/major).
2. Após o merge na `main`, o workflow Release abre um PR "chore: version packages" com o bump de versão e o `CHANGELOG.md`.
3. Fazer merge desse PR publica no npm com provenance via npm trusted publishing (OIDC) — nenhum token do npm fica no repositório.

---

## 📊 Métricas

| Métrica | Valor |
|---------|-------|
| Downloads npm / mês | ![npm monthly downloads](https://img.shields.io/npm/dm/@herowcode/utils?style=flat-square&color=CB3837) |
| Downloads npm / semana | ![npm weekly downloads](https://img.shields.io/npm/dw/@herowcode/utils?style=flat-square&color=CB3837) |
| Último release | ![GitHub tag](https://img.shields.io/github/v/tag/herowcode/js-utils?style=flat-square&color=0075ca) |
| Último commit | ![GitHub last commit](https://img.shields.io/github/last-commit/herowcode/js-utils?style=flat-square) |

---

<div align="center">
  <sub>
    Desenvolvido por <a href="https://judsoncairo.com">Judson Cairo</a> ·
    <a href="https://herowcode.com">HerowCode</a> ·
    <a href="../../README.md">🇺🇸 English</a>
  </sub>
</div>
