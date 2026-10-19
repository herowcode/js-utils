import { createRequire } from "node:module"
import { defineConfig } from "tsup"

const require = createRequire(import.meta.url)
const { buildEntries } = require("./scripts/resolve-entries.cjs")

export default defineConfig({
  // Internal entry (not in exports): makes the dayjs-free date helpers a shared chunk that /date re-exports
  entry: { ...buildEntries(), "date/date-only": "src/date/date-only.ts" },
  format: ["cjs", "esm"],
  outDir: "dist",
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" }
  },
  dts: {
    compilerOptions: {
      // Only include Node types for DTS; exclude test-only vitest/globals
      types: ["node"],
    },
  },
  clean: true,
  splitting: true,
  sourcemap: true,
  treeshake: true,
  target: "es2022",
  platform: "neutral",
  external: [
    "node:fs",
    "node:fs/promises",
    "node:path",
    "node:os",
    "node:crypto",
    "node:module",
    "pino",
    "pino-pretty",
    "thread-stream",
    "sonic-boom",
  ],
})
