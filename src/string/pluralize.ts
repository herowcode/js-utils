/**
 * Picks the singular form for a count of 1 or -1 and the plural otherwise (`singular + "s"` by default).
 * @example pluralize(2, "item") // "items"
 */
export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return Math.abs(count) === 1 ? singular : plural
}
