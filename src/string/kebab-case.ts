export function kebabCase(str: string): string {
  if (typeof str !== "string") {
    throw new Error("Input must be a string")
  }

  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase()
    .replace(/^-+|-+$/g, "")
}
