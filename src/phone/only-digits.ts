/**
 * Keeps only the digits 0-9; non-string and non-number input gives `""`.
 * @example onlyDigits("(11) 99999-9999") // "11999999999"
 */
export function onlyDigits(value: unknown): string {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(Math.trunc(Math.abs(value))) : ""
  }
  return typeof value === "string" ? value.replace(/\D/g, "") : ""
}
