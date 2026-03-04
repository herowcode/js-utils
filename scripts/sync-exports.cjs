/**
 * Regenerates the `exports` field in package.json by scanning src/.
 * Run automatically as the `prebuild` npm lifecycle hook.
 */

// @ts-check
const fs = require("node:fs")
const path = require("node:path")
const { buildExports } = require("./resolve-entries.cjs")

const PKG_PATH = path.resolve(__dirname, "../package.json")
const pkg = JSON.parse(fs.readFileSync(PKG_PATH, "utf8"))

pkg.exports = buildExports()

fs.writeFileSync(PKG_PATH, `${JSON.stringify(pkg, null, 2)}\n`)
console.log("✔ package.json exports synced from src/")
