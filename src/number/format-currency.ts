export interface IFormatCurrencyOptions {
  /** ISO 4217 code. Default `"BRL"`. */
  currency?: string
  locale?: string
  /** Treat the value as minor units (cents). */
  fromCents?: boolean
  /** Fixed number of fraction digits. */
  decimals?: number
  /** Short form such as `R$ 1,2 mil`. */
  compact?: boolean
  /** Drop `,00` when there are no cents. */
  stripZeroCents?: boolean
  /** Returned for non-finite or non-number input. Default `""`. */
  fallback?: string
}

/**
 * Formats money with Intl (BRL, pt-BR by default); pt-BR puts U+00A0 after `R$`.
 * @example formatCurrency(1234.5) // "R$ 1.234,50"
 */
export function formatCurrency(
  value: number | null | undefined,
  {
    currency = "BRL",
    locale = "pt-BR",
    fromCents = false,
    decimals,
    compact = false,
    stripZeroCents = false,
    fallback = "",
  }: IFormatCurrencyOptions = {},
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  const amount = (fromCents ? value / 100 : value) + 0
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    ...(decimals !== undefined && {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  })
  if (!stripZeroCents || compact) return formatter.format(amount)
  const parts = formatter.formatToParts(amount)
  const fraction = parts.find((part) => part.type === "fraction")
  const keep = !fraction || /[1-9]/.test(fraction.value)
  return parts
    .filter((part) => keep || (part.type !== "decimal" && part !== fraction))
    .map((part) => part.value)
    .join("")
}
