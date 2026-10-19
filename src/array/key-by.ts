/**
 * Indexes items by the key `fn` returns; on duplicate keys the last item wins.
 * @example keyBy([{ id: 1 }, { id: 2 }], (u) => u.id) // { 1: { id: 1 }, 2: { id: 2 } }
 */
export function keyBy<T, K extends PropertyKey>(
  array: readonly T[],
  fn: (item: T, index: number) => K,
): Record<K, T> {
  return Object.fromEntries(
    array.map((item, index) => [fn(item, index), item]),
  ) as Record<K, T>
}
