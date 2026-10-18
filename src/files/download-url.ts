const REVOKE_DELAY_MS = 1000

export const downloadUrl = async (url: string): Promise<boolean> => {
  let link: HTMLAnchorElement | undefined
  let appended = false
  let objectUrl: string | undefined

  try {
    const urlObj = new URL(url)
    const segments = urlObj.pathname
      .split("/")
      .filter((segment) => segment.length > 0)
    const rawName = segments.length > 0 ? segments[segments.length - 1] : null
    const filename = rawName ? decodeURIComponent(rawName) : null

    if (!filename?.includes(".")) {
      throw new Error("URL does not contain a valid filename")
    }

    const response = await fetch(url, { mode: "cors" })
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`)
    }
    const blob = await response.blob()

    objectUrl = window.URL.createObjectURL(blob)
    link = document.createElement("a")
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    appended = true
    link.click()
    return true
  } catch (error) {
    console.error("Error downloading the file", error)
    return false
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
