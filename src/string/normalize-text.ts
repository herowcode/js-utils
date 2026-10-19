import { removeAccents } from "./remove-accents"

/**
 * Lowercases, strips accents and punctuation, and collapses whitespace to single spaces.
 * @example normalizeText("  Olá,   Mundo! ") // "ola mundo"
 */
export function normalizeText(text: string): string {
  return removeAccents(text)
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}
