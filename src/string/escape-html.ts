const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

/**
 * Escapes `& < > " '` so text is safe inside HTML content and quoted attributes.
 * @example escapeHtml('<b>"hi"</b>') // "&lt;b&gt;&quot;hi&quot;&lt;/b&gt;"
 */
export function escapeHtml(text: string): string {
  return typeof text === "string"
    ? text.replace(/[&<>"']/g, (char) => ENTITIES[char])
    : ""
}
