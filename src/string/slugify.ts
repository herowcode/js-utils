import { normalizeText } from "./normalize-text"

export interface ISlugifyOptions {
  /** Joins words; default "-". */
  separator?: string
  /** Cuts the slug to at most this many characters, never ending on a separator. */
  maxLength?: number
}

/**
 * Turns text into a URL slug: lowercase, no accents or punctuation, words joined by `separator`.
 * @example slugify("Olá, Mundo!", { separator: "_" }) // "ola_mundo"
 */
export function slugify(text: string, options?: ISlugifyOptions): string {
  const separator = options?.separator ?? "-"
  const slug = normalizeText(text).replace(/ /g, separator)
  const max = options?.maxLength
  if (max === undefined || !(max >= 0) || slug.length <= max) return slug
  let cut = slug.slice(0, Math.floor(max))
  while (separator && cut.endsWith(separator)) {
    cut = cut.slice(0, -separator.length)
  }
  return cut
}
