import { cleanAlphanumeric, isRepeated } from "./clean-document"

const WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

// Letters count as their char code minus 48 ("A" = 17), the rule for alphanumeric CNPJ
function checkDigit(chars: string, length: number): number {
  let sum = 0
  for (let i = 0; i < length; i++) {
    sum += (chars.charCodeAt(i) - 48) * WEIGHTS[WEIGHTS.length - length + i]
  }
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

/**
 * True for a CNPJ (string, formatted or not, digits or letters) with valid check digits and not all the same character.
 * @example isValidCNPJ("11.222.333/0001-81") // true
 */
export function isValidCNPJ(value: unknown): boolean {
  if (typeof value !== "string") return false
  const c = cleanAlphanumeric(value)
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || isRepeated(c)) return false
  return (
    checkDigit(c, 12) === Number(c[12]) && checkDigit(c, 13) === Number(c[13])
  )
}
