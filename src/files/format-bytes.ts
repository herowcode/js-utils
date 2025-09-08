export function formatBytes(bytes: number): string {
  if (bytes < 0) {
    throw new Error("Size in bytes cannot be negative")
  }

  const units = ["B", "KB", "MB", "GB", "TB", "PB"]
  let size = bytes
  let index = 0

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }

  return `${size.toFixed(2)} ${units[index]}`
}
