export interface IFormatBROptions {
  /** Returned when the value does not have the right number of digits; `""` by default. */
  fallback?: string
}

/** Internal: uppercase alphanumerics only (CNPJ may contain letters since 2026). */
export function cleanAlphanumeric(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/[^0-9A-Za-z]/g, "").toUpperCase()
    : ""
}

/** Internal: digits only. */
export function cleanDigits(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : ""
}

export function isRepeated(value: string): boolean {
  return value.split("").every((char) => char === value[0])
}
