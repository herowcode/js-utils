/**
 * Node.js stub: there is no clipboard, so it rejects.
 * @example await copyToClipboard("text") // throws in Node.js, use it in the browser entry
 */
export async function copyToClipboard(_text: string): Promise<boolean> {
  throw new Error(
    "@herowcode/utils/files: copyToClipboard is not supported in Node.js",
  )
}
