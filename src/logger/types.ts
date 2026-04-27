export type TLogLevel = "debug" | "info" | "warn" | "error"

export type TLogContext = Record<string, unknown>

export type TLogFn = (msg: string, ctx?: TLogContext) => void

export interface ILogger {
  debug: TLogFn
  info: TLogFn
  warn: TLogFn
  error: TLogFn
  child: (bindings: TLogContext) => ILogger
}

export interface ICreateLoggerOptions {
  service: string
  level?: TLogLevel
  redact?: string[]
  bindings?: TLogContext
}
