export type TConcurrencyLimiter = <T>(task: () => T | Promise<T>) => Promise<T>

/**
 * Returns a function that runs tasks with at most `limit` in flight; the rest wait in FIFO order.
 * @example const limit = createConcurrencyLimiter(3); await Promise.all(urls.map((u) => limit(() => fetch(u))))
 */
export function createConcurrencyLimiter(limit: number): TConcurrencyLimiter {
  const max = Math.max(1, Math.floor(limit) || 1)
  const queue: (() => void)[] = []
  let active = 0

  const next = () => {
    active--
    queue.shift()?.()
  }

  return <T>(task: () => T | Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++
        Promise.resolve().then(task).then(resolve, reject).finally(next)
      }
      if (active < max) run()
      else queue.push(run)
    })
}
