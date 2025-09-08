/**
 * Generates a random integer between min and max (inclusive)
 * @param min - The minimum value (inclusive)
 * @param max - The maximum value (inclusive)
 * @returns A random integer between min and max
 */
export function randomInt(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error("Both min and max must be integers")
  }

  if (min > max) {
    throw new Error("Min value cannot be greater than max value")
  }

  return Math.floor(Math.random() * (max - min + 1)) + min
}
