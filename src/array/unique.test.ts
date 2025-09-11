import { describe, expect, it } from "vitest"
import { unique } from "./unique"

describe("unique", () => {
  it("should remove duplicate numbers", () => {
    expect(unique([1, 2, 2, 3, 3, 3, 4])).toEqual([1, 2, 3, 4])
    expect(unique([5, 5, 5, 5])).toEqual([5])
    expect(unique([1, 1, 2, 2, 3, 3])).toEqual([1, 2, 3])
  })

  it("should remove duplicate strings", () => {
    expect(unique(["a", "b", "b", "c", "c", "c"])).toEqual(["a", "b", "c"])
    expect(unique(["hello", "world", "hello", "test"])).toEqual([
      "hello",
      "world",
      "test",
    ])
    expect(unique(["test", "test", "test"])).toEqual(["test"])
  })

  it("should handle mixed type arrays", () => {
    expect(unique([1, "1", 2, "2", 1, "1"])).toEqual([1, "1", 2, "2"])
    expect(unique([true, false, true, 1, "1"])).toEqual([true, false, 1, "1"])
  })

  it("should handle empty arrays", () => {
    expect(unique([])).toEqual([])
  })

  it("should handle arrays with no duplicates", () => {
    expect(unique([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5])
    expect(unique(["a", "b", "c"])).toEqual(["a", "b", "c"])
  })

  it("should handle arrays with null and undefined", () => {
    expect(unique([null, undefined, null, undefined])).toEqual([
      null,
      undefined,
    ])
    expect(unique([1, null, 2, undefined, 1, null])).toEqual([
      1,
      null,
      2,
      undefined,
    ])
  })

  it("should handle arrays with boolean values", () => {
    expect(unique([true, false, true, false, true])).toEqual([true, false])
    expect(unique([false, false, false])).toEqual([false])
  })

  it("should preserve order of first occurrence", () => {
    expect(unique([3, 1, 2, 3, 1, 2])).toEqual([3, 1, 2])
    expect(unique(["c", "a", "b", "c", "a"])).toEqual(["c", "a", "b"])
  })

  it("should handle arrays with objects (reference equality)", () => {
    const obj1 = { id: 1 }
    const obj2 = { id: 2 }
    const obj3 = { id: 1 } // Different reference than obj1

    expect(unique([obj1, obj2, obj1, obj3])).toEqual([obj1, obj2, obj3])
  })

  it("should handle arrays with identical object content but different references", () => {
    const arr = [{ id: 1 }, { id: 2 }, { id: 1 }]
    const result = unique(arr)
    expect(result).toHaveLength(3) // All objects are kept since they have different references
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 1 }])
  })

  it("should handle large arrays", () => {
    const largeArray = Array(1000)
      .fill(0)
      .map((_, i) => i % 100)
    const result = unique(largeArray)
    expect(result).toHaveLength(100)
    expect(result).toEqual(
      Array(100)
        .fill(0)
        .map((_, i) => i),
    )
  })

  it("should handle arrays with zero values", () => {
    expect(unique([0, 1, 0, 2, 0])).toEqual([0, 1, 2])
    expect(unique([0, false, "", null, undefined, 0])).toEqual([
      0,
      false,
      "",
      null,
      undefined,
    ])
  })

  it("should handle arrays with NaN", () => {
    expect(unique([Number.NaN, 1, Number.NaN, 2])).toEqual([Number.NaN, 1, 2])
    expect(unique([Number.NaN, Number.NaN, Number.NaN])).toEqual([Number.NaN])
  })

  it("should handle nested arrays (reference equality)", () => {
    const arr1 = [1, 2]
    const arr2 = [3, 4]
    const arr3 = [1, 2] // Different reference than arr1

    expect(unique([arr1, arr2, arr1, arr3])).toEqual([arr1, arr2, arr3])
  })
})
