/**
 * Maps `items` with `fn`, running at most `chunkSize` calls at once; results keep input order.
 * @example const users = await mapInChunks(ids, 5, (id) => loadUser(id))
 */
export async function mapInChunks<T, R>(
  items: readonly T[],
  chunkSize: number,
  fn: (item: T, index: number) => R | Promise<R>,
): Promise<R[]> {
  const size = Math.max(1, Math.floor(chunkSize) || 1)
  const results: R[] = []
  for (let start = 0; start < items.length; start += size) {
    const chunk = items.slice(start, start + size)
    results.push(
      ...(await Promise.all(chunk.map((item, i) => fn(item, start + i)))),
    )
  }
  return results
}
