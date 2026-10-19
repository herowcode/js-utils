import { type IEnvOptions, readEnv } from "./env-source"

/**
 * Reads an environment variable; unset, empty or whitespace-only values give `fallback`.
 * @example const region = optionalEnv("AWS_REGION", "us-east-1")
 */
export function optionalEnv(
  name: string,
  fallback: string,
  options?: IEnvOptions,
): string
export function optionalEnv(
  name: string,
  fallback?: undefined,
  options?: IEnvOptions,
): string | undefined
export function optionalEnv(
  name: string,
  fallback?: string,
  options: IEnvOptions = {},
): string | undefined {
  return readEnv(name, options) ?? fallback
}
