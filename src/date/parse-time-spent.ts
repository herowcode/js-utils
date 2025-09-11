import { fixTimezoneOffset } from "./fix-timezone-offset"

interface IUnitTranslation {
  singular: string
  plural: string
}

interface ILocaleTranslations {
  year: IUnitTranslation
  month: IUnitTranslation
  day: IUnitTranslation
  hour: IUnitTranslation
  minute: IUnitTranslation
  second: IUnitTranslation
  // function to format verbose list (e.g. "1 ano, 2 meses e 3 dias")
  formatList: (parts: string[]) => string
  // tokens used for compact formatting (e.g. "1a2m3d")
  compactTokens: {
    year: string
    month: string
    day: string
    hour: string
    minute: string
    second: string
  }
}

// Supported locales and their translations
const locales: Record<string, ILocaleTranslations> = {
  "pt-BR": {
    year: { singular: "ano", plural: "anos" },
    month: { singular: "mês", plural: "meses" },
    day: { singular: "dia", plural: "dias" },
    hour: { singular: "hora", plural: "horas" },
    minute: { singular: "minuto", plural: "minutos" },
    second: { singular: "segundo", plural: "segundos" },
    formatList: (parts) => {
      if (parts.length === 0) return ""
      if (parts.length === 1) return parts[0]
      const lastPart = parts[parts.length - 1]
      const otherParts = parts.slice(0, -1)
      return `${otherParts.join(", ")} e ${lastPart}`
    },
    compactTokens: {
      year: "a",
      month: "m",
      day: "d",
      hour: "h",
      minute: "min",
      second: "s",
    },
  },
  "en-US": {
    year: { singular: "year", plural: "years" },
    month: { singular: "month", plural: "months" },
    day: { singular: "day", plural: "days" },
    hour: { singular: "hour", plural: "hours" },
    minute: { singular: "minute", plural: "minutes" },
    second: { singular: "second", plural: "seconds" },
    formatList: (parts) => {
      if (parts.length === 0) return ""
      if (parts.length === 1) return parts[0]
      if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
      return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`
    },
    compactTokens: {
      year: "y",
      month: "mo",
      day: "d",
      hour: "h",
      minute: "m",
      second: "s",
    },
  },
  "es-ES": {
    year: { singular: "año", plural: "años" },
    month: { singular: "mes", plural: "meses" },
    day: { singular: "día", plural: "días" },
    hour: { singular: "hora", plural: "horas" },
    minute: { singular: "minuto", plural: "minutos" },
    second: { singular: "segundo", plural: "segundos" },
    formatList: (parts) => {
      if (parts.length === 0) return ""
      if (parts.length === 1) return parts[0]
      const lastPart = parts[parts.length - 1]
      const otherParts = parts.slice(0, -1)
      return `${otherParts.join(", ")} y ${lastPart}`
    },
    compactTokens: {
      year: "a",
      month: "mes",
      day: "d",
      hour: "h",
      minute: "min",
      second: "s",
    },
  },
  "fr-FR": {
    year: { singular: "an", plural: "ans" },
    month: { singular: "mois", plural: "mois" },
    day: { singular: "jour", plural: "jours" },
    hour: { singular: "heure", plural: "heures" },
    minute: { singular: "minute", plural: "minutes" },
    second: { singular: "seconde", plural: "secondes" },
    formatList: (parts) => {
      if (parts.length === 0) return ""
      if (parts.length === 1) return parts[0]
      const lastPart = parts[parts.length - 1]
      const otherParts = parts.slice(0, -1)
      return `${otherParts.join(", ")} et ${lastPart}`
    },
    compactTokens: {
      year: "a",
      month: "m",
      day: "j",
      hour: "h",
      minute: "min",
      second: "s",
    },
  },
}

// Return shape
export interface ITimeSpent {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
  formatted: string
}

// options: format -> 'verbose' | 'compact', minimal -> show only largest non-zero unit
export function parseTimeSpent(
  initialDate: string | Date,
  finalDate: string | Date,
  locale = "pt-BR", // Default to Portuguese for backward compatibility
  options?: { format?: "verbose" | "compact"; minimal?: boolean },
): ITimeSpent {
  const final = fixTimezoneOffset(finalDate)
  const initial = fixTimezoneOffset(initialDate)

  const years = final.diff(initial, "year")
  const months = final.diff(initial.add(years, "year"), "month")
  const days = final.diff(
    initial.add(years, "year").add(months, "month"),
    "day",
  )
  const hours = final.diff(
    initial.add(years, "year").add(months, "month").add(days, "day"),
    "hour",
  )
  const minutes = final.diff(
    initial
      .add(years, "year")
      .add(months, "month")
      .add(days, "day")
      .add(hours, "hour"),
    "minute",
  )
  const seconds = final.diff(
    initial
      .add(years, "year")
      .add(months, "month")
      .add(days, "day")
      .add(hours, "hour")
      .add(minutes, "minute"),
    "second",
  )

  // Use default locale if the requested one isn't supported
  const translations = locales[locale] || locales["pt-BR"]

  // Build verbose parts (localized words)
  const verboseParts: string[] = []
  if (years > 0) {
    const unit =
      years === 1 ? translations.year.singular : translations.year.plural
    verboseParts.push(`${years} ${unit}`)
  }
  if (months > 0) {
    const unit =
      months === 1 ? translations.month.singular : translations.month.plural
    verboseParts.push(`${months} ${unit}`)
  }
  if (days > 0) {
    const unit =
      days === 1 ? translations.day.singular : translations.day.plural
    verboseParts.push(`${days} ${unit}`)
  }
  if (hours > 0) {
    const unit =
      hours === 1 ? translations.hour.singular : translations.hour.plural
    verboseParts.push(`${hours} ${unit}`)
  }
  if (minutes > 0) {
    const unit =
      minutes === 1 ? translations.minute.singular : translations.minute.plural
    verboseParts.push(`${minutes} ${unit}`)
  }
  if (seconds > 0) {
    const unit =
      seconds === 1 ? translations.second.singular : translations.second.plural
    verboseParts.push(`${seconds} ${unit}`)
  }

  // Build compact parts (e.g. "1a2m3d")
  const compactPieces: string[] = []
  if (years > 0)
    compactPieces.push(`${years}${translations.compactTokens.year}`)
  if (months > 0)
    compactPieces.push(`${months}${translations.compactTokens.month}`)
  if (days > 0) compactPieces.push(`${days}${translations.compactTokens.day}`)
  if (hours > 0)
    compactPieces.push(`${hours}${translations.compactTokens.hour}`)
  if (minutes > 0)
    compactPieces.push(`${minutes}${translations.compactTokens.minute}`)
  if (seconds > 0)
    compactPieces.push(`${seconds}${translations.compactTokens.second}`)

  const format = options?.format ?? "verbose"
  const minimal = options?.minimal ?? false

  let formatted = ""
  if (format === "compact") {
    if (compactPieces.length === 0) {
      formatted = ""
    } else if (minimal) {
      formatted = compactPieces[0]
    } else {
      formatted = compactPieces.join("")
    }
  } else {
    // verbose
    if (verboseParts.length === 0) {
      formatted = ""
    } else if (minimal) {
      formatted = verboseParts[0]
    } else {
      formatted = translations.formatList(verboseParts)
    }
  }

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    formatted,
  }
}
