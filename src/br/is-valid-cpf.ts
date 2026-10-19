import { cleanDigits, isRepeated } from "./clean-document"

function checkDigit(digits: string, length: number): number {
  let sum = 0
  for (let i = 0; i < length; i++) {
    sum += Number(digits[i]) * (length + 1 - i)
  }
  const rest = (sum * 10) % 11
  return rest === 10 ? 0 : rest
}

/**
 * True for a CPF (string, formatted or not) with 11 digits, valid check digits and not all the same digit.
 * @example isValidCPF("529.982.247-25") // true
 */
export function isValidCPF(value: unknown): boolean {
  if (typeof value !== "string") return false
  const d = cleanDigits(value)
  if (d.length !== 11 || isRepeated(d)) return false
  return (
    checkDigit(d, 9) === Number(d[9]) && checkDigit(d, 10) === Number(d[10])
  )
}
