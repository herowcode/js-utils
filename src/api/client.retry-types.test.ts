import { describe, expectTypeOf, it } from "vitest"
import type { ICustomRequestInit, IRetryOptions } from "./index"

describe("IRetryOptions", () => {
  it("accepts readonly arrays, e.g. shared `as const` config", () => {
    const shared = {
      methods: ["get", "put"],
      statusCodes: [429, 503],
    } as const satisfies IRetryOptions

    const options: ICustomRequestInit = { retry: shared }

    expectTypeOf(options.retry).toEqualTypeOf<IRetryOptions | undefined>()
  })
})
