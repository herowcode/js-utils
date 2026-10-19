const NULL_BODY_STATUS = new Set([204, 205, 304])

/**
 * Builds a JSON `Response` (status 200 and `application/json` unless `init` says otherwise); `undefined` is sent as `null`.
 * @example return jsonResponse({ ok: true }, { status: 201 })
 */
export function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  const nullBody = NULL_BODY_STATUS.has(init.status ?? 200)
  if (!nullBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  return new Response(nullBody ? null : JSON.stringify(data ?? null), {
    ...init,
    headers,
  })
}
