import { triggerBlobDownload } from "./trigger-blob-download"

/**
 * Saves a Blob as `filename` through a temporary link; returns `false` instead of throwing.
 * @example downloadBlob(new Blob(["a,b"], { type: "text/csv" }), "data.csv")
 */
export function downloadBlob(blob: Blob, filename: string): boolean {
  try {
    triggerBlobDownload(blob, filename)
    return true
  } catch {
    return false
  }
}
