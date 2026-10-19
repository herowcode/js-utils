import { corsHeaders, type ICorsOptions } from "./cors-headers"

const DEFAULT_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"]

/**
 * Answers a CORS preflight with a 204 for `OPTIONS` requests and returns `null` for any other method.
 * @example const early = preflight(request, { origin: "https://app.example.com" }); if (early) return early
 */
export function preflight(
  request: Request,
  options: ICorsOptions,
): Response | null {
  if (request.method !== "OPTIONS") return null
  const headers = corsHeaders(request, {
    ...options,
    methods: options.methods ?? DEFAULT_METHODS,
  })
  const requested = request.headers.get("Access-Control-Request-Headers")
  if (!options.headers?.length && requested) {
    headers.set("Access-Control-Allow-Headers", requested)
    headers.append("Vary", "Access-Control-Request-Headers")
  }
  return new Response(null, { status: 204, headers })
}
