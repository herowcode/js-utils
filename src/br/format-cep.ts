import { cleanDigits } from "./clean-document"

export interface IFormatBROptions {
  /** Returned when the value does not have the right number of digits; `""` by default. */
  fallback?: string
}

/**
 * Formats 8 digits as a CEP (`01310-100`); it checks the length only.
 * @example formatCEP("01310100") // "01310-100"
 */
export function formatCEP(
  value: unknown,
  { fallback = "" }: IFormatBROptions = {},
): string {
  const digits = cleanDigits(value)
  if (digits.length !== 8) return fallback
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}
