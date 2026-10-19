export interface IFormatSecondsToFragmentOptions {
  /** How fractional seconds become whole ones; default "floor". */
  rounding?: "round" | "floor" | "ceil"
  /** Placed between parts, e.g. " " gives "1h 2m 3s"; default "". */
  separator?: string
}

/**
 * Converts seconds to "1h2m3s" or "42s", the style used in URL fragments.
 * @example formatSecondsToFragment(3723, { separator: " " }) // "1h 2m 3s"
 */
export const formatSecondsToFragment = (
  secs: number,
  options?: IFormatSecondsToFragmentOptions,
): string => {
  const round = Math[options?.rounding ?? "floor"]
  const parsedSecs = Number.isFinite(secs) ? Math.max(0, round(secs)) : 0
  const h = Math.floor(parsedSecs / 3600)
  const m = Math.floor((parsedSecs % 3600) / 60)
  const s = parsedSecs % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 || parts.length === 0) parts.push(`${s}s`)
  return parts.join(options?.separator ?? "")
}
