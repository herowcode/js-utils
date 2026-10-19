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

// A leading `+` names the country, so the `country` option is ignored
function parsePlus(digits: string): IParsedPhone | undefined {
  if (digits.startsWith("55")) {
    const national = digits.slice(2)
    return isBRNational(national) ? { country: "BR", national } : undefined
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    const national = parseUS(digits)
    return national ? { country: "US", national } : undefined
  }
  return undefined
}

/** Internal: validates a BR or US number and returns its national digits. */
export function parsePhone(
  input: unknown,
  country: TPhoneCountry,
): IParsedPhone | undefined {
  const digits = onlyDigits(input)
  if (typeof input === "string" && input.trimStart().startsWith("+")) {
    return parsePlus(digits)
  }
  const national = country === "US" ? parseUS(digits) : parseBR(digits)
  return national ? { country, national } : undefined
}
