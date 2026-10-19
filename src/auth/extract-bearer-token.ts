/**
 * Returns the token from an `Authorization: Bearer <token>` header (scheme is case-insensitive), else null.
 * @example extractBearerToken(request.headers.get("authorization")) // "abc" or null
 */
export function extractBearerToken(
  header: string | null | undefined,
): string | null {
  if (typeof header !== "string") return null
  const match = /^bearer[ \t]+(\S+)$/i.exec(header.trim())
  return match ? match[1] : null
}
