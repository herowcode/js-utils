import type { Dayjs as DayjsInstance, PluginFunc } from "dayjs"
import dayJs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import customParseFormat from "dayjs/plugin/customParseFormat"
import localizedFormat from "dayjs/plugin/localizedFormat"
import relativeTime from "dayjs/plugin/relativeTime"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import "dayjs/locale/en"
import "dayjs/locale/es"
import "dayjs/locale/fr"
import "dayjs/locale/pt-br"
// Ensure TS sees Dayjs instance augmentation wherever this module is imported
import type {} from "../types/dayjs-intl"

export interface IDayjsIntlConfig {
  locale?: Intl.LocalesArgument
  options?: Intl.DateTimeFormatOptions
}

export interface IDayjsIntlResolvedConfig {
  locale: Intl.LocalesArgument
  options: Intl.DateTimeFormatOptions
}

const DEFAULT_INTL_CONFIG: IDayjsIntlResolvedConfig = {
  locale: "pt-BR",
  options: {
    month: "long",
    day: "numeric",
    year: "numeric",
  },
}

let globalIntlConfig: IDayjsIntlResolvedConfig = {
  locale: DEFAULT_INTL_CONFIG.locale,
  options: { ...DEFAULT_INTL_CONFIG.options },
}

function mergeIntlConfigs(
  base: IDayjsIntlResolvedConfig,
  override?: IDayjsIntlConfig,
): IDayjsIntlResolvedConfig {
  if (!override) {
    return {
      locale: base.locale,
      options: { ...base.options },
    }
  }

  const mergedLocale = override.locale ?? base.locale
  const mergedOptions: Intl.DateTimeFormatOptions = { ...base.options }

  if (override.options) {
    for (const key of Object.keys(override.options) as Array<
      keyof Intl.DateTimeFormatOptions
    >) {
      const value = override.options[key]

      if (value === undefined || value === null) {
        delete (mergedOptions as any)[key]
      } else {
        ;(mergedOptions as any)[key] = value as any
      }
    }
  }

  return {
    locale: mergedLocale,
    options: mergedOptions,
  }
}

const intlPlugin: PluginFunc<IDayjsIntlConfig | undefined> = (
  pluginConfig,
  DayjsClass,
) => {
  if (pluginConfig) {
    globalIntlConfig = mergeIntlConfigs(globalIntlConfig, pluginConfig)
  }

  const formatIntl = function formatIntl(
    this: DayjsInstance,
    config?: IDayjsIntlConfig,
  ): string {
    const resolved = mergeIntlConfigs(globalIntlConfig, config)
    return new Intl.DateTimeFormat(resolved.locale, resolved.options).format(
      this.toDate(),
    )
  }

  const toIntlFormatter = function toIntlFormatter(
    this: DayjsInstance,
    config?: IDayjsIntlConfig,
  ): Intl.DateTimeFormat {
    const resolved = mergeIntlConfigs(globalIntlConfig, config)
    return new Intl.DateTimeFormat(resolved.locale, resolved.options)
  }

  Object.defineProperty(DayjsClass.prototype, "formatIntl", {
    value: formatIntl,
    configurable: true,
  })

  Object.defineProperty(DayjsClass.prototype, "toIntlFormatter", {
    value: toIntlFormatter,
    configurable: true,
  })
}

export function getDayjsGlobalIntl(): IDayjsIntlResolvedConfig {
  return {
    locale: globalIntlConfig.locale,
    options: { ...globalIntlConfig.options },
  }
}

export function setDayjsGlobalIntl(
  config: IDayjsIntlConfig,
): IDayjsIntlResolvedConfig {
  globalIntlConfig = mergeIntlConfigs(globalIntlConfig, config)
  return getDayjsGlobalIntl()
}

export function resetDayjsGlobalIntl(): IDayjsIntlResolvedConfig {
  globalIntlConfig = {
    locale: DEFAULT_INTL_CONFIG.locale,
    options: { ...DEFAULT_INTL_CONFIG.options },
  }
  return getDayjsGlobalIntl()
}

export function withDayjsGlobalIntl<T>(
  config: IDayjsIntlConfig,
  callback: () => T,
): T {
  const previous = getDayjsGlobalIntl()
  globalIntlConfig = mergeIntlConfigs(globalIntlConfig, config)

  try {
    return callback()
  } finally {
    globalIntlConfig = {
      locale: previous.locale,
      options: { ...previous.options },
    }
  }
}

export function resolveDayjsIntlConfig(
  config?: IDayjsIntlConfig,
): IDayjsIntlResolvedConfig {
  return mergeIntlConfigs(globalIntlConfig, config)
}

dayJs.extend(utc)
dayJs.extend(customParseFormat)
dayJs.extend(advancedFormat)
dayJs.extend(timezone)
dayJs.extend(localizedFormat)
dayJs.extend(relativeTime)
dayJs.extend(intlPlugin)

export const dayjs = dayJs
