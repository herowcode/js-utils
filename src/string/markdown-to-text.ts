export function markdownToText(markdown: string): string {
  if (!markdown) return ""

  // normalize newlines
  let text = markdown.replace(/\r\n?/g, "\n")

  // Remove code fences but keep inner content (trim surrounding newlines to avoid extra blank lines)
  text = text.replace(/```[\s\S]*?```/g, (m) => {
    const inner = m.replace(/^```.*\n?/, "").replace(/```$/, "")
    return inner.replace(/^\n+|\n+$/g, "")
  })

  // Remove inline code backticks
  text = text.replace(/`([^`]+)`/g, "$1")

  // Images: keep alt text if present
  text = text.replace(/!\[([^\]]*)\]\((?:[^)]+)\)/g, "$1")

  // Links: keep link text
  text = text.replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, "$1")

  // Reference-style links: [text][id] -> text
  text = text.replace(/\[([^\]]+)\]\s*\[[^\]]*\]/g, "$1")

  // Remove footnote markers like [^1] (do this before we mutate surrounding lines)
  text = text.replace(/\[\^[^\]]+\]/g, "")

  // Remove reference definitions like: [id]: url (and footnote defs like [^1]: note)
  // Remove the entire definition line including its trailing newline to avoid leaving blank lines
  text = text.replace(/^\s*\[[^\]]+\]:\s*.*(?:\r\n?|\n)?/gm, "")
  text = text.replace(/^\s*\[\^[^\]]+\]:\s*.*(?:\r\n?|\n)?/gm, "")

  // Remove HTML tags but keep inner text
  text = text.replace(/<\/?[^>]+>/g, "")

  // Remove emphasis markers (bold/italic/strikethrough), preserve text
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2")
  text = text.replace(/(\*|_)(.*?)\1/g, "$2")
  text = text.replace(/~~(.*?)~~/g, "$1")

  // Remove headings (#, ##, etc.)
  text = text.replace(/^\s{0,3}#{1,6}\s*/gm, "")

  // Remove blockquote markers
  text = text.replace(/^\s{0,3}>\s?/gm, "")

  // Remove list markers (ordered and unordered)
  text = text.replace(/^\s{0,3}([-+*]|\d+\.)\s+/gm, "")

  // Remove table separator lines and keep table cell content by replacing pipes with spaced pipes
  // Match the separator line and any trailing newline so we don't leave an empty line behind
  // Remove separator lines entirely (don't insert an extra newline)
  text = text.replace(/^\s*\|?(?:\s*:?-+:?\s*\|)+\s*(?:\r\n?|\n)?/gm, "")
  text = text.replace(/\|/g, " | ")

  // Trim leading whitespace on each line (fixes leading space introduced by replacing pipes)
  text = text.replace(/^[ \t]+/gm, "")

  // Fix table spacing edge-case: when a cell starts with two spaces before a digit (caused by adding spaces around pipes), collapse to a single space
  text = text.replace(/\|\s{2}(?=\d)/g, "| ")

  // Remove footnote markers like [^1]
  text = text.replace(/\[\^[^\]]+\]/g, "")

  // Remove any leftover footnote-definition fragments that may have been concatenated to the previous line
  // e.g. "Text^1: note" -> "Text"
  text = text.replace(/\^[0-9]+:\s*.*(?:\r\n?|\n)?/g, "")

  // Decode a few common HTML entities
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
  }
  text = text.replace(/&[a-zA-Z0-9#]+;/g, (e) => entities[e] ?? e)

  // Trim trailing whitespace on each line
  text = text.replace(/[ \t]+$/gm, "")

  // Collapse excessive blank lines to at most two (preserve paragraph breaks)
  text = text.replace(/\n{3,}/g, "\n\n")

  // Final trim but preserve leading/trailing single newlines inside content as needed
  return text.trim()
}
