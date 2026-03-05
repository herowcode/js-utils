import { createRequire } from "node:module"
import { defineConfig } from "tsup"

const require = createRequire(import.meta.url)
const { buildEntries } = require("./scripts/resolve-entries.cjs")

export default defineConfig({
  entry: buildEntries(),
  format: ["cjs", "esm"],
  outDir: "dist",
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" }
  },
  dts: {
    compilerOptions: {
      // Only include Node types for DTS; exclude test-only vitest/globals
      types: ["node", "react"],
    },
  },
  clean: true,
  splitting: true,
  sourcemap: true,
  treeshake: true,
  target: "es2018",
  platform: "neutral",
  external: ["node:fs", "node:fs/promises", "node:path", "node:os", "node:crypto", "react", "react-dom", "next", "next/image"],
})
