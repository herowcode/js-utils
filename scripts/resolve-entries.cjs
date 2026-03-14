/**
 * Shared entry/export resolver — scans src/ and derives:
 *   - tsup `entry` object
 *   - package.json `exports` map
 *
 * Convention
 * ──────────
 *   src/index.ts                 → "."
 *   src/{cat}/index.ts           → "./{cat}"     (fallback condition)
 *   src/{cat}/index.{env}.ts     → "./{cat}"  +  "{env}" condition
 *
 * Adding a new category or a new index.{env}.ts file is all that's needed –
 * no manual edits to tsup.config.ts or package.json.
 */

// @ts-check
const fs = require("node:fs")
const path = require("node:path")

const SRC = path.resolve(__dirname, "../src")

/** Variant names that get a dedicated export condition (order matters for resolution). */
const CONDITION_VARIANTS = ["browser", "node"]

/**
 * Returns every `src/{cat}/index*.ts` file as a tsup entry map.
 * @returns {Record<string, string>}
 */
function buildEntries() {
  /** @type {Record<string,string>} */
  const entries = {}

  const rootIndex = path.join(SRC, "index.ts")
  if (fs.existsSync(rootIndex)) {
    entries["index"] = rootIndex
  }

  const dirs = fs
    .readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  for (const dir of dirs) {
    const dirPath = path.join(SRC, dir)
    const files = fs.readdirSync(dirPath)

    for (const file of files) {
      if (!file.endsWith(".ts") || file.endsWith(".d.ts") || file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue
      const base = file.replace(/\.tsx?$/, "") // "index" | "index.node" | "index.browser"
      if (!base.startsWith("index")) continue

      const entryKey = `${dir}/${base}`
      entries[entryKey] = path.join(dirPath, file)
    }
  }

  return entries
}

/**
 * Builds the full package.json `exports` map from the same file scan.
 * @returns {Record<string, unknown>}
 */
function buildExports() {
  /** @type {Record<string, unknown>} */
  const exports_ = {}

  const rootIndex = path.join(SRC, "index.ts")
  if (fs.existsSync(rootIndex)) {
    exports_["."] = makeConditions("index")
  }

  const dirs = fs
    .readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  for (const dir of dirs) {
    const dirPath = path.join(SRC, dir)
    const files = fs.readdirSync(dirPath)

    // Collect all index variants present for this category
    /** @type {string[]} */
    const variants = []
    for (const file of files) {
      if (!file.endsWith(".ts") || file.endsWith(".d.ts") || file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue
      const base = file.replace(/\.tsx?$/, "")
      if (base.startsWith("index")) variants.push(base)
    }

    // A dir is a valid module if it has any index variant (not just index.ts)
    const hasAnyIndex = variants.some((v) => v === "index" || v.startsWith("index."))
    if (!hasAnyIndex) continue

    const subpath = `./${dir}`

    // Condition variants (e.g. "browser", "node") come first
    const conditionVariants = CONDITION_VARIANTS.filter((v) => variants.includes(`index.${v}`))
    // Unknown extra variants also get a condition based on their suffix
    const extraVariants = variants
      .filter((v) => v !== "index" && !CONDITION_VARIANTS.map((c) => `index.${c}`).includes(v))
      .map((v) => v.replace(/^index\./, ""))

    /** @type {Record<string, unknown>} */
    const entry = {}

    for (const cond of conditionVariants) {
      entry[cond] = makeConditions(`${dir}/index.${cond}`)
    }
    for (const cond of extraVariants) {
      entry[cond] = makeConditions(`${dir}/index.${cond}`)
    }

    // Fallback (no condition) — only when a plain index.ts exists
    if (variants.includes("index")) {
      const fallback = makeConditions(`${dir}/index`)
      entry["import"] = fallback["import"]
      entry["require"] = fallback["require"]
    }

    exports_[subpath] = entry
  }

  return exports_
}

/**
 * Produces the `{ import: { types, default }, require: { types, default } }` shape
 * for a given dist base name (e.g. "files/index.browser").
 * @param {string} base
 */
function makeConditions(base) {
  return {
    import: {
      types: `./dist/${base}.d.ts`,
      default: `./dist/${base}.js`,
    },
    require: {
      types: `./dist/${base}.d.cts`,
      default: `./dist/${base}.cjs`,
    },
  }
}

module.exports = { buildEntries, buildExports }
