import { herowError } from "../errors/herow-error"
import { type IEnvOptions, readEnv } from "./env-source"

export interface IRequireEnvOptions extends IEnvOptions {
  /** Minimum length of the value; shorter values are rejected. */
  minLength?: number
}

/**
 * Returns a required environment variable or throws `HEROW_ENV_MISSING` (never echoing the value).
 * @example const url = requireEnv("DATABASE_URL")
 */
export function requireEnv(
  name: string,
  options: IRequireEnvOptions = {},
): string {
  const value = readEnv(name, options)
  if (value === undefined) {
    throw herowError(
      Error,
      "HEROW_ENV_MISSING",
      `Environment variable "${name}" is not set or is empty.`,
      `Set ${name} in your environment (or .env file) and restart.`,
    )
  }
  if (options.minLength !== undefined && value.length < options.minLength) {
    throw herowError(
      Error,
      "HEROW_ENV_MISSING",
      `Environment variable "${name}" is shorter than the required ${options.minLength} characters.`,
      `Provide a longer ${name} value and restart.`,
    )
  }
  return value
}
