/**
 * Builds the A-Z "find a helper" table from the built package and writes it between
 * the helper-index markers of README.md and docs/pt-br/README.md.
 * `node scripts/generate-index.cjs` checks for drift; add `--write` to regenerate.
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const START = "<!-- helper-index:start -->"
const END = "<!-- helper-index:end -->"
const TARGETS = [
  { file: "README.md", lang: "en", docs: "docs/" },
  { file: "docs/pt-br/README.md", lang: "pt", docs: "../" },
]
const HEADS = {
  en: ["Helper", "Import from", "Docs"],
  pt: ["Helper", "Importar de", "Docs"],
}

function requireFiles(condition, found) {
  if (typeof condition === "string") {
    if (condition.endsWith(".cjs")) found.add(condition)
    return
  }
  for (const value of Object.values(condition ?? {})) requireFiles(value, found)
}

function collect() {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
  )
  const rows = []
  for (const [key, condition] of Object.entries(pkg.exports)) {
    if (key === ".") continue
    const files = new Set()
    requireFiles(condition, files)
    const names = new Set()
    for (const file of files) {
      const target = path.join(ROOT, file)
      if (!fs.existsSync(target)) {
        throw new Error(`${file} is missing. Run \`pnpm build\` first.`)
      }
      for (const name of Object.keys(require(target))) {
        if (name !== "default" && !name.startsWith("__")) names.add(name)
      }
    }
    for (const name of names) rows.push({ name, sub: key.slice(2) })
  }
  const lower = (value) => value.toLowerCase()
  return rows.sort(
    (a, b) =>
      (lower(a.name) < lower(b.name)
        ? -1
        : lower(a.name) > lower(b.name)
          ? 1
          : 0) || (a.sub < b.sub ? -1 : a.sub > b.sub ? 1 : 0),
  )
}

function render(rows, { lang, docs }) {
  const head = HEADS[lang]
  const lines = [
    `| ${head.join(" | ")} |`,
    "|---|---|---|",
    ...rows.map(
      ({ name, sub }) =>
        `| \`${name}\` | \`@herowcode/utils/${sub}\` | [${sub}.md](${docs}${sub}.md) |`,
    ),
  ]
  return `${START}\n${lines.join("\n")}\n${END}`
}

function replaceBlock(text, block, file) {
  const start = text.indexOf(START)
  const end = text.indexOf(END)
  if (start < 0 || end < start) {
    throw new Error(`${file}: helper-index markers not found`)
  }
  return text.slice(0, start) + block + text.slice(end + END.length)
}

/** Returns the files whose index block differs from the built package (writes them when `write`). */
function sync({ write = false } = {}) {
  const rows = collect()
  const drifted = []
  for (const target of TARGETS) {
    const full = path.join(ROOT, target.file)
    const current = fs.readFileSync(full, "utf8")
    const next = replaceBlock(current, render(rows, target), target.file)
    if (next === current) continue
    drifted.push(target.file)
    if (write) fs.writeFileSync(full, next)
  }
  return drifted
}

module.exports = { collect, sync }

if (require.main === module) {
  const write = process.argv.includes("--write")
  const drifted = sync({ write })
  if (write) {
    console.log(
      drifted.length
        ? `✔ updated ${drifted.join(", ")}`
        : "✔ helper index already up to date",
    )
  } else if (drifted.length) {
    console.error(
      `Helper index is out of date in ${drifted.join(", ")}. Run \`node scripts/generate-index.cjs --write\` after \`pnpm build\`.`,
    )
    process.exit(1)
  } else {
    console.log("✔ helper index is up to date")
  }
}
