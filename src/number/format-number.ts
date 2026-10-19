export interface IFormatNumberOptions {
  locale?: string
  /** Fixed number of fraction digits. */
  decimals?: number
  /** Short form such as `1,2 mil`. */
  compact?: boolean
  /** Returned for non-finite or non-number input. Default `""`. */
  fallback?: string
}

/**
 * Formats a number with locale separators (pt-BR by default).
 * @example formatNumber(1234.5, { decimals: 2 }) // "1.234,50"
 */
export function formatNumber(
  value: number | null | undefined,
  {
    locale = "pt-BR",
    decimals,
    compact = false,
    fallback = "",
  }: IFormatNumberOptions = {},
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  return new Intl.NumberFormat(locale, {
    notation: compact ? "compact" : "standard",
    ...(decimals !== undefined && {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  }).format(value + 0)
}
