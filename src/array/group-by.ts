/**
 * Groups items by the key `fn` returns, keeping their order inside each group.
 * @example groupBy([1, 2, 3], (n) => (n % 2 ? "odd" : "even")) // { odd: [1, 3], even: [2] }
 */
export function groupBy<T, K extends PropertyKey>(
  array: readonly T[],
  fn: (item: T, index: number) => K,
): Record<K, T[]> {
  const groups = new Map<K, T[]>()
  array.forEach((item, index) => {
    const key = fn(item, index)
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  })
  return Object.fromEntries(groups) as Record<K, T[]>
}
