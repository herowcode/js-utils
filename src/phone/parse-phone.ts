import { onlyDigits } from "./only-digits"

export type TPhoneCountry = "BR" | "US"

export interface IParsedPhone {
  country: TPhoneCountry
  /** Digits after the country code. */
  national: string
}

function isBRNational(national: string): boolean {
  if (!/^[1-9][1-9]/.test(national)) return false
  if (national.length === 11) return national[2] === "9"
  return national.length === 10 && /^\d{2}[2-9]/.test(national)
}

function parseBR(raw: string): string | undefined {
  const digits = raw.startsWith("00") ? raw.slice(2) : raw
  const candidates = [digits]
  if (digits.startsWith("55")) candidates.push(digits.slice(2))
  if (digits.startsWith("0")) candidates.push(digits.slice(1))
  return candidates.find(isBRNational)
}

function parseUS(digits: string): string | undefined {
  const national =
    digits.length === 11 && digits[0] === "1" ? digits.slice(1) : digits
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(national) ? national : undefined
}

/** Internal: validates a BR or US number and returns its national digits. */
export function parsePhone(
  input: unknown,
  country: TPhoneCountry,
): IParsedPhone | undefined {
  const digits = onlyDigits(input)
  const national = country === "US" ? parseUS(digits) : parseBR(digits)
  return national ? { country, national } : undefined
}
