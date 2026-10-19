/**
 * Sums `fn(item)` over the array, skipping results that are not finite numbers.
 * @example sumBy([{ n: 1 }, { n: 2 }], (x) => x.n) // 3
 */
export function sumBy<T>(
  array: readonly T[],
  fn: (item: T, index: number) => number,
): number {
  let total = 0
  array.forEach((item, index) => {
    const value = fn(item, index)
    if (Number.isFinite(value)) total += value
  })
  return total
}
