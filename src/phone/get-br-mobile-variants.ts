import { normalizePhone } from "./normalize-phone"

/**
 * Lists the E.164 spellings of a BR mobile number with the 9th digit first, then without it; a landline gives one entry and invalid input `[]`.
 * @example getBRMobileVariants("(11) 99999-9999") // ["+5511999999999", "+551199999999"]
 */
export function getBRMobileVariants(input: unknown): string[] {
  const e164 = normalizePhone(input, { country: "BR" })
  if (!e164) return []
  const national = e164.slice(3)
  if (national.length === 11) {
    return [e164, `+55${national.slice(0, 2)}${national.slice(3)}`]
  }
  if (/^\d{2}[6-9]/.test(national)) {
    return [`+55${national.slice(0, 2)}9${national.slice(2)}`, e164]
  }
  return [e164]
}
