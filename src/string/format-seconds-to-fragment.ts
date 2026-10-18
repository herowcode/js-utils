/** convert seconds to "1h2m3s" or "42s" style for fragment */
export const formatSecondsToFragment = (secs: number): string => {
  const parsedSecs = Number.isFinite(secs) ? Math.max(0, Math.floor(secs)) : 0
  const h = Math.floor(parsedSecs / 3600)
  const m = Math.floor((parsedSecs % 3600) / 60)
  const s = parsedSecs % 60
  let out = ""
  if (h > 0) out += `${h}h`
  if (m > 0) out += `${m}m`
  if (s > 0 || out === "") out += `${s}s`
  return out
}
