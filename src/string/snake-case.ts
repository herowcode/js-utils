export function snakeCase(str: string): string {
  if (typeof str !== "string") {
    throw new Error("Input must be a string")
  }

  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase()
    .replace(/^_+|_+$/g, "")
}
