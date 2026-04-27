import { browserRedact } from "./redact"
import type {
  ICreateLoggerOptions,
  ILogger,
  TLogContext,
  TLogLevel,
} from "./types"

const LEVEL_ORDER: Record<TLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function readEnvLevel(): TLogLevel | undefined {
  if (typeof globalThis !== "undefined") {
    const ls = (globalThis as { localStorage?: Storage }).localStorage
    const fromStorage = ls?.getItem?.("LOG_LEVEL")
    if (fromStorage && fromStorage in LEVEL_ORDER) {
      return fromStorage as TLogLevel
    }
  }
  const envLevel =
    typeof process !== "undefined" ? process.env?.LOG_LEVEL : undefined
  if (envLevel && envLevel in LEVEL_ORDER) return envLevel as TLogLevel
  return undefined
}

function isProduction(): boolean {
  return (
    typeof process !== "undefined" && process.env?.NODE_ENV === "production"
  )
}

function resolveLevel(opts: ICreateLoggerOptions): TLogLevel {
  if (opts.level) return opts.level
  const fromEnv = readEnvLevel()
  if (fromEnv) return fromEnv
  return isProduction() ? "info" : "debug"
}

function serializeError(err: unknown): unknown {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack }
  }
  return err
}

function normalizeContext(
  ctx: TLogContext | undefined,
  redact: readonly string[] | undefined,
): TLogContext | undefined {
  if (!ctx) return undefined
  const next: TLogContext = {}
  for (const [k, v] of Object.entries(ctx)) {
    next[k] = k === "err" ? serializeError(v) : v
  }
  return browserRedact(next, redact)
}

interface IBrowserLoggerState {
  service: string
  level: TLogLevel
  bindings: TLogContext
  redact: readonly string[] | undefined
}

function emit(
  state: IBrowserLoggerState,
  level: TLogLevel,
  msg: string,
  ctx: TLogContext | undefined,
): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[state.level]) return

  const merged = {
    ...state.bindings,
    ...(normalizeContext(ctx, state.redact) ?? {}),
  }

  if (isProduction()) {
    const payload = {
      time: new Date().toISOString(),
      level,
      service: state.service,
      env: process.env.NODE_ENV,
      msg,
      ...merged,
    }
    console.log(JSON.stringify(payload))
    return
  }

  const consoleFn =
    level === "debug"
      ? console.debug
      : level === "info"
        ? console.info
        : level === "warn"
          ? console.warn
          : console.error

  if (Object.keys(merged).length === 0) {
    consoleFn(`[${state.service}] ${msg}`)
  } else {
    consoleFn(`[${state.service}] ${msg}`, merged)
  }
}

function build(state: IBrowserLoggerState): ILogger {
  return {
    debug: (msg, ctx) => emit(state, "debug", msg, ctx),
    info: (msg, ctx) => emit(state, "info", msg, ctx),
    warn: (msg, ctx) => emit(state, "warn", msg, ctx),
    error: (msg, ctx) => emit(state, "error", msg, ctx),
    child: (bindings) =>
      build({ ...state, bindings: { ...state.bindings, ...bindings } }),
  }
}

/**
 * Creates a zero-dependency client-side logger.
 *
 * Calls always emit a single console line. Use the canonical signature:
 *   `logger.info("event_name", { ...context })`
 * — message stays constant, dynamic values go into the context object.
 */
export function createLogger(opts: ICreateLoggerOptions): ILogger {
  return build({
    service: opts.service,
    level: resolveLevel(opts),
    bindings: opts.bindings ?? {},
    redact: opts.redact,
  })
}
