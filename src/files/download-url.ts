import { triggerBlobDownload } from "./trigger-blob-download"

export const downloadUrl = async (url: string): Promise<boolean> => {
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

    triggerBlobDownload(blob, filename)
    return true
  } catch (error) {
    console.error("Error downloading the file", error)
    return false
  }
}
