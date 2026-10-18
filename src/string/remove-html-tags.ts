const TAG_START = /[A-Za-z/!?>]/

export function removeHtmlTags(input: string): string {
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
