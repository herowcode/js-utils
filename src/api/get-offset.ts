/**
 * Row offset for a 1-based page: `(page - 1) * pageSize`, clamped to `0` for invalid input.
 * @example getOffset(3, 20) // 40
 */
export function getOffset(page: number, pageSize: number): number {
  const p = Math.floor(page)
  const size = Math.floor(pageSize)
  if (!(p >= 1) || !(size >= 1) || !Number.isFinite(p * size)) return 0
  return (p - 1) * size
}
