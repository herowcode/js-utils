# Substituindo uma cópia local

Encontrou um helper caseiro no seu código? Ache o padrão abaixo, troque o import e leia a coluna de **diferenças de comportamento** antes de rodar os testes. Cada linha leva à seção do helper, com os detalhes e uma linha "Invalid input returns". Para achar um helper pelo nome, veja o [índice A-Z](README.md#encontre-um-helper-a-z).

## Armadilhas conhecidas

- **`formatCurrency` usa espaço não separável (U+00A0) depois de `R$`.** Snapshots com espaço digitado falham; compare com a saída de `Intl.NumberFormat`.
- **`retry` repete só erros transitórios** (falhas de conexão e 408/429/500/502/503/504). Um 400 é lançado na hora; passe `shouldRetry: () => true` para o comportamento antigo de repetir tudo.
- **`requireEnv` e `optionalEnv` em Workers ou Deno não têm `process`.** Passe os bindings em `{ env }`, ou lançam `HEROW_ENV_NO_SOURCE`.
- **Helpers de data precisam de `timeZone` explícito em servidores.** Servidores costumam rodar em UTC, então o padrão dá o dia UTC, o mesmo bug de `toISOString().slice(0, 10)`.
- **`safeEqual` é síncrono; `verifyHmacSignature`, `sha256Hex`, `hmacSha256Hex` e `generateOpaqueToken` retornam Promises.** Um `verifyHmacSignature` sem `await` é sempre truthy.
- **`toCSV` neutraliza fórmulas de planilha.** Texto iniciado por `=`, `+`, `-` ou `@` ganha um `'` na frente; passe números, ou use `neutralizeFormulas: false` para dados confiáveis.
- **`decodeJWT` não verifica assinaturas.** Use os helpers de `auth` só para decisões de UX.
- **As unidades estão no nome:** `timeoutMs`, `baseMs`, `maxMs`, `marginSeconds`, `retryAfterSeconds`. `getJWTExp` retorna segundos.
- **Erros usam `status`, não `statusCode`,** e erros da biblioteca têm um código `HEROW_*` documentado em [errors.md](../errors.md#error-codes).
- **Entrada inválida não lança nos helpers puros.** Retorna a opção `fallback` ou o valor da linha "Invalid input returns". `tryCatch` e `tryCatchResult` têm formatos de resultado diferentes (veja [function.md](../function.md#which-result-shape-to-use)).

## `/api`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `{ totalPages: Math.ceil(total / limit), hasNext: page * limit < total }` | `{ buildPageMeta }` from `@herowcode/utils/api` | `page` e `pageSize` menores que 1 ou não numéricos viram `1`; `total` inválido vira `0`; `total: 0` dá `totalPages: 0`. | Páginas `NaN` e `Infinity` quando falta o parâmetro de query. | [api.md](../api.md#buildpagemeta-page-pagesize-total-) |
| `(page - 1) * limit` | `{ getOffset }` from `@herowcode/utils/api` | Retorna `0` para `page` menor que 1, `NaN` ou `Infinity`; frações são arredondadas para baixo. | Erros de `OFFSET` negativo com `?page=0`. | [api.md](../api.md#getoffsetpage-pagesize) |

## `/array`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `for (i = 0; i < n; i += size) out.push(a.slice(i, i + size))`, ou um loop com `splice` | `{ chunk }` from `@herowcode/utils/array` | `size` menor que 1 ou não numérico retorna `[]`; a entrada não é mutada. | Loop infinito com `size = 0`; a variante com `splice` esvaziava o array do chamador. | [array.md](../array.md#chunkarray-size) |
| `reduce` que faz push em `acc[key]`, ou `Object.groupBy` | `{ groupBy }` from `@herowcode/utils/array` | Objeto simples; a ordem é mantida dentro dos grupos; o callback também recebe o índice. | Chave `"__proto__"` poluindo o acumulador. | [array.md](../array.md#groupbyarray-fn) |
| `Object.fromEntries(list.map((x) => [x.id, x]))` | `{ keyBy }` from `@herowcode/utils/array` | Em chaves duplicadas, o último item vence; o callback também recebe o índice. | Tabelas de lookup com surpresas de chaves de protótipo. | [array.md](../array.md#keybyarray-fn) |
| `items.reduce((sum, x) => sum + x.price, 0)` | `{ sumBy }` from `@herowcode/utils/array` | Resultados que não são números finitos são ignorados; array vazio dá `0`. | Um preço `undefined` transformando o total inteiro em `NaN`. | [array.md](../array.md#sumbyarray-fn) |

## `/async`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `new Promise((r) => setTimeout(r, ms))` (`sleep`, `delay`, `wait`) | `{ sleep }` from `@herowcode/utils/async` | `signal` opcional: abortar rejeita com `signal.reason` e limpa o timer. | Timers que sobrevivem a uma requisição cancelada ou componente desmontado. | [async.md](../async.md#sleepms-signal) |
| `Promise.race([work, timeoutPromise])` ou `setTimeout(() => controller.abort(), ms)` | `{ withTimeout }` from `@herowcode/utils/async` | Retorna um `AbortSignal` (`withTimeout(signal, timeoutMs)`) que também segue o seu signal; o motivo é um `TimeoutError`. `0`, negativo ou ausente significa sem timeout. | Timers vazando e requisições que continuam rodando depois que a corrida é perdida. | [async.md](../async.md#withtimeoutsignal-timeoutms) |
| `2 ** attempt * 1000`, `Math.min(...)` sem jitter | `{ backoffDelay }` from `@herowcode/utils/async` | Jitter igual entre metade e o atraso total; `baseMs` 100 e `maxMs` 3000 por padrão. | Clientes repetindo em sincronia e esperando sem limite. | [async.md](../async.md#backoffdelayattempt-options) |
| `Number(res.headers.get('retry-after')) * 1000` | `{ parseRetryAfterMs }` from `@herowcode/utils/async` | Entende segundos e datas HTTP, retorna milissegundos (`parseRetryAfterMs`); datas passadas dão `0`, lixo dá `undefined`. | Esperas `NaN` com a forma de data do header. | [async.md](../async.md#parseretryaftermsvalue-now) |
| Um loop `for` com `try/catch` e `sleep`, repetindo todo erro | `{ retry }` from `@herowcode/utils/async` | **Somente erros transitórios** (falhas de conexão, 408/429/500/502/503/504): um 400 ou um bug é lançado na hora. Passe `shouldRetry: () => true` para o comportamento antigo. `AbortError` nunca é repetido; `Retry-After` substitui o backoff. | Martelar um endpoint que respondeu 400/401/404 mais três vezes. | [async.md](../async.md#retryfn-options) |
| Loop `for` aguardando `Promise.all(items.slice(i, i + n).map(fn))` | `{ mapInChunks }` from `@herowcode/utils/async` | Lote após lote (não é janela deslizante); resultados mantêm a ordem; a primeira rejeição rejeita a chamada. | `Promise.all` sem limite sobre milhares de itens. | [async.md](../async.md#mapinchunksitems-chunksize-fn) |
| Wrapper estilo `p-limit` ou contador manual de tarefas em andamento | `{ createConcurrencyLimiter }` from `@herowcode/utils/async` | Fila FIFO; tarefa que rejeita ou lança libera o slot; `limit` menor que 1 vira 1. | Tarefa com falha vazando um slot e travando a fila. | [async.md](../async.md#createconcurrencylimiterlimit) |
| Guarda `let inflight: Promise<T> \| null` em volta de um refresh de token | `{ createSingleFlight }` from `@herowcode/utils/async` | O slot é limpo assim que a execução termina, antes dos que esperam retomarem; uma rejeição chega a todos e não é cacheada. Quem se junta ignora os próprios argumentos. | Um refresh que falhou ficando em cache para sempre, ou dez refreshes disparados por dez 401 paralelos. | [async.md](../async.md#createsingleflightfn) |

## `/auth`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `JSON.parse(atob(token.split('.')[1]))` | `{ decodeJWT }` from `@herowcode/utils/auth` | **Não verifica a assinatura.** Trata base64url e UTF-8; retorna `null` em vez de lançar. | Quebra com `-`/`_` e nomes acentuados; nunca use para autorizar. | [auth.md](../auth.md#decodejwttoken) |
| `payload.exp * 1000 < Date.now()` | `{ getJWTExp, isJWTExpired }` from `@herowcode/utils/auth` | `getJWTExp` retorna **segundos**; `isJWTExpired` falha fechado (`true`) para token malformado ou `exp` ausente. | Token sem `exp` contando como válido para sempre. | [auth.md](../auth.md#getjwtexptoken) |
| `isTokenExpiring(token, thresholdSeconds)` com margem calculada à mão | `{ isJWTExpiring }` from `@herowcode/utils/auth` | `{ marginSeconds }` (padrão 30); tokens expirados contam como expirando; falha fechado. | Segundos tratados como minutos (ou milissegundos) na margem. | [auth.md](../auth.md#isjwtexpiringtoken-options) |
| `header.replace('Bearer ', '')` ou `header.split(' ')[1]` | `{ extractBearerToken }` from `@herowcode/utils/auth` | O esquema não diferencia maiúsculas; só passa um par `Bearer <token>`; caso contrário `null`. | `Basic abc` ou header ausente sendo usado como token. | [auth.md](../auth.md#extractbearertokenheader) |

## `/br`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `value.replace(/(\d{5})(\d{3})/, '$1-$2')` | `{ formatCEP }` from `@herowcode/utils/br` | Exatamente 8 dígitos ou `fallback` (`""`); sem máscaras parciais. | `1234` meio formatado aparecendo em formulários. | [br.md](../br.md#formatcepvalue-options) |
| Regex de máscara mais função de dígito verificador | `{ formatCPF, isValidCPF }` from `@herowcode/utils/br` | `formatCPF` nunca valida (`111.111.111-11` é formatado); `isValidCPF` confere os dígitos e rejeita repetidos. Passe strings, não números. | `000.000.000-00` passando na validação; zeros à esquerda perdidos em números. | [br.md](../br.md#formatcpfvalue-options) |
| Máscara e validador de 14 dígitos | `{ formatCNPJ, isValidCNPJ }` from `@herowcode/utils/br` | Aceita o CNPJ alfanumérico (letras em maiúsculas); os dois últimos caracteres devem ser dígitos. | Rejeitar CNPJs alfanuméricos válidos emitidos a partir de julho de 2026. | [br.md](../br.md#formatcnpjvalue-options) |

## `/crypto`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `createHash('sha256').update(s).digest('hex')` | `{ sha256Hex }` from `@herowcode/utils/crypto` | WebCrypto, então retorna Promise: adicione `await`. A entrada é hasheada em UTF-8. | `node:crypto` e `Buffer` quebrando em edge runtimes e navegadores. | [crypto.md](../crypto.md#sha256hexdata) |
| `createHmac('sha256', key).update(data).digest('hex')` | `{ hmacSha256Hex }` from `@herowcode/utils/crypto` | Assíncrono (WebCrypto); a ordem dos argumentos é `(key, data)`; hex em minúsculas. | Mesma quebra em edge runtime; chave e dados trocados. | [crypto.md](../crypto.md#hmacsha256hexkey-data) |
| `a === b` em segredos, ou `timingSafeEqual` embrulhado em checagem de tamanho | `{ safeEqual }` from `@herowcode/utils/crypto` | **Síncrono** (retorna boolean), diferente de `verifyHmacSignature`; tamanhos diferentes retornam `false` em vez de lançar; não-strings retornam `false`. | Vazamento por tempo e `RangeError` com tamanhos diferentes. | [crypto.md](../crypto.md#safeequala-b) |
| Comparar `hmac(body) === header` depois de remover um prefixo | `{ verifyHmacSignature }` from `@herowcode/utils/crypto` | **Retorna Promise: sempre use `await`** (chamada sem await é truthy e aceita tudo). Aceita `{ encoding, prefix }`, hex maiúsculo e base64url, compara em tempo constante e retorna `false` em vez de lançar. | Webhooks aceitos por `if (verify(...))` sem `await`; vazamento por tempo; corpo re-serializado. | [crypto.md](../crypto.md#verifyhmacsignaturepayload-signature-secret-options) |
| `Math.random().toString(36)`, `uuid` como segredo | `{ generateOpaqueToken }` from `@herowcode/utils/crypto` | Retorna `{ token, hash }` (Promise); `bytes` padrão 32, base64url sem padding; guarde o hash. | Tokens previsíveis e tokens em texto puro guardados no banco. | [crypto.md](../crypto.md#generateopaquetokenbytes--32) |

## `/date`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `date.toISOString().slice(0, 10)` | `{ toISODate }` from `@herowcode/utils/date` | Usa um `timeZone` de calendário (**passe explicitamente em servidores**, que usam UTC por padrão); uma string `YYYY-MM-DD` pura volta como está; `fallback` para datas inválidas. | A data de amanhã depois das 21h no Brasil (o slice dá o dia UTC). | [date.md](../date.md#toisodatedate-options) |
| `new Date().toISOString().slice(0, 10)` | `{ getTodayISODate }` from `@herowcode/utils/date` | `getTodayISODate({ timeZone })`; `now` é injetável em testes. Sem `timeZone` usa o fuso do runtime, que é UTC na maioria dos servidores. | "Hoje" virando amanhã à noite. | [date.md](../date.md#gettodayisodateoptions) |
| `d.setDate(d.getDate() + n)`, `Math.round((a - b) / 86400000)` | `{ addDaysISO, diffDaysISO }` from `@herowcode/utils/date` | Conta de calendário nas partes A/M/D: o horário de verão não desloca o resultado. Entrada inválida retorna `fallback` (`""` e `NaN`). | Dias errados por um perto de mudanças de horário de verão e strings `Invalid Date`. | [date.md](../date.md#adddaysisoisodate-days-options) |
| `new Date('2026-01-01')` | `{ parseISODateLocal }` from `@herowcode/utils/date` | Meia-noite local em vez de meia-noite UTC; `fallback` (`null`) para dias malformados ou inexistentes. | Um valor só de data mostrando o dia anterior a oeste de UTC. | [date.md](../date.md#parseisodatelocalisodate-options) |
| `date.getHours()` e parsing de `toLocaleString` | `{ getZonedHour, getDatePartsInTimeZone }` from `@herowcode/utils/date` | Lê hora/partes em um `timeZone` explícito (meia-noite é `0`, nunca `24`); **passe `timeZone` em servidores**; fuso desconhecido lança `RangeError`. | Checagens de horário comercial rodando em UTC no servidor. | [date.md](../date.md#getzonedhourdate-options) |

## `/env`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `process.env.X!` ou `if (!process.env.X) throw new Error('Missing X')` | `{ requireEnv }` from `@herowcode/utils/env` | Só espaços conta como ausente; `minLength`; **em Workers não existe `process`: passe `{ env }`** ou lança `HEROW_ENV_NO_SOURCE`. Os erros têm código e nunca incluem o valor. | `undefined` entrando como string e erros "Missing X" sem ação possível. | [env.md](../env.md#requireenvname-options) |
| `process.env.X ?? 'default'` | `{ optionalEnv }` from `@herowcode/utils/env` | Valores vazios e só com espaços também usam o fallback; mesma regra de `{ env }` em Workers. | `X=` no `.env` sobrescrevendo o padrão com string vazia. | [env.md](../env.md#optionalenvname-fallback-options) |
| `process.env.X === 'true'` ou `Boolean(process.env.X)` | `{ parseBoolean }` from `@herowcode/utils/env` | Aceita `true/1/yes/y/on` e `false/0/no/n/off/""`, sem diferenciar maiúsculas; qualquer outra coisa lança, a menos que você passe `fallback`. | `"1"` ou `"TRUE"` lidos como falso; `"false"` lido como verdadeiro. | [env.md](../env.md#parsebooleanvalue-fallback) |

## `/errors`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `err instanceof Error ? err.message : String(err)` | `{ getErrorMessage }` from `@herowcode/utils/errors` | Lê `message`, `error`, `detail` (`keys` configurável); `{ fallback }` em vez de `"[object Object]"`. | `[object Object]` exibido para usuários. | [errors.md](../errors.md#geterrormessageerr-options) |
| `err.status ?? err.response?.status` | `{ getErrorStatus }` from `@herowcode/utils/errors` | Lê `status`, `statusCode`, `response.status`, também ao longo da cadeia de causas; `undefined` se nenhum. | Status perdidos atrás de um `cause` embrulhado. | [errors.md](../errors.md#geterrorstatuserr) |
| `while (e.cause) e = e.cause` | `{ getRootCause }` from `@herowcode/utils/errors` | Para em 10 elos e em ciclos; retorna a própria entrada se não há causa. | Loop infinito em cadeia de causas cíclica. | [errors.md](../errors.md#getrootcauseerr) |
| `class HttpError extends Error { statusCode }` | `{ HttpError, NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError, ConflictError, TooManyRequestsError, isHttpError }` from `@herowcode/utils/errors` | O campo é **`status`**, não `statusCode`; `isHttpError` e `instanceof` funcionam entre as cópias CJS/ESM do pacote; `TooManyRequestsError` carrega `retryAfterSeconds`. | `instanceof` falhando entre bundles; duas classes de erro incompatíveis. | [errors.md](../errors.md#httperror-and-subclasses) |
| `err.code === 'ECONNRESET' \|\| err instanceof TypeError` | `{ isTransientNetworkError }` from `@herowcode/utils/errors` | Olha através de `cause` (o `fetch failed` do Node); outros `TypeError` (URL inválida) não são transitórios; timeouts só com `{ includeTimeouts: true }`. | Repetir erros de programação, ou perder o código real dentro de `cause`. | [errors.md](../errors.md#istransientnetworkerrorerr-options) |
| `status >= 500` ou uma lista de status digitada à mão | `{ isTransientStatus, TRANSIENT_STATUS_CODES }` from `@herowcode/utils/errors` | Exatamente `408, 429, 500, 502, 503, 504`, compartilhado com `retry` e `apiClient`. | Repetir 501/505 ou desistir em 408/429. | [errors.md](../errors.md#istransientstatusstatus-and-transient_status_codes) |

## `/files`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `navigator.clipboard.writeText(text)` em um `try` | `{ copyToClipboard }` from `@herowcode/utils/files` | Cai para `execCommand('copy')`; resolve um boolean e nunca lança. Chame a partir de um gesto do usuário. | Clipboard falhando em silêncio em páginas HTTP e iframes. | [files.md](../files.md#copytoclipboardtext) |
| `createObjectURL` + `<a download>` + `click()` + `revokeObjectURL` | `{ downloadBlob }` from `@herowcode/utils/files` | Remove o link na hora e revoga a URL cerca de um segundo depois; retorna boolean. | Downloads cancelados por `revokeObjectURL` imediato no Safari e Firefox. | [files.md](../files.md#downloadblobblob-filename) |
| Wrappers `try { localStorage.getItem(k) } catch {}` | `{ safeStorage }` from `@herowcode/utils/files` | Cai para memória em SSR, modo privado e erro de cota; `set` retorna `false` quando só a memória guardou; `getJSON(key, { fallback })`. | `SecurityError` e `QuotaExceededError` quebrando a renderização. | [files.md](../files.md#safestoragekind) |
| `rows.map((r) => r.join(',')).join('\n')` | `{ toCSV }` from `@herowcode/utils/files` | Aspas RFC 4180, quebras `CRLF`, `bom` e `delimiter` opcionais; **neutralização de fórmulas**: células iniciadas por `=`, `+`, `-`, `@` ganham um `'` na frente (desative com `neutralizeFormulas: false`). | Colunas quebradas por vírgulas e aspas; injeção de `=HYPERLINK(...)`. | [files.md](../files.md#tocsvrows-options) |

## `/function`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `typeof window !== 'undefined'` | `{ isBrowser, isServer }` from `@herowcode/utils/function` | Chamadas de função (`isBrowser()`), verdadeiro só com `window` e `document`. | React Native (que define `window`) contado como navegador. | [function.md](../function.md#isbrowser--isserver) |
| `try { return JSON.parse(x) } catch { return fallback }` | `{ safeJsonParse }` from `@herowcode/utils/function` | Opção `{ fallback }`; `false`, `0` e `null` válidos voltam como foram parseados. | Um `0` ou `false` válido substituído pelo padrão. | [function.md](../function.md#safejsonparsetext-options) |
| Helpers `Result<T>` no formato `{ ok, data } \| { ok, error }` ou tuplas `[err, data]` | `{ tryCatchResult }` from `@herowcode/utils/function` | Discriminado por `ok`, sem argumento de dados padrão; veja "Which result shape to use" na doc de function (`tryCatch` é `{ data, error }`). | `data` sendo `null` escondendo se a chamada falhou. | [function.md](../function.md#trycatchresultfn) |

## `/http`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `headers.set('Access-Control-Allow-Origin', req.headers.get('origin') ?? '*')` | `{ corsHeaders }` from `@herowcode/utils/http` | Só repete origens da sua lista (match exato) e adiciona `Vary: Origin`; `credentials: true` com `origin: '*'` lança `HEROW_CORS_CREDENTIALS_WILDCARD`. | Qualquer site lendo respostas com credenciais. | [http.md](../http.md#corsheadersrequest-options) |
| `if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers })` | `{ preflight }` from `@herowcode/utils/http` | Retorna `204` para `OPTIONS` e `null` caso contrário; repete os headers pedidos quando `headers` não é definido. | Preflights falhando com headers customizados. | [http.md](../http.md#preflightrequest-options) |
| `new Response(JSON.stringify(x), { headers })` | `{ jsonResponse }` from `@herowcode/utils/http` | Define `Content-Type: application/json` (o seu vence); `undefined` vai como `null`; `204/205/304` ficam sem corpo. | `TypeError` por corpo em um 204; content type ausente. | [http.md](../http.md#jsonresponsedata-init) |
| `fetch` + `AbortController` + `setTimeout` | `{ fetchWithTimeout }` from `@herowcode/utils/http` | Terceiro argumento `{ timeoutMs }`; aborta com `TimeoutError`; seu próprio `signal` continua funcionando. | Requisições penduradas e timers deixados rodando. | [http.md](../http.md#fetchwithtimeoutinput-init--timeoutms-) |
| `const res = await fetch(url); return res.json()` | `{ fetchJson }` from `@herowcode/utils/http` | Lança subclasses de `HttpError` em não-2xx (`status`, `code`, `details`), `HEROW_INVALID_JSON` em 2xx que não é JSON, sem retries; resolve `undefined` para corpo vazio. Use `apiClient` para `{ data, error }`. | `SyntaxError` opaco com página de erro HTML; códigos de status perdidos. | [http.md](../http.md#fetchjsontinput-init--timeoutms-) |

## `/logger`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| Cadeias de `.replace(/Bearer .../)` em reporters de erro | `{ redactSecrets }` from `@herowcode/utils/logger` | Também mascara JWTs, pares `key=value`, linhas `Cookie:` e prefixos comuns de chaves de API; tempo linear; `extraPatterns` para os seus. | Tokens vazando em mensagens de erro e URLs. | [logger.md](../logger.md#redaction-helpers-redactsecrets-and-redactdeep) |
| Um helper recursivo "mascare estas chaves" | `{ redactDeep }` from `@herowcode/utils/logger` | Cópia, nunca muta; trata arrays, ciclos (`[Circular]`), `Error`s, `maxDepth`; limpa strings também. | Segredos dentro de arrays ou strings de mensagem, e estouro de pilha em ciclos. | [logger.md](../logger.md#redaction-helpers-redactsecrets-and-redactdeep) |

## `/number`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `formatBRL(value)` feito com `toLocaleString` ou concatenação de strings | `{ formatCurrency }` from `@herowcode/utils/number` | **O espaço depois de `R$` é um espaço não separável (U+00A0)**, então snapshots com espaço digitado falham; `fromCents` substitui `value / 100`; entrada inválida dá `fallback`. | `R$ NaN` e centavos de ponto flutuante exibidos a usuários. | [number.md](../number.md#formatcurrencyvalue-options) |
| `n.toLocaleString('pt-BR', ...)` | `{ formatNumber }` from `@herowcode/utils/number` | Padrão pt-BR, `decimals`, `compact` e `fallback`. | `NaN` impresso na UI. | [number.md](../number.md#formatnumbervalue-options) |
| `` `${n.toFixed(1)}%` `` ou `style: 'percent'` com `/ 100` | `{ formatPercent }` from `@herowcode/utils/number` | A entrada já está em unidades de percentual (`25` é 25%), igual ao retorno de `percentOf`. | Percentuais errados por um fator de 100. | [number.md](../number.md#formatpercentvalue-options) |
| `(part / total) * 100` | `{ percentOf }` from `@herowcode/utils/number` | `total` igual a `0` ou entrada não finita retorna `fallback` (padrão `0`); `decimals` opcional. | `NaN` e `Infinity` com total vazio. | [number.md](../number.md#percentofpart-total-options) |
| `parseFloat(s.replace('.', '').replace(',', '.'))` | `{ parseLocaleNumber }` from `@herowcode/utils/number` | O locale decide os separadores (padrão pt-BR; `"0.5"` é rejeitado ali); aceita símbolos de moeda, NBSP, `%` e negativos entre parênteses; retorna `NaN`, nunca lança; `asCents`. | `"12abc"` virando 12 e só o primeiro ponto de milhar removido. | [number.md](../number.md#parselocalenumbertext-options) |
| `Number(x) \|\| 0`, `parseInt(x, 10) \|\| 0` | `{ toNumber }` from `@herowcode/utils/number` | Nunca `NaN` ou `Infinity`; `""` usa o fallback; `"1,5"` não é parseado; `{ fallback, integer }`. | `\|\| 0` engolindo uma escolha legítima de fallback; `""` virando `0`. | [number.md](../number.md#tonumbervalue-options) |

## `/phone`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| `value.replace(/\D/g, '')` | `{ onlyDigits }` from `@herowcode/utils/phone` | `null`, `undefined` e não-números dão `""`; números finitos são convertidos em string. | `TypeError` com telefone ausente. | [phone.md](../phone.md#onlydigitsvalue) |
| Remover não-dígitos e prefixar `55` | `{ normalizePhone }` from `@herowcode/utils/phone` | Valida o formato (DDD, 8 ou 9 dígitos), trata `+55`, `0055`, o zero de tronco e `US`; retorna E.164 ou `fallback` (`null`). | Códigos de país duplicados `5555...` e qualquer tamanho aceito. | [phone.md](../phone.md#normalizephoneinput-options) |
| Regexes de máscara que assumem 11 dígitos | `{ formatPhone }` from `@herowcode/utils/phone` | Normaliza primeiro, escolhe o layout de 8 ou 9 dígitos, `international` opcional; `fallback` (`""`) caso contrário. | Fixos meio formatados e números com código de país. | [phone.md](../phone.md#formatphoneinput-options) |
| Lógica manual com `slice` adicionando ou removendo o 9º dígito | `{ getBRMobileVariants }` from `@herowcode/utils/phone` | Retorna as duas grafias E.164 (com o 9 primeiro); fixos retornam uma entrada; entrada inválida retorna `[]`. | Contatos não encontrados por estarem salvos sem o 9º dígito. | [phone.md](../phone.md#getbrmobilevariantsinput) |
| `` `https://wa.me/${phone}?text=${msg}` `` | `{ buildWhatsAppLink }` from `@herowcode/utils/phone` | Normaliza para só dígitos (sem `+`), codifica a mensagem na URL, `fallback` (`""`) para números inválidos. | Mensagens sem encode e links que o `wa.me` rejeita. | [phone.md](../phone.md#buildwhatsapplinkphone-options) |

## `/string`

| Padrão local | Import | Diferenças de comportamento | Bug que corrige | Docs |
|---|---|---|---|---|
| Cadeias `.replace(/&/g, '&amp;').replace(/</g, '&lt;')...` | `{ escapeHtml }` from `@herowcode/utils/string` | Escapa os cinco caracteres (`& < > " '`) de uma vez; escapa texto, não sanitiza HTML. | `&` escapado duas vezes e atributos com aspas simples quebrados. | [string.md](../string.md#escapehtmltext) |
| `s.replace(/[.*+?^${}()\|[\]\\]/g, '\\$&')` | `{ escapeRegExp }` from `@herowcode/utils/string` | Mesmo escape do snippet da MDN; não-strings dão `""`. | Entrada do usuário lida como sintaxe de regex. | [string.md](../string.md#escaperegexptext) |
| `name.split(' ').map((w) => w[0]).slice(0, 2).join('')` | `{ getInitials }` from `@herowcode/utils/string` | Primeira e última palavra (`Maria da Silva` é `MS`), `{ max, fallback }`. | `MD` para `Maria da Silva`, e quebra em nomes vazios. | [string.md](../string.md#getinitialsname-options) |
| `s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` | `{ normalizeText, removeAccents }` from `@herowcode/utils/string` | `removeAccents` mantém caixa e pontuação; `normalizeText` também põe em minúsculas, remove pontuação e colapsa espaços (letras não latinas como CJK são removidas). | Busca e comparações sensíveis a acento. | [string.md](../string.md#normalizetexttext) |
| `` `${n} item${n === 1 ? '' : 's'}` `` | `{ pluralize }` from `@herowcode/utils/string` | Retorna só a palavra (singular quando `n` é 1 ou -1); plural customizado como terceiro argumento; regras no estilo inglês. | "1 items" e ternários ad-hoc por todo lado. | [string.md](../string.md#pluralizecount-singular-plural) |

---

[← Voltar ao README](README.md)
