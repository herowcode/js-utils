import { describe, expect, it } from "vitest"
import { shuffle } from "./shuffle"

describe("shuffle", () => {
  it("should return an array of the same length", () => {
    const original = [1, 2, 3, 4, 5]
    const shuffled = shuffle(original)
    expect(shuffled).toHaveLength(original.length)
  })

  it("should contain all original elements", () => {
    const original = [1, 2, 3, 4, 5]
    const shuffled = shuffle(original)

    expect(shuffled.sort()).toEqual(original.sort())
    expect(shuffled).toEqual(expect.arrayContaining(original))
  })

  it("should not modify the original array", () => {
    const original = [1, 2, 3, 4, 5]
    const originalCopy = [...original]

    shuffle(original)
    expect(original).toEqual(originalCopy)
  })

  it("should handle empty arrays", () => {
    expect(shuffle([])).toEqual([])
  })

  it("should handle single element arrays", () => {
    expect(shuffle([1])).toEqual([1])
    expect(shuffle(["single"])).toEqual(["single"])
  })

  it("should handle two element arrays", () => {
    const original = [1, 2]
    const shuffled = shuffle(original)

    expect(shuffled).toHaveLength(2)
    expect(shuffled).toEqual(expect.arrayContaining(original))
  })

  it("should work with different data types", () => {
    const numbers = [1, 2, 3, 4, 5]
    const strings = ["a", "b", "c", "d", "e"]
    const booleans = [true, false, true, false]
    const mixed = [1, "a", true, null, undefined]

    expect(shuffle(numbers)).toEqual(expect.arrayContaining(numbers))
    expect(shuffle(strings)).toEqual(expect.arrayContaining(strings))
    expect(shuffle(booleans)).toEqual(expect.arrayContaining(booleans))
    expect(shuffle(mixed)).toEqual(expect.arrayContaining(mixed))
  })

  it("should work with objects", () => {
    const objects = [
      { id: 1, name: "first" },
      { id: 2, name: "second" },
      { id: 3, name: "third" },
    ]

    const shuffled = shuffle(objects)
    expect(shuffled).toHaveLength(objects.length)
    expect(shuffled).toEqual(expect.arrayContaining(objects))
  })

  it("should produce different results on multiple calls (statistical)", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const results = new Set()

    // Run shuffle multiple times and collect results
    for (let i = 0; i < 100; i++) {
      results.add(JSON.stringify(shuffle(original)))
    }

    // Should have produced multiple different arrangements
    // (Very unlikely to get the same arrangement 100 times)
    expect(results.size).toBeGreaterThan(1)
  })

  it("should handle arrays with duplicate values", () => {
    const original = [1, 1, 2, 2, 3, 3]
    const shuffled = shuffle(original)

    expect(shuffled).toHaveLength(original.length)
    expect(shuffled.sort()).toEqual(original.sort())
  })

  it("should handle large arrays", () => {
    const large = Array(1000)
      .fill(0)
      .map((_, i) => i)
    const shuffled = shuffle(large)

    expect(shuffled).toHaveLength(1000)
    expect(shuffled.sort((a, b) => a - b)).toEqual(large)
  })

  it("should preserve array type", () => {
    const numberArray: number[] = [1, 2, 3]
    const stringArray: string[] = ["a", "b", "c"]

    const shuffledNumbers = shuffle(numberArray)
    const shuffledStrings = shuffle(stringArray)

    // TypeScript should infer correct types
    expect(typeof shuffledNumbers[0]).toBe("number")
    expect(typeof shuffledStrings[0]).toBe("string")
  })

  it("should work with nested arrays", () => {
    const nested = [
      [1, 2],
      [3, 4],
      [5, 6],
    ]
    const shuffled = shuffle(nested)

    expect(shuffled).toHaveLength(3)
    expect(shuffled).toEqual(expect.arrayContaining(nested))

    // Check that nested arrays are not modified
    shuffled.forEach((arr) => {
      expect(arr).toEqual(
        expect.arrayContaining([expect.any(Number), expect.any(Number)]),
      )
    })
  })
})
