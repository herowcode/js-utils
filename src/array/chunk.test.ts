import { describe, expect, it } from "vitest"
import { chunk } from "./chunk"

describe("chunk", () => {
  it("splits into chunks with a shorter tail", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ])
  })

  it("returns one chunk when size exceeds the length", () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]])
  })

  it("does not mutate the input", () => {
    const input = [1, 2, 3]
    chunk(input, 2)
    expect(input).toEqual([1, 2, 3])
  })

  it("returns [] for empty arrays and invalid sizes", () => {
    expect(chunk([], 3)).toEqual([])
    expect(chunk([1, 2], 0)).toEqual([])
    expect(chunk([1, 2], -1)).toEqual([])
    expect(chunk([1, 2], Number.NaN)).toEqual([])
  })

  it("floors fractional sizes", () => {
    expect(chunk([1, 2, 3], 1.9)).toEqual([[1], [2], [3]])
  })
})
