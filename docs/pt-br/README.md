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
| `/async` | sleep, withTimeout, retry (somente transitórios), backoff, limitador de concorrência _(universal)_ | [docs/async.md](../async.md) |
| `/date` | Formatação, tempo relativo, timezone, tempo gasto, helpers de data (YYYY-MM-DD) com timezone (`toISODate`, `addDaysISO`) | [docs/date.md](../date.md) |
| `/env` | requireEnv, optionalEnv, parseBoolean com fonte injetável e erros com código _(universal)_ | [docs/env.md](../env.md) |
| `/errors` | getErrorMessage, getErrorStatus, getRootCause, detecção de erros transitórios _(universal)_ | [docs/errors.md](../errors.md) |
| `/files` | Comprimir imagens, download de URLs/blobs, copiar para a área de transferência, formatar bytes _(browser + Node)_; toCSV _(universal)_ | [docs/files.md](../files.md) |
| `/function` | debounce, throttle, tryCatch, isBrowser/isServer, safeJsonParse | [docs/function.md](../function.md) |
| `/logger` | Logger estruturado (Pino no Node, baseado em console no browser), redactSecrets, redactDeep | [docs/logger.md](../logger.md) |
| `/number` | formatCurrency, formatNumber, formatPercent, percentOf, parseLocaleNumber, toNumber _(universal)_ | [docs/number.md](../number.md) |
| `/string` | Conversão de case, slugify, removeAccents, normalizeText, truncate, markdownToText, getInitials, escapeHtml, escapeRegExp, pluralize, formatação de tempo | [docs/string.md](../string.md) |
| `/youtube` | Extrair IDs, gerar URLs, informações de vídeo com cache | [docs/youtube.md](../youtube.md) |

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

`api`, `async`, `date`, `errors`, `files`, `logger` e `youtube` só existem via subpath. Atualizando da 1.x? Veja as notas de migração da 2.0 no [CHANGELOG.md](../../CHANGELOG.md).

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
