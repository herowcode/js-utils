/**
 * Escapes regex metacharacters so `text` matches literally inside a RegExp.
 * @example new RegExp(escapeRegExp("a.b")) // /a\.b/
 */
export function escapeRegExp(text: string): string {
  return typeof text === "string"
    ? text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    : ""
}
