import { walkCause } from "./walk-cause"

function readStatus(link: object): number | undefined {
  const candidate = link as {
    status?: unknown
    statusCode?: unknown
    response?: { status?: unknown } | null
  }
  for (const value of [
    candidate.status,
    candidate.statusCode,
    candidate.response?.status,
  ]) {
    if (typeof value === "number" && Number.isFinite(value)) return value
  }
  return undefined
}

/**
 * Reads an HTTP status from `status`, `statusCode` or `response.status`, walking the `cause` chain.
 * @example getErrorStatus({ response: { status: 503 } }) // 503
 */
export function getErrorStatus(err: unknown): number | undefined {
  for (const link of walkCause(err)) {
    if (typeof link !== "object" || link === null) continue
    const status = readStatus(link)
    if (status !== undefined) return status
  }
  return undefined
}
