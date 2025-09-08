export const downloadUrl = async (url: string): Promise<boolean> => {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const segments = pathname.split("/").filter((segment) => segment.length > 0)
    const filename = segments.length > 0 ? segments[segments.length - 1] : null

    if (!filename || !filename.includes(".")) {
      throw new Error("URL does not contain a valid filename")
    }

    const response = await fetch(url, { mode: "cors" })
    const blob = await response.blob()

    const link = document.createElement("a")
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  } catch (error) {
    console.error("Error downloading the file", error)
    return false
  }
}
