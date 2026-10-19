export interface ITruncateOptions {
  /** Appended when the text is cut; default "...". */
  suffix?: string
  /** Cut at the last whitespace instead of mid-word (falls back to a hard cut when there is none). */
  wordBoundary?: boolean
}

/**
 * Cuts `str` to at most `length` characters, suffix included.
 * @example truncate("hello brave world", 14, { wordBoundary: true }) // "hello brave..."
 */
export function truncate(
  str: string,
  length: number,
  suffixOrOptions: string | ITruncateOptions = "...",
): string {
  const options =
    typeof suffixOrOptions === "string"
      ? { suffix: suffixOrOptions }
      : suffixOrOptions
  const suffix = options.suffix ?? "..."

  if (typeof str !== "string") {
    throw new Error("Input must be a string")
  }

  if (typeof length !== "number" || !Number.isFinite(length) || length < 0) {
    throw new Error("Length must be a non-negative number")
  }

  if (str.length <= length) {
    return str
  }

  if (length <= suffix.length) {
    return suffix.slice(0, length)
  }

  let head = str.slice(0, length - suffix.length)
  if (options.wordBoundary) {
    // Already cut right before a space: the last word is whole
    if (!/\s/.test(str.charAt(head.length))) {
      let i = head.length - 1
      while (i > 0 && !/\s/.test(head.charAt(i))) i--
      if (i > 0) head = head.slice(0, i)
    }
    head = head.trimEnd()
  }
  return head + suffix
}
