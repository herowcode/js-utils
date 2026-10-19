export interface IFormatPercentOptions {
  locale?: string
  /** Fixed number of fraction digits. Default: up to 2. */
  decimals?: number
  /** Returned for non-finite or non-number input. Default `""`. */
  fallback?: string
}

/**
 * Formats a percentage value (`25` means 25%) with locale rules.
 * @example formatPercent(12.5) // "12,5%"
 */
export function formatPercent(
  value: number | null | undefined,
  { locale = "pt-BR", decimals, fallback = "" }: IFormatPercentOptions = {},
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  return new Intl.NumberFormat(locale, {
    style: "percent",
    ...(decimals === undefined
      ? { maximumFractionDigits: 2 }
      : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
  }).format(value / 100 + 0)
}
