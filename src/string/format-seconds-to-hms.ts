export interface IFormatSecondsToHMSOptions {
  /** Keeps the hours part ("00:01:05") even under one hour. */
  alwaysShowHours?: boolean
  /** How fractional seconds become whole ones; default "round". */
  rounding?: "round" | "floor" | "ceil"
}

/**
 * Formats seconds as "mm:ss", or "hh:mm:ss" from one hour up.
 * @example formatSecondsToHMS(65, { alwaysShowHours: true }) // "00:01:05"
 */
export function formatSecondsToHMS(
  totalSeconds: number,
  options?: IFormatSecondsToHMSOptions,
): string {
  const round = Math[options?.rounding ?? "round"]
  const rounded = Number.isFinite(totalSeconds)
    ? Math.max(0, round(totalSeconds))
    : 0
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const seconds = rounded % 60
  const hh = String(hours).padStart(2, "0")
  const mm = String(minutes).padStart(2, "0")
  const ss = String(seconds).padStart(2, "0")

  if (hours === 0 && !options?.alwaysShowHours) {
    return `${mm}:${ss}`
  }

  return `${hh}:${mm}:${ss}`
}
