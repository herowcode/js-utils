const MAX_DEPTH = 10

/** Returns `err` followed by its `cause` links (non-Error causes included), bounded and cycle-safe. */
export function walkCause(err: unknown): unknown[] {
  const chain: unknown[] = []
  const visited = new Set<unknown>()
  let current: unknown = err

  while (chain.length < MAX_DEPTH) {
    chain.push(current)
    if (typeof current !== "object" || current === null) break
    visited.add(current)
    const next = (current as { cause?: unknown }).cause
    if (next === undefined || next === null || visited.has(next)) break
    current = next
  }

  return chain
}
