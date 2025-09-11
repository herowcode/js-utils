export const formatStringToTime = (str: string) => {
  const stringCleaned = Number(str.replace(/\D/g, "")).toString()
  if (stringCleaned.length > 4) {
    return stringCleaned
      .padStart(6, "0")
      .slice(0, 6)
      .replace(/(\d{2})(\d{2})(\d{2})/, "$1:$2:$3")
  }

  return stringCleaned.padStart(4, "0").replace(/(\d{2})(\d{2})/, "$1:$2")
}
