import type { IDayjsIntlConfig } from "./dayjs"
import { dayjs, getDayjsGlobalIntl } from "./dayjs"

export interface IFormatDateConfig {
  /** Optional locale override applied to the underlying dayjs instance */
  locale?: string
  /**
   * When provided, format using dayjs tokens (e.g. "DD/MM/YYYY").
   * Unless `useIntl` is true, this takes precedence over Intl formatting.
   */
  format?: string
  /**
   * Intl configuration used when formatting through `Intl.DateTimeFormat`.
   * Values are merged on top of the global Intl configuration.
   */
  intl?: IDayjsIntlConfig
  /**
   * Forces the use of Intl formatting even if a format string is supplied.
   */
  useIntl?: boolean
}

type TLocaleOrConfig = Intl.LocalesArgument | IFormatDateConfig

function isFormatDateConfig(
  value: TLocaleOrConfig,
): value is IFormatDateConfig {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isValidLocaleTag(value: string): boolean {
  if (
    typeof Intl !== "undefined" &&
    typeof Intl.getCanonicalLocales === "function"
  ) {
    try {
      Intl.getCanonicalLocales(value)
      return true
    } catch {
      return false
    }
  }

  return /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(value)
}

function toDayjsLocale(
  locale?:
    | Intl.LocalesArgument
    | Intl.Locale
    | readonly (string | Intl.Locale)[],
): string | undefined {
  if (!locale) return undefined
  const first = Array.isArray(locale)
    ? (locale[0] as string | Intl.Locale)
    : (locale as string | Intl.Locale)
  return typeof first === "string" ? first : String(first)
}

export function formatDate(
  date: Date | string | number,
  localeOrConfig: TLocaleOrConfig = getDayjsGlobalIntl().locale,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const instance = dayjs(date)

  if (!instance.isValid()) {
    throw new RangeError("Invalid time value")
  }

  if (isFormatDateConfig(localeOrConfig)) {
    const { format, locale, intl, useIntl } = localeOrConfig
    const baseLocale = locale ?? toDayjsLocale(intl?.locale)
    const workingInstance = baseLocale ? instance.locale(baseLocale) : instance

    if (format && !useIntl) {
      return workingInstance.format(format)
    }

    const intlConfig: IDayjsIntlConfig | undefined = intl
      ? {
          locale: intl.locale ?? baseLocale,
          options: intl.options,
        }
      : baseLocale
        ? {
            locale: baseLocale,
          }
        : undefined

    return workingInstance.formatIntl(intlConfig)
  }

  if (typeof localeOrConfig === "string" && opts === undefined) {
    if (!isValidLocaleTag(localeOrConfig)) {
      return instance.format(localeOrConfig)
    }
  }

  const localeForDayjs = toDayjsLocale(localeOrConfig)
  const workingInstance = localeForDayjs
    ? instance.locale(localeForDayjs)
    : instance

  const intlConfig: IDayjsIntlConfig | undefined =
    localeOrConfig !== undefined || opts !== undefined
      ? {
          locale: localeOrConfig,
          options: opts,
        }
      : undefined

  return workingInstance.formatIntl(intlConfig)
}
