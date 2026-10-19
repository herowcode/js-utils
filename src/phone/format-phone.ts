import { parsePhone, type TPhoneCountry } from "./parse-phone"

export interface IFormatPhoneOptions {
  /** `"BR"` by default. */
  country?: TPhoneCountry
  /** Prefixes the country code: `+55 (11) 99999-9999`. */
  international?: boolean
  /** Returned when the input is not a valid number; `""` by default. */
  fallback?: string
}

/**
 * Formats a BR or US phone number for display, e.g. `(11) 99999-9999`.
 * @example formatPhone("11999999999") // "(11) 99999-9999"
 */
export function formatPhone(
  input: unknown,
  {
    country = "BR",
    international = false,
    fallback = "",
  }: IFormatPhoneOptions = {},
): string {
  const parsed = parsePhone(input, country)
  if (!parsed) return fallback
  const { national } = parsed
  const area = national.slice(0, parsed.country === "US" ? 3 : 2)
  const rest = national.slice(area.length)
  const split = parsed.country === "US" ? 3 : rest.length - 4
  const local = `${rest.slice(0, split)}-${rest.slice(split)}`
  const prefix = international ? (parsed.country === "US" ? "+1 " : "+55 ") : ""
  return `${prefix}(${area}) ${local}`
}
