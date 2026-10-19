const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { sync } = require("./generate-index.cjs")

const ROOT = path.resolve(__dirname, "..")
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8")

// Exports added in the extract-duplicate-helpers series; each needs a row in both guides.
const GUIDED_EXPORTS = [
  "BadRequestError",
  "ConflictError",
  "ForbiddenError",
  "HttpError",
  "NotFoundError",
  "TRANSIENT_STATUS_CODES",
  "TooManyRequestsError",
  "UnauthorizedError",
  "addDaysISO",
  "backoffDelay",
  "buildPageMeta",
  "buildWhatsAppLink",
  "chunk",
  "copyToClipboard",
  "corsHeaders",
  "createConcurrencyLimiter",
  "createSingleFlight",
  "decodeJWT",
  "diffDaysISO",
  "downloadBlob",
  "escapeHtml",
  "escapeRegExp",
  "extractBearerToken",
  "fetchJson",
  "fetchWithTimeout",
  "formatCEP",
  "formatCNPJ",
  "formatCPF",
  "formatCurrency",
  "formatNumber",
  "formatPercent",
  "formatPhone",
  "generateOpaqueToken",
  "getBRMobileVariants",
  "getDatePartsInTimeZone",
  "getErrorMessage",
  "getErrorStatus",
  "getInitials",
  "getJWTExp",
  "getOffset",
  "getRootCause",
  "getTodayISODate",
  "getZonedHour",
  "groupBy",
  "hmacSha256Hex",
  "isBrowser",
  "isHttpError",
  "isJWTExpired",
  "isJWTExpiring",
  "isServer",
  "isTransientNetworkError",
  "isTransientStatus",
  "isValidCNPJ",
  "isValidCPF",
  "jsonResponse",
  "keyBy",
  "mapInChunks",
  "normalizePhone",
  "normalizeText",
  "onlyDigits",
  "optionalEnv",
  "parseBoolean",
  "parseISODateLocal",
  "parseLocaleNumber",
  "parseRetryAfterMs",
  "percentOf",
  "pluralize",
  "preflight",
  "redactDeep",
  "redactSecrets",
  "removeAccents",
  "requireEnv",
  "retry",
  "safeEqual",
  "safeJsonParse",
  "safeStorage",
  "sha256Hex",
  "sleep",
  "sumBy",
  "toCSV",
  "toISODate",
  "toNumber",
  "tryCatchResult",
  "verifyHmacSignature",
  "withTimeout",
]
const GUIDES = [
  {
    file: "docs/replacing-local-copies.md",
    docs: "docs/",
    readme: "README.md",
  },
  {
    file: "docs/pt-br/replacing-local-copies.md",
    docs: "docs/",
    readme: "docs/pt-br/README.md",
  },
]

// GitHub heading slugs, with the -1/-2 suffix for repeated headings.
function slugs(markdown) {
  const seen = new Map()
  const result = new Set()
  let fenced = false
  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) fenced = !fenced
    const match = !fenced && line.match(/^#{1,6}\s+(.*)$/)
    if (!match) continue
    const base = match[1]
      .trim()
      .replace(/`/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_ -]/gu, "")
      .replace(/ /g, "-")
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    result.add(count ? `${base}-${count}` : base)
  }
  return result
}

const pkg = JSON.parse(read("package.json"))
const subpaths = Object.keys(pkg.exports)
  .filter((key) => key !== ".")
  .map((key) => key.slice(2))

const drifted = sync()
assert.deepEqual(
  drifted,
  [],
  `Helper index is out of date in ${drifted.join(", ")}. Run \`node scripts/generate-index.cjs --write\` after \`pnpm build\`.`,
)

for (const { readme } of GUIDES) {
  const text = read(readme)
  for (const sub of subpaths) {
    assert.ok(
      text.includes(`| \`/${sub}\` |`),
      `${readme}: Modules table has no row for /${sub}`,
    )
  }
}

for (const sub of subpaths) {
  const doc = read(`docs/${sub}.md`)
  for (const needle of ["Replacing a local copy", "Invalid input returns"]) {
    assert.ok(doc.includes(needle), `docs/${sub}.md has no "${needle}"`)
  }
}

const anchorCache = new Map()
for (const { file } of GUIDES) {
  const guide = read(file)
  for (const name of GUIDED_EXPORTS) {
    assert.match(
      guide,
      new RegExp(`[^A-Za-z0-9_]${name}[^A-Za-z0-9_]`),
      `${file} has no row for ${name}`,
    )
  }
  for (const [, target, hash] of guide.matchAll(
    /\]\(((?:\.\.\/)?[a-z-]+\.md)#([^)]+)\)/g,
  )) {
    const resolved = path.posix.normalize(
      path.posix.join(path.posix.dirname(file), target),
    )
    if (!anchorCache.has(resolved))
      anchorCache.set(resolved, slugs(read(resolved)))
    assert.ok(
      anchorCache.get(resolved).has(hash),
      `${file}: #${hash} does not exist in ${resolved}`,
    )
  }
}

const codes = new Set()
const walk = (dir) => {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), {
    withFileTypes: true,
  })) {
    const rel = path.posix.join(dir, entry.name)
    if (entry.isDirectory()) walk(rel)
    else if (/\.ts$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) {
      for (const code of read(rel).match(/HEROW_[A-Z_]+/g) ?? [])
        codes.add(code)
    }
  }
}
walk("src")
const errorsDoc = read("docs/errors.md")
for (const code of codes) {
  assert.ok(
    errorsDoc.includes(`## ${code}\n`),
    `docs/errors.md has no "## ${code}" section`,
  )
}

console.log("✔ docs verified (index, guides, anchors, error codes)")
