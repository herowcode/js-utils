import { describe, expect, it } from "vitest"
import { mapInChunks } from "./map-in-chunks"

describe("mapInChunks", () => {
  it("keeps input order regardless of completion order", async () => {
    const delays = [30, 5, 20, 1, 10]
    const result = await mapInChunks(delays, 3, async (ms, i) => {
      await new Promise((r) => setTimeout(r, ms))
      return `${i}:${ms}`
    })
    expect(result).toEqual(["0:30", "1:5", "2:20", "3:1", "4:10"])
  })

  it("runs at most chunkSize calls at once", async () => {
    let active = 0
    let peak = 0
    await mapInChunks([1, 2, 3, 4, 5, 6, 7], 3, async () => {
      active++
      peak = Math.max(peak, active)
      await new Promise((r) => setTimeout(r, 5))
      active--
    })
    expect(peak).toBe(3)
  })

  it("passes the global index and accepts sync mappers", async () => {
    expect(await mapInChunks(["a", "b", "c"], 2, (x, i) => x + i)).toEqual([
      "a0",
      "b1",
      "c2",
    ])
  })

  it("returns [] for empty input and treats invalid sizes as 1", async () => {
    expect(await mapInChunks([], 3, (x) => x)).toEqual([])
    expect(await mapInChunks([1, 2], 0, (x) => x)).toEqual([1, 2])
    expect(await mapInChunks([1, 2], Number.NaN, (x) => x)).toEqual([1, 2])
  })

  it("rejects with the first failure", async () => {
    await expect(
      mapInChunks([1, 2], 2, (x) => {
        if (x === 2) throw new Error("bad")
        return x
      }),
    ).rejects.toThrow("bad")
  })
})
