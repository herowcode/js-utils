import { fixTimezoneOffset } from "./fixTimezoneOffset"

interface ILocaleTranslations {
  year: { singular: string; plural: string }
  month: { singular: string; plural: string }
  day: { singular: string; plural: string }
  formatList: (parts: string[]) => string
}

// Supported locales and their translations
const locales: Record<string, ILocaleTranslations> = {
  "pt-BR": {
    year: { singular: "ano", plural: "anos" },
    month: { singular: "mês", plural: "meses" },
    day: { singular: "dia", plural: "dias" },
    formatList: (parts) => {
      if (parts.length === 0) return ""
      if (parts.length === 1) return parts[0]
      const lastPart = parts[parts.length - 1]
      const otherParts = parts.slice(0, -1)
      return `${otherParts.join(", ")} e ${lastPart}`
    },
  },
  "en-US": {
    year: { singular: "year", plural: "years" },
    month: { singular: "month", plural: "months" },
    day: { singular: "day", plural: "days" },
    formatList: (parts) => {
      if (parts.length === 0) return ""
      if (parts.length === 1) return parts[0]
      if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
      return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`
    },
  },
  "es-ES": {
    year: { singular: "año", plural: "años" },
    month: { singular: "mes", plural: "meses" },
    day: { singular: "día", plural: "días" },
    formatList: (parts) => {
      if (parts.length === 0) return ""
      if (parts.length === 1) return parts[0]
      const lastPart = parts[parts.length - 1]
      const otherParts = parts.slice(0, -1)
      return `${otherParts.join(", ")} y ${lastPart}`
    },
  },
  "fr-FR": {
    year: { singular: "an", plural: "ans" },
    month: { singular: "mois", plural: "mois" },
    day: { singular: "jour", plural: "jours" },
    formatList: (parts) => {
      if (parts.length === 0) return ""
      if (parts.length === 1) return parts[0]
      const lastPart = parts[parts.length - 1]
      const otherParts = parts.slice(0, -1)
      return `${otherParts.join(", ")} et ${lastPart}`
    },
  },
}

export function parseTimeSpent(
  initialDate: string | Date,
  finalDate: string | Date,
  locale = "pt-BR", // Default to Portuguese for backward compatibility
) {
  const final = fixTimezoneOffset(finalDate)
  const initial = fixTimezoneOffset(initialDate)

  const years = final.diff(initial, "year")
  const months = final.diff(initial.add(years, "year"), "month")
  const days = final.diff(
    initial.add(years, "year").add(months, "month"),
    "day",
  )

  // Use default locale if the requested one isn't supported
  const translations = locales[locale] || locales["pt-BR"]

  // Format each time unit
  const parts: string[] = []

  if (years > 0) {
    const unit =
      years === 1 ? translations.year.singular : translations.year.plural
    parts.push(`${years} ${unit}`)
  }

  if (months > 0) {
    const unit =
      months === 1 ? translations.month.singular : translations.month.plural
    parts.push(`${months} ${unit}`)
  }

  if (days > 0) {
    const unit =
      days === 1 ? translations.day.singular : translations.day.plural
    parts.push(`${days} ${unit}`)
  }

  // Format according to locale's list formatting rules
  return translations.formatList(parts)
}
