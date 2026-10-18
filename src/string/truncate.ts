export function truncate(str: string, length: number, suffix = "..."): string {
  if (typeof str !== "string") {
    throw new Error("Input must be a string")
  }

  if (typeof length !== "number" || !Number.isFinite(length) || length < 0) {
    throw new Error("Length must be a non-negative number")
  }

  if (str.length <= length) {
    return str
  }

  if (length <= suffix.length) {
    return suffix.slice(0, length)
  }

  return str.slice(0, length - suffix.length) + suffix
}
