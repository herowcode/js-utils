import { randomInt } from "./number"

describe("randomInt", () => {
  it("should generate random integers within the specified range", () => {
    for (let i = 0; i < 100; i++) {
      const result = randomInt(1, 10)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(10)
      expect(Number.isInteger(result)).toBe(true)
    }
  })

  it("should handle single value range (min equals max)", () => {
    expect(randomInt(5, 5)).toBe(5)
    expect(randomInt(0, 0)).toBe(0)
    expect(randomInt(-3, -3)).toBe(-3)
  })

  it("should handle negative ranges", () => {
    for (let i = 0; i < 50; i++) {
      const result = randomInt(-10, -1)
      expect(result).toBeGreaterThanOrEqual(-10)
      expect(result).toBeLessThanOrEqual(-1)
      expect(Number.isInteger(result)).toBe(true)
    }
  })

  it("should handle ranges including zero", () => {
    for (let i = 0; i < 50; i++) {
      const result = randomInt(-5, 5)
      expect(result).toBeGreaterThanOrEqual(-5)
      expect(result).toBeLessThanOrEqual(5)
      expect(Number.isInteger(result)).toBe(true)
    }
  })

  it("should handle large ranges", () => {
    for (let i = 0; i < 20; i++) {
      const result = randomInt(1, 1000000)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(1000000)
      expect(Number.isInteger(result)).toBe(true)
    }
  })

  it("should throw error when min is greater than max", () => {
    expect(() => randomInt(10, 5)).toThrow(
      "Min value cannot be greater than max value",
    )
    expect(() => randomInt(0, -1)).toThrow(
      "Min value cannot be greater than max value",
    )
    expect(() => randomInt(100, 50)).toThrow(
      "Min value cannot be greater than max value",
    )
  })

  it("should throw error for non-integer min value", () => {
    expect(() => randomInt(1.5, 10)).toThrow(
      "Both min and max must be integers",
    )
    expect(() => randomInt(-2.3, 5)).toThrow(
      "Both min and max must be integers",
    )
    expect(() => randomInt(Math.PI, 10)).toThrow(
      "Both min and max must be integers",
    )
  })

  it("should throw error for non-integer max value", () => {
    expect(() => randomInt(1, 10.5)).toThrow(
      "Both min and max must be integers",
    )
    expect(() => randomInt(-5, 2.7)).toThrow(
      "Both min and max must be integers",
    )
    expect(() => randomInt(0, Math.E)).toThrow(
      "Both min and max must be integers",
    )
  })

  it("should throw error for non-number values", () => {
    expect(() => randomInt("1" as unknown as number, 10)).toThrow(
      "Both min and max must be integers",
    )
    expect(() => randomInt(1, "10" as unknown as number)).toThrow(
      "Both min and max must be integers",
    )
    expect(() => randomInt(null as unknown as number, 10)).toThrow(
      "Both min and max must be integers",
    )
    expect(() => randomInt(1, undefined as unknown as number)).toThrow(
      "Both min and max must be integers",
    )
  })

  it("should handle edge case with zero", () => {
    const result = randomInt(0, 1)
    expect([0, 1]).toContain(result)
  })

  it("should generate different values over multiple calls", () => {
    const results = new Set()
    for (let i = 0; i < 100; i++) {
      results.add(randomInt(1, 100))
    }
    // Should have generated multiple different values (not checking exact count due to randomness)
    expect(results.size).toBeGreaterThan(1)
  })

  it("should handle very large negative numbers", () => {
    const result = randomInt(-1000000, -999999)
    expect(result).toBeGreaterThanOrEqual(-1000000)
    expect(result).toBeLessThanOrEqual(-999999)
  })
})
