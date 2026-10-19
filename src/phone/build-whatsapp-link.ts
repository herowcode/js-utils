import { normalizePhone } from "./normalize-phone"
import type { TPhoneCountry } from "./parse-phone"

export interface IBuildWhatsAppLinkOptions {
  /** Prefilled message text. */
  message?: string
  /** `"BR"` by default. */
  country?: TPhoneCountry
  /** Returned when the number is not valid; `""` by default. */
  fallback?: string
}

/**
 * Builds a `https://wa.me/` click-to-chat link for a BR or US number, with an optional prefilled message.
 * @example buildWhatsAppLink("11999999999", { message: "Olá!" }) // "https://wa.me/5511999999999?text=Ol%C3%A1!"
 */
export function buildWhatsAppLink(
  phone: unknown,
  { message, country = "BR", fallback = "" }: IBuildWhatsAppLinkOptions = {},
): string {
  const e164 = normalizePhone(phone, { country })
  if (!e164) return fallback
  const base = `https://wa.me/${e164.slice(1)}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
