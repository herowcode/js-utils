import { afterEach, describe, expect, it, vi } from "vitest"
import { isBrowser } from "./is-browser"
import { isServer } from "./is-server"

describe("isBrowser / isServer", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("detects a DOM", () => {
    vi.stubGlobal("window", {})
    vi.stubGlobal("document", {})
    expect(isBrowser()).toBe(true)
    expect(isServer()).toBe(false)
  })

  it("detects its absence", () => {
    vi.stubGlobal("window", undefined)
    vi.stubGlobal("document", undefined)
    expect(isBrowser()).toBe(false)
    expect(isServer()).toBe(true)
  })

  it("needs both window and document", () => {
    vi.stubGlobal("window", {})
    vi.stubGlobal("document", undefined)
    expect(isBrowser()).toBe(false)
  })
})
