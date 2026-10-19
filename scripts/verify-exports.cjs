const assert = require("node:assert/strict")
const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")
const { pathToFileURL } = require("node:url")

const ROOT = path.resolve(__dirname, "..")
const DIST = path.join(ROOT, "dist")
const PKG_PATH = path.join(ROOT, "package.json")

if (!fs.existsSync(DIST)) {
  throw new Error(
    "dist/ was not found. Run `pnpm build` before `pnpm test:exports`.",
  )
}

const pkg = JSON.parse(fs.readFileSync(PKG_PATH, "utf8"))

const expectedExports = {
  [`${pkg.name}/async`]: [
    "backoffDelay",
    "createConcurrencyLimiter",
    "createSingleFlight",
    "mapInChunks",
    "parseRetryAfterMs",
    "retry",
    "sleep",
    "withTimeout",
  ],
  [`${pkg.name}/auth`]: [
    "decodeJWT",
    "extractBearerToken",
    "getJWTExp",
    "isJWTExpired",
    "isJWTExpiring",
  ],
  [`${pkg.name}/crypto`]: [
    "generateOpaqueToken",
    "hmacSha256Hex",
    "safeEqual",
    "sha256Hex",
    "verifyHmacSignature",
  ],
  [`${pkg.name}/env`]: ["optionalEnv", "parseBoolean", "requireEnv"],
  [`${pkg.name}/errors`]: [
    "BadRequestError",
    "ConflictError",
    "ForbiddenError",
    "HttpError",
    "NotFoundError",
    "TRANSIENT_STATUS_CODES",
    "TooManyRequestsError",
    "UnauthorizedError",
    "getErrorMessage",
    "getErrorStatus",
    "getRootCause",
    "isHttpError",
    "isTransientNetworkError",
    "isTransientStatus",
  ],
  [`${pkg.name}/files`]: [
    "compressImage",
    "copyToClipboard",
    "downloadBlob",
    "downloadUrl",
    "fileDelete",
    "fileExists",
    "formatBytes",
    "safeStorage",
    "toCSV",
  ],
  [`${pkg.name}/number`]: [
    "formatCurrency",
    "formatNumber",
    "formatPercent",
    "parseLocaleNumber",
    "percentOf",
    "toNumber",
  ],
  [`${pkg.name}/youtube`]: [
    "extractYouTubeId",
    "generateYoutubeURL",
    "getYoutubeThumbnail",
    "getYoutubeVideoDuration",
    "getYoutubeVideoInfo",
    "validateYoutubeLink",
  ],
}

assert.equal(pkg.type, "module", 'package.json must declare `"type": "module"`')

for (const typesPath of collectTypePaths(pkg.exports)) {
  const resolvedPath = path.join(ROOT, typesPath)
  assert.ok(
    fs.existsSync(resolvedPath),
    `Missing declaration target: ${typesPath}`,
  )
}

for (const [specifier, expectedKeys] of Object.entries(expectedExports)) {
  assertModuleExports(specifier, expectedKeys)
  assertModuleExports(specifier, expectedKeys, ["browser"])
}

// These entries must stay dependency-free so consumers never pull pino, dayjs or node builtins through them.
const DEPENDENCY_FREE_ENTRIES = [
  "index.js",
  "index.cjs",
  "array/index.js",
  "array/index.cjs",
  "async/index.js",
  "async/index.cjs",
  "auth/index.js",
  "auth/index.cjs",
  "crypto/index.js",
  "crypto/index.cjs",
  "date/date-only.js",
  "date/date-only.cjs",
  "env/index.js",
  "env/index.cjs",
  "errors/index.js",
  "errors/index.cjs",
  "function/index.js",
  "function/index.cjs",
  "number/index.js",
  "number/index.cjs",
  "string/index.js",
  "string/index.cjs",
]

for (const entry of DEPENDENCY_FREE_ENTRIES) {
  const external = collectExternalImports(path.join(DIST, entry))
  assert.deepEqual(
    external,
    [],
    `dist/${entry} must not import external modules, found: ${external.join(", ")}`,
  )
}

