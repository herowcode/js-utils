import { describe, expect, it } from "vitest"
import { generateOpaqueToken } from "./generate-opaque-token"

describe("generateOpaqueToken minimum size", () => {
  it.each([1, 8, 15])("rejects %s bytes", async (bytes) => {
    await expect(generateOpaqueToken(bytes)).rejects.toMatchObject({
      code: "HEROW_CRYPTO_INVALID_BYTES",
      name: "RangeError",
    })
  })

  it("accepts exactly 16 bytes", async () => {
    expect((await generateOpaqueToken(16)).token).toHaveLength(22)
  })
})
