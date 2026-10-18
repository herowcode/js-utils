const assert = require("node:assert/strict")
const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")

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
  [`${pkg.name}/files`]: [
    "compressImage",
    "downloadUrl",
    "fileDelete",
    "fileExists",
    "formatBytes",
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
for (const entry of [
  "index.js",
  "index.cjs",
  "array/index.js",
  "function/index.js",
  "string/index.js",
  "string/index.cjs",
]) {
  const external = collectExternalImports(path.join(DIST, entry))
  assert.deepEqual(
    external,
    [],
    `dist/${entry} must not import external modules, found: ${external.join(", ")}`,
  )
}

console.log("✔ built package exports verified")

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
