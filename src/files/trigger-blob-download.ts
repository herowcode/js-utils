const REVOKE_DELAY_MS = 1000

// Throws on failure; callers decide whether to log (downloadUrl) or return false (downloadBlob)
export function triggerBlobDownload(blob: Blob, filename: string): void {
  let link: HTMLAnchorElement | undefined
  let appended = false
  let objectUrl: string | undefined

  try {
    objectUrl = window.URL.createObjectURL(blob)
    link = document.createElement("a")
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    appended = true
    link.click()
  } finally {
    try {
      if (link && appended) document.body.removeChild(link)
    } catch {
      // The anchor was already detached; the download outcome stands
    }
    // Revoking in the same tick can cancel the download in Safari and Firefox
    const pending = objectUrl
    if (pending)
      setTimeout(() => window.URL.revokeObjectURL(pending), REVOKE_DELAY_MS)
  }
}
