const TAG_START = /[A-Za-z/!?>]/

export interface IRemoveHtmlTagsOptions {
  /** Decodes `&amp; &lt; &gt; &quot; &#39; &nbsp;` and numeric entities. The result is plain text: escape it before putting it back into HTML. */
  decodeEntities?: boolean
  /** Collapses runs of whitespace (including newlines) into one space and trims. */
  collapseWhitespace?: boolean
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  nbsp: " ",
}

// Digit caps keep every code point <= 0x10ffff, so fromCodePoint cannot throw
function decodeEntities(text: string): string {
  return text.replace(
    /&(?:#(\d{1,6})|#x([\da-f]{1,5})|([a-z]{2,4}));/gi,
    (m, dec, hex, name) =>
      name
        ? (NAMED_ENTITIES[name.toLowerCase()] ?? m)
        : String.fromCodePoint(dec ? +dec : Number.parseInt(hex, 16)),
  )
}

/**
 * Strips HTML tags from a string, keeping the text between them.
 * @example removeHtmlTags("<p>a &amp; b</p>", { decodeEntities: true }) // "a & b"
 */
export function removeHtmlTags(
  input: string,
  options?: IRemoveHtmlTagsOptions,
): string {
  const stripped = stripTags(input)
  let out = options?.decodeEntities ? decodeEntities(stripped) : stripped
  if (options?.collapseWhitespace) out = out.replace(/\s+/g, " ").trim()
  return out
}

function stripTags(input: string): string {
  if (!input || typeof input !== "string") {
    return ""
  }

  // Input is truncated, not rejected: anything past maxLength is dropped
  const maxLength = 100000
  const text = input.length > maxLength ? input.slice(0, maxLength) : input

  // Manual scanner: a regex here backtracks quadratically on inputs like "<<<<"
  let out = ""
  let last = 0
  let plain = false
  let i = text.indexOf("<")

  while (i !== -1) {
    if (!TAG_START.test(text.charAt(i + 1))) {
      i = text.indexOf("<", i + 1)
      continue
    }

    let end = -1
    let badQuote = -1
    let j = i + 1
    while (j < text.length) {
      const ch = text[j]
      if (ch === ">") {
        end = j
        break
      }
      if (!plain && (ch === '"' || ch === "'")) {
        const close = text.indexOf(ch, j + 1)
        if (close === -1) {
          badQuote = j
          break
        }
        j = close + 1
        continue
      }
      j++
    }

    if (end !== -1) {
      out += text.slice(last, i)
      last = end + 1
      i = text.indexOf("<", last)
    } else if (badQuote !== -1) {
      // No '>' before an unmatched quote, so no tag starting earlier can end either
      i = text.indexOf("<", badQuote)
    } else if (plain || text.indexOf(">", i) === -1) {
      break
    } else {
      // Quotes swallowed every '>'; from here a tag ends at the first '>'
      plain = true
    }
  }

  return dropReassembledTagStarts(out + text.slice(last))
}

// Stripping "<<b>x>" leaves "<x>": drop any surviving "<" that would open a tag, right to left
function dropReassembledTagStarts(text: string): string {
  const kept: string[] = []
  let closeAhead = false
  for (let i = text.length - 1; i >= 0; i--) {
    const ch = text[i]
    if (ch === ">") closeAhead = true
    const next = kept.length > 0 ? kept[kept.length - 1] : ""
    if (ch === "<" && closeAhead && TAG_START.test(next)) continue
    kept.push(ch)
  }
  return kept.reverse().join("")
}
