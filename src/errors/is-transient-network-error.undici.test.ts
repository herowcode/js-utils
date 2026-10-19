import { describe, expect, it } from "vitest"
import { isTransientNetworkError } from "./is-transient-network-error"

describe("isTransientNetworkError undici timeouts", () => {
  it.each(["UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT"])(
    "true for code %s",
    (code) => {
      expect(
        isTransientNetworkError(Object.assign(new Error(code), { code })),
      ).toBe(true)
    },
  )
})
