/**
 * Strips diacritics ("Olá" -> "Ola") using NFD decomposition.
 * @example removeAccents("Crème Brûlée") // "Creme Brulee"
 */
export function removeAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "")
}
