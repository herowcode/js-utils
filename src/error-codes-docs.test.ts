import { readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const SRC = resolve(__dirname)
const DOCS = readFileSync(resolve(SRC, "..", "docs", "errors.md"), "utf8")

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return sources(full)
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [full]
      : []
  })
}

describe("HEROW_ error codes", () => {
  const codes = new Set(
    sources(SRC).flatMap((file) =>
      Array.from(
        readFileSync(file, "utf8").matchAll(/"(HEROW_[A-Z0-9_]+)"/g),
        (m) => m[1],
      ),
    ),
  )

  it("finds the thrown codes", () => {
    expect(codes.size).toBeGreaterThanOrEqual(3)
  })

  it.each([...codes])("%s has a section in docs/errors.md", (code) => {
    expect(DOCS).toMatch(new RegExp(`^## ${code}$`, "m"))
  })
})
