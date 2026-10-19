import { normalizeText } from "./normalize-text"

export function slugify(text: string): string {
  return normalizeText(text).replace(/ /g, "-")
}
