import { describe, expect, it } from "vitest"
import { createConcurrencyLimiter } from "./create-concurrency-limiter"

const deferred = <T = void>() => {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("createConcurrencyLimiter", () => {
  it("never exceeds the limit and starts queued tasks in FIFO order", async () => {
    const limit = createConcurrencyLimiter(2)
    const gates = [deferred(), deferred(), deferred(), deferred()]
    const started: number[] = []
    let active = 0
    let peak = 0
    const results = gates.map((gate, i) =>
      limit(async () => {
        started.push(i)
        active++
        peak = Math.max(peak, active)
        await gate.promise
        active--
        return i
      }),
    )
    await Promise.resolve()
    expect(started).toEqual([0, 1])
    gates[1].resolve()
    await results[1]
    await new Promise((r) => setTimeout(r, 0))
    expect(started).toEqual([0, 1, 2])
    gates[0].resolve()
    gates[2].resolve()
    gates[3].resolve()
    expect(await Promise.all(results)).toEqual([0, 1, 2, 3])
    expect(peak).toBe(2)
  })

  it("keeps result order when completion order is reversed", async () => {
    const limit = createConcurrencyLimiter(3)
    const gates = [deferred<string>(), deferred<string>(), deferred<string>()]
    const out = gates.map((g) => limit(() => g.promise))
    gates[2].resolve("c")
    gates[1].resolve("b")
    gates[0].resolve("a")
    expect(await Promise.all(out)).toEqual(["a", "b", "c"])
  })

  it("frees the slot when a task rejects or throws synchronously", async () => {
    const limit = createConcurrencyLimiter(1)
    const failing = limit(() => Promise.reject(new Error("bad")))
    const throwing = limit(() => {
      throw new Error("sync")
    })
    const ok = limit(() => "fine")
    await expect(failing).rejects.toThrow("bad")
    await expect(throwing).rejects.toThrow("sync")
    expect(await ok).toBe("fine")
  })

  it("treats invalid limits as 1", async () => {
    const limit = createConcurrencyLimiter(0)
    let active = 0
    let peak = 0
    await Promise.all(
      [1, 2, 3].map(() =>
        limit(async () => {
          active++
          peak = Math.max(peak, active)
          await Promise.resolve()
          active--
        }),
      ),
    )
    expect(peak).toBe(1)
  })
})
