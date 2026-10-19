import { createRequire } from "node:module"
import { defineConfig } from "vitest/config"

const universalModules: string[] = createRequire(import.meta.url)(
  "./scripts/universal-modules.cjs",
)

process.env.TZ = "UTC"

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/*.d.ts", "src/**/*.test.ts", "src/**/*.test.tsx"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "default",
          environment: "jsdom",
          setupFiles: ["./vitest-setup.ts"],
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          exclude: ["src/crypto/**", "node_modules/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "edge",
          environment: "edge-runtime",
          include: universalModules.map((name) => `src/${name}/**/*.test.ts`),
          exclude: ["**/console-logger.bundled.test.ts", "node_modules/**"],
        },
      },
    ],
  },
})
