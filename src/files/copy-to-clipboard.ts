function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea")
  area.value = text
  area.setAttribute("readonly", "")
  area.style.position = "fixed"
  area.style.opacity = "0"
  document.body.appendChild(area)
  try {
    area.select()
    return document.execCommand("copy")
  } finally {
    document.body.removeChild(area)
  }
}

/**
 * Copies text to the clipboard; resolves `false` (never throws) when copying is blocked or unavailable.
 * @example if (await copyToClipboard(link)) toast("Copied")
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // The async API is missing or denied in insecure contexts and some iframes
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      return legacyCopy(text)
    } catch {
      return false
    }
  }
}
