export const formatHMSToSeconds = (val?: number | string): number | null => {
  if (val == null || val === "") return null
  if (typeof val === "number")
    return Number.isFinite(val) ? Math.max(0, Math.floor(val)) : null
  const s = String(val).trim()
  // purely numeric string
  if (/^\d+$/.test(s)) return Math.max(0, Number.parseInt(s, 10))
  // hh:mm:ss or mm:ss
  if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(s)) {
    const parts = s.split(":").map((p) => Number.parseInt(p, 10))
    if (parts.some((n) => Number.isNaN(n))) return null
    let seconds = 0
    if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else {
      seconds = parts[0] * 60 + parts[1]
    }
    return Math.max(0, seconds)
  }
  return null
}
