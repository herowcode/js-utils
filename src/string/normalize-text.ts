import { removeAccents } from "./remove-accents"

/**
 * Lowercases, strips accents and collapses whitespace; keeps only ASCII letters, digits, "_" and spaces (non-Latin scripts are dropped).
 * @example normalizeText("  Olá,   Mundo! ") // "ola mundo"
 */
export function normalizeText(text: string): string {
  return removeAccents(text)
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}
