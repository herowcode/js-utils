/**
 * Splits an array into consecutive chunks of `size`; the last chunk may be shorter.
 * @example chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
  const step = Math.floor(size)
  if (!(step >= 1)) return []
  const out: T[][] = []
  for (let i = 0; i < array.length; i += step) {
    out.push(array.slice(i, i + step))
  }
  return out
}
