export interface IToNumberOptions {
  /** Returned when the value is not a finite number. Default `0`. */
  fallback?: number
  /** Truncate toward zero. */
  integer?: boolean
}

/**
 * Coerces a number, bigint or numeric string to a finite number, never `NaN`.
 * @example toNumber("12.5") // 12.5
 */
export function toNumber(
  value: unknown,
  { fallback = 0, integer = false }: IToNumberOptions = {},
): number {
  let n = Number.NaN
  if (typeof value === "number") n = value
  else if (typeof value === "bigint") n = Number(value)
  else if (typeof value === "string" && value.trim() !== "") n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return integer ? Math.trunc(n) : n
}
