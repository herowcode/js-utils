export interface IFormatBytesOptions {
  /** Digits after the decimal point; default 2. */
  decimals?: number
  /** 1024 (default) or 1000 per step. */
  base?: 1000 | 1024
  /** BCP 47 locale for the number, e.g. "pt-BR" gives "1,50 KB"; default is "." decimals. */
  locale?: string
}

/**
 * Formats a byte count as "1.50 KB".
 * @example formatBytes(1500, { base: 1000, decimals: 1 }) // "1.5 KB"
 */
export function formatBytes(
  bytes: number,
  options?: IFormatBytesOptions,
): string {
  if (bytes < 0) {
    throw new Error("Size in bytes cannot be negative")
  }

  const base = options?.base ?? 1024
  const decimals = options?.decimals ?? 2
  const units = ["B", "KB", "MB", "GB", "TB", "PB"]
  let size = bytes
  let index = 0

  while (size >= base && index < units.length - 1) {
    size /= base
    index++
  }

  const text = options?.locale
    ? size.toLocaleString(options.locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : size.toFixed(decimals)
  return `${text} ${units[index]}`
}
