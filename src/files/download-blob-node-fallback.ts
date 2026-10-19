/**
 * Node.js stub: there is no DOM to download from, so it throws.
 * @example downloadBlob(blob, "report.csv") // throws in Node.js, use it in the browser entry
 */
export function downloadBlob(_blob: Blob, _filename: string): boolean {
  throw new Error(
    "@herowcode/utils/files: downloadBlob is not supported in Node.js",
  )
}
