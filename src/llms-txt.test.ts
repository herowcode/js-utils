import { readdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = resolve(__dirname, "..")
const LLMS = readFileSync(resolve(ROOT, "llms.txt"), "utf8")
const modules = readdirSync(__dirname, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

describe("llms.txt", () => {
  it.each(modules)("lists the %s module", (name) => {
    expect(LLMS).toContain(`@herowcode/utils/${name}\``)
  })
})
