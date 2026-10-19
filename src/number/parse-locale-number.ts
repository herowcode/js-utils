export interface IParseLocaleNumberOptions {
  /** Locale that defines the decimal and group separators. Default `"pt-BR"`. */
  locale?: string
  /** Overrides the locale's decimal separator. */
  decimal?: string
  /** Return integer cents (`"R$ 1,50"` gives `150`). */
  asCents?: boolean
}

const MAX_LENGTH = 100
const SHAPE =
  /^(\()?\s*([-+−])?\s*(?:(?:[A-Za-z]{1,3}\s*)?\p{Sc}|[A-Za-z]{3}\s)?\s*([-+−])?\s*(\d[\d.,'’\s]*)\s*(?:\p{Sc}|%|\s[A-Za-z]{3})?\s*(\))?$/u

function decimalSeparator(locale: string): string {
  const part = new Intl.NumberFormat(locale)
    .formatToParts(1.1)
    .find((p) => p.type === "decimal")
  return part?.value ?? "."
}

/**
 * Parses a localized number or money string ("R$ 1.234,56") to a number, `NaN` on garbage.
 * @example parseLocaleNumber("R$ 1.234,56") // 1234.56
 */
export function parseLocaleNumber(
  input: string,
  {
    locale = "pt-BR",
    decimal,
    asCents = false,
  }: IParseLocaleNumberOptions = {},
): number {
  if (typeof input !== "string") return Number.NaN
  const text = input.trim()
  if (text === "" || text.length > MAX_LENGTH) return Number.NaN
  const match = SHAPE.exec(text)
  if (!match || Boolean(match[1]) !== Boolean(match[5])) return Number.NaN
  if (match[2] && match[3]) return Number.NaN

  const separator = decimal ?? decimalSeparator(locale)
  const group = separator === "," ? "." : ","
  const digits = match[4].replace(/[\s'’]/g, "")
  const pieces = digits.split(separator)
  if (pieces.length > 2) return Number.NaN
  const groups = pieces[0].split(group)
  const grouped =
    groups.length === 1 ||
    (groups[0].length <= 3 && groups.slice(1).every((g) => g.length === 3))
  if (!grouped) return Number.NaN
  const integer = groups.join("")
  const fraction = pieces[1] ?? ""
  if (!/^\d+$/.test(integer) || !/^\d*$/.test(fraction)) return Number.NaN

  const magnitude = Number(fraction ? `${integer}.${fraction}` : integer)
  const negative =
    Boolean(match[1]) ||
    match[2] === "-" ||
    match[2] === "−" ||
    match[3] === "-" ||
    match[3] === "−"
  const value = negative ? -magnitude : magnitude
  return asCents ? Math.round(value * 100) : value
}