// Universal entries are loaded in an EdgeVM (no Node globals, no require of builtins) and smoke-called.
// Append { entry, smoke } to extend; `smoke` receives the loaded module.
const universalEntries = [
  {
    entry: "index.cjs",
    smoke: (m) => {
      assert.equal(m.slugify("Olá Mundo"), "ola-mundo")
      assert.equal(m.formatSecondsToHMS(61), "01:01")
    },
  },
  {
    entry: "array/index.cjs",
    smoke: (m) => assert.equal(JSON.stringify(m.unique([1, 1, 2])), "[1,2]"),
  },
  {
    entry: "async/index.cjs",
    smoke: async (m) => {
      assert.equal(m.parseRetryAfterMs("2"), 2000)
      const run = m.createSingleFlight(async () => 1)
      assert.equal(await run(), 1)
    },
  },
  {
    entry: "auth/index.cjs",
    smoke: (m) => {
      const token = `e30.${btoa('{"exp":1}')}.s`
      assert.equal(m.getJWTExp(token), 1)
      assert.equal(m.isJWTExpired(token), true)
      assert.equal(m.extractBearerToken("Bearer abc"), "abc")
    },
  },
  {
    entry: "crypto/index.cjs",
    smoke: async (m) => {
      assert.equal(m.safeEqual("a", "a"), true)
      assert.equal(
        await m.sha256Hex("abc"),
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      )
      assert.equal(
        await m.verifyHmacSignature(
          "what do ya want for nothing?",
          "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
          "Jefe",
        ),
        true,
      )
    },
  },
  {
    entry: "date/date-only.cjs",
    smoke: (m) =>
      assert.equal(
        m.toISODate(new Date("2026-01-02T01:30:00Z"), {
          timeZone: "America/Sao_Paulo",
        }),
        "2026-01-01",
      ),
  },
  {
    entry: "env/index.cjs",
    smoke: (m) => {
      assert.equal(m.parseBoolean("yes"), true)
      assert.equal(m.requireEnv("A", { env: { A: "x" } }), "x")
      assert.throws(() => m.requireEnv("A"), { code: "HEROW_ENV_NO_SOURCE" })
    },
  },
  {
    entry: "errors/index.cjs",
    smoke: (m) => {
      assert.equal(m.getErrorMessage({ error: "x" }), "x")
      assert.equal(m.isTransientStatus(503), true)
      assert.equal(m.isHttpError(new m.NotFoundError()), true)
    },
  },
  {
    entry: "function/index.cjs",
    smoke: (m) => assert.equal(typeof m.debounce(() => {}, 1), "function"),
  },
  {
    entry: "number/index.cjs",
    smoke: (m) => {
      assert.equal(m.toNumber("12.5"), 12.5)
      assert.equal(m.parseLocaleNumber("1.234,56"), 1234.56)
      assert.match(m.formatCurrency(1234.5), /1\.234,50$/)
    },
  },
  {
    entry: "string/index.cjs",
    smoke: (m) => assert.equal(m.capitalize("hello"), "Hello"),
  },
]

async function main() {
  for (const { entry, smoke } of universalEntries) {
    try {
      await smoke(loadInEdgeVM(path.join(DIST, entry)))
    } catch (error) {
      throw new Error(`dist/${entry} failed in EdgeVM: ${error.message}`, {
        cause: error,
      })
    }
  }

  await assertHttpErrorCrossBundle()
  console.log("✔ built package exports verified")
}

// The CJS and ESM builds are two distinct HttpError classes; the brand must make them recognise each other.
async function assertHttpErrorCrossBundle() {
  const cjs = require(path.join(DIST, "errors/index.cjs"))
  const esm = await import(
    pathToFileURL(path.join(DIST, "errors/index.js")).href
  )
  assert.notEqual(cjs.HttpError, esm.HttpError)
  const fromCjs = new cjs.NotFoundError("x")
  const fromEsm = new esm.TooManyRequestsError("y", { retryAfterSeconds: 3 })
  assert.ok(fromCjs instanceof esm.HttpError)
  assert.ok(fromCjs instanceof esm.NotFoundError)
  assert.ok(!(fromCjs instanceof esm.ConflictError))
  assert.ok(fromEsm instanceof cjs.TooManyRequestsError)
  assert.ok(esm.isHttpError(fromCjs) && cjs.isHttpError(fromEsm))
  assert.equal(esm.getErrorStatus(fromCjs), 404)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

function loadInEdgeVM(entryFile) {
  const { EdgeVM } = require("@edge-runtime/vm")
  const vm = new EdgeVM()
  const cache = new Map()

  const load = (file) => {
    if (cache.has(file)) return cache.get(file).exports
    const module = { exports: {} }
    cache.set(file, module)
    const wrapper = vm.evaluate(
      `(function (module, exports, require) {${fs.readFileSync(file, "utf8")}\n})`,
    )
    wrapper(module, module.exports, (specifier) => {
      if (!specifier.startsWith(".")) {
        throw new Error(`requires external module "${specifier}"`)
      }
      return load(path.resolve(path.dirname(file), specifier))
    })
    return module.exports
  }

  return load(entryFile)
}

function collectTypePaths(node, found = new Set()) {
  if (!node || typeof node !== "object") {
    return [...found]
  }

  if (typeof node.types === "string") {
    found.add(node.types)
  }

  for (const value of Object.values(node)) {
    collectTypePaths(value, found)
  }

  return [...found]
}

function collectExternalImports(file, seen = new Set(), found = new Set()) {
  if (seen.has(file)) return [...found]
  seen.add(file)
  const source = fs.readFileSync(file, "utf8")
  const pattern =
    /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\(\s*|\bimport\s+)["']([^"']+)["']/g
  for (const [, specifier] of source.matchAll(pattern)) {
    if (specifier.startsWith(".")) {
      collectExternalImports(
        path.resolve(path.dirname(file), specifier),
        seen,
        found,
      )
    } else {
      found.add(specifier)
    }
  }
  return [...found].sort()
}

function assertModuleExports(specifier, expectedKeys, conditions = []) {
  const actualKeys = getModuleKeys(specifier, conditions)
  assert.deepEqual(
    actualKeys,
    [...expectedKeys].sort(),
    `Unexpected exports for ${formatLabel(specifier, conditions)}`,
  )
}

function getModuleKeys(specifier, conditions) {
  const args = [
    ...conditions.flatMap((condition) => ["--conditions", condition]),
    "--input-type=module",
    "-e",
    `const mod = await import(${JSON.stringify(specifier)}); console.log(JSON.stringify(Object.keys(mod).sort()))`,
  ]

  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: "utf8",
  })

  if (result.status !== 0) {
    throw new Error(
      `Failed to import ${formatLabel(specifier, conditions)}\n${result.stderr || result.stdout}`,
    )
  }

  return JSON.parse(result.stdout.trim())
}

function formatLabel(specifier, conditions) {
  if (conditions.length === 0) {
    return specifier
  }

  return `${specifier} (${conditions.join(",")})`
}
