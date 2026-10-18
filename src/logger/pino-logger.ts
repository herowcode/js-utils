import { createRequire } from "node:module"
import type pinoFactory from "pino"
import type { LoggerOptions, Logger as PinoLogger } from "pino"
import { DEFAULT_REDACT_PATHS } from "./redact"
import type { ICreateLoggerOptions, ILogger, TLogContext } from "./types"

const PINO_LEVELS = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
]

const RESERVED_KEYS = ["level", "time", "msg", "service", "env"]

let cachedPino: typeof pinoFactory | undefined

// pino is an optional peer, so it loads lazily; __filename covers the CJS build where import.meta.url is undefined
function loadPino(): typeof pinoFactory {
  if (cachedPino) return cachedPino
  try {
    const nodeRequire = createRequire(import.meta.url ?? __filename)
    const mod = nodeRequire("pino")
    cachedPino = mod.default ?? mod
    return cachedPino as typeof pinoFactory
  } catch (error) {
    const code = (error as { code?: string } | null)?.code
    const missingPino = /['"]pino['"]/.test(String((error as Error)?.message))
    if (
      (code === "MODULE_NOT_FOUND" || code === "ERR_MODULE_NOT_FOUND") &&
      missingPino
    ) {
      throw new Error(
        '@herowcode/utils/logger: the Node logger needs "pino". Install it with: npm install pino',
        { cause: error },
      )
    }
    throw error
  }
}

function resolveLevel(opts: ICreateLoggerOptions): string {
  if (opts.level) return opts.level
  const envLevel = process.env.LOG_LEVEL
  if (envLevel && PINO_LEVELS.includes(envLevel)) return envLevel
  return process.env.NODE_ENV === "production" ? "info" : "debug"
}

function buildBaseOptions(
  pino: typeof pinoFactory,
  opts: ICreateLoggerOptions,
): LoggerOptions {
  return {
    level: resolveLevel(opts),
    base: {
      ...withoutReserved(opts.bindings),
      service: opts.service,
      env: process.env.NODE_ENV ?? "development",
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
  const pino = loadPino()
  const base = buildBaseOptions(pino, opts)
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

// pino appends context after its own fields, so a reserved key would emit a duplicate JSON key
function withoutReserved<T extends object>(ctx: T | undefined): Partial<T> {
  if (!ctx) return {}
  return Object.fromEntries(
    Object.entries(ctx).filter(([key]) => !RESERVED_KEYS.includes(key)),
  ) as Partial<T>
}

function wrap(p: PinoLogger): ILogger {
  return {
    debug: (msg: string, ctx?: TLogContext) =>
      ctx ? p.debug(withoutReserved(ctx), msg) : p.debug(msg),
    info: (msg: string, ctx?: TLogContext) =>
      ctx ? p.info(withoutReserved(ctx), msg) : p.info(msg),
    warn: (msg: string, ctx?: TLogContext) =>
      ctx ? p.warn(withoutReserved(ctx), msg) : p.warn(msg),
    error: (msg: string, ctx?: TLogContext) =>
      ctx ? p.error(withoutReserved(ctx), msg) : p.error(msg),
    child: (bindings) => wrap(p.child(withoutReserved(bindings))),
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
