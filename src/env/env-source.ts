import { herowError } from "../errors/herow-error"

export type TEnvSource = Record<string, string | undefined>

export interface IEnvOptions {
  /** Where variables are read from. Defaults to the runtime's `globalThis.process?.env`. */
  env?: TEnvSource
}

export function resolveEnv(options: IEnvOptions): TEnvSource {
  const source = "env" in options ? options.env : globalThis.process?.env
  if (!source) {
    throw herowError(
      Error,
      "HEROW_ENV_NO_SOURCE",
      "No environment source is available in this runtime.",
      "Pass one explicitly, for example requireEnv(name, { env: context.env }).",
    )
  }
  return source
}

export function readEnv(
  name: string,
  options: IEnvOptions,
): string | undefined {
  const value = resolveEnv(options)[name]
  return typeof value === "string" && value.trim() !== "" ? value : undefined
}
