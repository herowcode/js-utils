import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "api/index": "src/api/index.ts",
    "array/index": "src/array/index.ts",
    "date/index": "src/date/index.ts",
    "files/index": "src/files/index.ts",
    "files/index.node": "src/files/index.node.ts",
    "files/index.browser": "src/files/index.browser.ts",
    "function/index": "src/function/index.ts",
    "string/index": "src/string/index.ts",
    "youtube/index": "src/youtube/index.ts",
    "youtube/index.node": "src/youtube/index.node.ts",
    "youtube/index.browser": "src/youtube/index.browser.ts",
  },
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
  target: "es2018",
  platform: "neutral",
  external: ["node:fs", "node:fs/promises", "node:path", "node:os", "node:crypto"],
})
