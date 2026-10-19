import type { IFormatBROptions } from "./clean-document"
import { cleanDigits } from "./clean-document"

/**
 * Formats 11 digits as a CPF (`529.982.247-25`); it checks the length only, use `isValidCPF` for the check digits.
 * @example formatCPF("52998224725") // "529.982.247-25"
 */
export function formatCPF(
  value: unknown,
  { fallback = "" }: IFormatBROptions = {},
): string {
  const d = cleanDigits(value)
  if (d.length !== 11) return fallback
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
