export function camelCase(str: string): string {
  if (typeof str !== "string") {
    throw new Error("Input must be a string")
  }

  if (str.length === 0) {
    return str
  }

  const words = str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .split(/[\s\-_]+/)
    .filter((word) => word.length > 0)

  if (words.length === 0) {
    return ""
  }

  return (
    words[0] +
    words
      .slice(1)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("")
  )
}
