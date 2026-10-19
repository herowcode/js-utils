export async function copyToClipboard(_text: string): Promise<boolean> {
  throw new Error(
    "@herowcode/utils/files: copyToClipboard is not supported in Node.js",
  )
}
