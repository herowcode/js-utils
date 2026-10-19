import { cleanAlphanumeric } from "./clean-document"
import type { IFormatBROptions } from "./format-cep"

/**
 * Formats 14 characters as a CNPJ (`11.222.333/0001-81`, letters allowed); it checks the length only, use `isValidCNPJ` for the check digits.
 * @example formatCNPJ("11222333000181") // "11.222.333/0001-81"
 */
export function formatCNPJ(
  value: unknown,
  { fallback = "" }: IFormatBROptions = {},
): string {
  const c = cleanAlphanumeric(value)
  if (c.length !== 14) return fallback
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`
}
