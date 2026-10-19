const fs = require("node:fs")
const path = require("node:path")
const modules = require("./universal-modules.cjs")
const files = require("./universal-files.cjs")

const SRC = path.resolve(__dirname, "..", "src")
const BANNED = /(?<!globalThis\.)\b(Buffer|process)\b/
const TEST_FILE = /\.(test|golden\.test|spec)\.tsx?$|\.d\.ts$/
const NODE_ONLY_FILE =
  /(^|[/\\])index\.(node|browser)\.ts$|-(node|browser)-fallback\.ts$/

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\/.*$/gm, "")
}

function listSources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory())
      return entry.name === "__golden__" ? [] : listSources(full)
    return /\.tsx?$/.test(entry.name) &&
      !TEST_FILE.test(entry.name) &&
      !NODE_ONLY_FILE.test(full)
      ? [full]
      : []
  })
}

const violations = []
function scan(file) {
  stripComments(fs.readFileSync(file, "utf8"))
    .split("\n")
    .forEach((line, i) => {
      const hit = line.match(BANNED)
      if (hit)
        violations.push(
          `${path.relative(process.cwd(), file)}:${i + 1} uses \`${hit[1]}\``,
        )
    })
}

for (const mod of modules) {
  const dir = path.join(SRC, mod)
  if (fs.existsSync(dir)) listSources(dir).forEach(scan)
}
for (const name of files) scan(path.join(SRC, `${name}.ts`))

if (violations.length > 0) {
  console.error(
    `Universal modules must not use Buffer or process (use atob/btoa, globalThis.process?.env):\n  ${violations.join("\n  ")}`,
  )
  process.exit(1)
}
console.log(
  `✔ no Buffer/process in universal sources (${[...modules, ...files].join(", ")})`,
)
