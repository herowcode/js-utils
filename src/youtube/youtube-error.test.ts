import { describe, expect, it, vi } from "vitest"
import { reportYouTubeError } from "./youtube-error"

const error = { source: "oembed", message: "HTTP 500", status: 500 } as const

describe("reportYouTubeError", () => {
  it("ignores a synchronous throw from onError", () => {
    expect(() =>
      reportYouTubeError(
        {
          onError: () => {
            throw new Error("callback bug")
          },
        },
        error,
      ),
    ).not.toThrow()
  })

  it("ignores a rejection from an async onError", async () => {
    const unhandled = vi.fn()
    process.on("unhandledRejection", unhandled)
    try {
      reportYouTubeError(
        {
          onError: async () => {
            throw new Error("log service down")
          },
        },
        error,
      )
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(unhandled).not.toHaveBeenCalled()
    } finally {
      process.off("unhandledRejection", unhandled)
    }
  })
})
