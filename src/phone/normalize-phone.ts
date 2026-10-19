import { parsePhone, type TPhoneCountry } from "./parse-phone"

export interface INormalizePhoneOptions<F> {
  /** Country the number belongs to when it has no `+` prefix; `"BR"` by default. */
  country?: TPhoneCountry
  /** Returned when the input is not a valid number; `null` by default. */
  fallback?: F
}

/**
 * Converts a BR or US phone number to E.164 (`+5511999999999`), dropping punctuation, trunk zeros and the country code if present.
 * @example normalizePhone("(11) 99999-9999") // "+5511999999999"
 */
export function normalizePhone<F = null>(
  input: unknown,
  { country = "BR", fallback = null as F }: INormalizePhoneOptions<F> = {},
): string | F {
  const parsed = parsePhone(input, country)
  if (!parsed) return fallback
  return `${parsed.country === "US" ? "+1" : "+55"}${parsed.national}`
}
