export interface IGetInitialsOptions {
  /** Maximum number of letters. Default `2`. */
  max?: number
  /** Returned when the name has no usable word. Default `""`. */
  fallback?: string
}

/**
 * Uppercase initials of the first and last words of a name, up to `max` letters.
 * @example getInitials("Maria da Silva") // "MS"
 */
export function getInitials(
  name: string | null | undefined,
  { max = 2, fallback = "" }: IGetInitialsOptions = {},
): string {
  if (typeof name !== "string") return fallback
  const letters = name
    .slice(0, 1000)
    .split(/\s+/)
    .map((word) => Array.from(word.replace(/^[^\p{L}\p{N}]+/u, ""))[0])
    .filter((letter): letter is string => Boolean(letter))
  if (letters.length === 0 || !(max >= 1)) return fallback
  const limit = Math.floor(max)
  const picked =
    letters.length <= limit
      ? letters
      : limit === 1
        ? [letters[0]]
        : [...letters.slice(0, limit - 1), letters[letters.length - 1]]
  return picked.join("").toLocaleUpperCase()
}
