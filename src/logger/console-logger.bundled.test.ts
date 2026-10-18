// @vitest-environment node
import vm from "node:vm"
import { build, type Rollup } from "vite"
import { describe, expect, it, vi } from "vitest"

// Bundle the browser logger the way an app bundler does, then run it where `process` does not exist
async function loadBundled(define: Record<string, string>) {
  const result = (await build({
    configFile: false,
    logLevel: "silent",
    define,
    build: {
      write: false,
      minify: false,
      lib: {
        entry: new URL("./index.browser.ts", import.meta.url).pathname,
        formats: ["iife"],
        name: "BundledLogger",
      },
    },
  })) as Rollup.RollupOutput[]
  const code = result[0].output[0].code

  const console = {
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
  const context = vm.createContext({ console })
  const mod = vm.runInContext(
    `${code};BundledLogger`,
    context,
  ) as typeof import("./index.browser")
  return { createLogger: mod.createLogger, console }
}

describe("browser createLogger in a bundled app", () => {
  it("detects production from the bundler's NODE_ENV define", async () => {
    const { createLogger, console } = await loadBundled({
      "process.env.NODE_ENV": JSON.stringify("production"),
    })

    createLogger({ service: "app" }).debug("hidden")
    createLogger({ service: "app" }).info("evt", { a: 1 })

    expect(console.debug).not.toHaveBeenCalled()
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(JSON.parse(console.log.mock.calls[0][0])).toMatchObject({
      msg: "evt",
      env: "production",
      a: 1,
    })
  }, 30_000)

  it("falls back to development when nothing defines NODE_ENV", async () => {
    const { createLogger, console } = await loadBundled({})

    createLogger({ service: "app" }).debug("visible")

    expect(console.debug).toHaveBeenCalledWith("[app] visible")
  }, 30_000)
})
