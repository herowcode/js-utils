import pino, { type LoggerOptions, type Logger as PinoLogger } from "pino"
import { DEFAULT_REDACT_PATHS } from "./redact"
import type {
  ICreateLoggerOptions,
  ILogger,
  TLogContext,
  TLogLevel,
} from "./types"

function resolveLevel(opts: ICreateLoggerOptions): TLogLevel {
  if (opts.level) return opts.level
  const envLevel = process.env.LOG_LEVEL as TLogLevel | undefined
  if (envLevel) return envLevel
  return process.env.NODE_ENV === "production" ? "info" : "debug"
}

function buildBaseOptions(opts: ICreateLoggerOptions): LoggerOptions {
  return {
    level: resolveLevel(opts),
    base: {
      service: opts.service,
      env: process.env.NODE_ENV ?? "development",
      ...opts.bindings,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    redact: {
      paths: [...DEFAULT_REDACT_PATHS, ...(opts.redact ?? [])],
      censor: "[REDACTED]",
    },
  }
}

function buildPino(opts: ICreateLoggerOptions): PinoLogger {
  const base = buildBaseOptions(opts)
  if (process.env.NODE_ENV === "production") return pino(base)

  try {
    return pino({
      ...base,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
    })
  } catch {
    return pino(base)
  }
}

function wrap(p: PinoLogger): ILogger {
  return {
    debug: (msg: string, ctx?: TLogContext) =>
      ctx ? p.debug(ctx, msg) : p.debug(msg),
    info: (msg: string, ctx?: TLogContext) =>
      ctx ? p.info(ctx, msg) : p.info(msg),
    warn: (msg: string, ctx?: TLogContext) =>
      ctx ? p.warn(ctx, msg) : p.warn(msg),
    error: (msg: string, ctx?: TLogContext) =>
      ctx ? p.error(ctx, msg) : p.error(msg),
    child: (bindings) => wrap(p.child(bindings)),
  }
}

/**
 * Creates a structured logger backed by Pino.
 *
 * Calls always emit a single JSON line. Use the canonical signature:
 *   `logger.info("event_name", { ...context })`
 * — message stays constant, dynamic values go into the context object.
 */
export function createLogger(opts: ICreateLoggerOptions): ILogger {
  return wrap(buildPino(opts))
}

/**
 * Returns the raw Pino instance — required when handing the logger to Fastify
 * (`fastify({ loggerInstance })`), since Fastify uses Pino's native
 * `(ctx, msg)` order on `request.log` internally.
 */
export function createPinoInstance(opts: ICreateLoggerOptions): PinoLogger {
  return buildPino(opts)
}
