type TQueryPrimitive = string | number | boolean

export type TQueryParams = Record<
  string,
  | TQueryPrimitive
  | null
  | undefined
  | readonly (TQueryPrimitive | null | undefined)[]
>

/**
 * Builds a `?a=1&b=2` query string; null/undefined are skipped and arrays repeat the key.
 * @example buildQueryString({ page: 1, tag: ["a", "b"] }) // "?page=1&tag=a&tag=b"
 */
export function buildQueryString(params: TQueryParams): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (item !== null && item !== undefined) {
        searchParams.append(key, String(item))
      }
    }
  }

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ""
}
