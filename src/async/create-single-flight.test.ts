import { createSingleFlight } from "./create-single-flight"

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("createSingleFlight", () => {
  it("shares one invocation between concurrent callers", async () => {
    const gate = deferred<string>()
    const fn = vi.fn(() => gate.promise)
    const run = createSingleFlight(fn)

    const a = run()
    const b = run()
    expect(a).toBe(b)
    gate.resolve("token")

    expect(await Promise.all([a, b])).toEqual(["token", "token"])
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("starts fresh on the next call after it resolves", async () => {
    const fn = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2)
    const run = createSingleFlight(fn)

    expect(await run()).toBe(1)
    expect(await run()).toBe(2)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("rejects every waiter, then starts fresh (reject order)", async () => {
    const gate = deferred<string>()
    const fn = vi
      .fn<() => Promise<string>>()
      .mockReturnValueOnce(gate.promise)
      .mockResolvedValueOnce("ok")
    const run = createSingleFlight(fn)

    const a = run()
    const b = run()
    gate.reject(new Error("refresh failed"))

    await expect(a).rejects.toThrow("refresh failed")
    await expect(b).rejects.toThrow("refresh failed")
    expect(await run()).toBe("ok")
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("frees the slot before waiters resume, so a waiter can call again", async () => {
    const first = deferred<string>()
    const fn = vi
      .fn<() => Promise<string>>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce("second")
    const run = createSingleFlight(fn)

    const waiter = run().then(() => run())
    first.resolve("first")

    expect(await waiter).toBe("second")
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("frees the slot before waiters resume after a rejection", async () => {
    const first = deferred<string>()
    const fn = vi
      .fn<() => Promise<string>>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce("again")
    const run = createSingleFlight(fn)

    const waiter = run().catch(() => run())
    first.reject(new Error("x"))

    expect(await waiter).toBe("again")
  })

  it("turns a synchronous throw into a rejection and does not stick", async () => {
    const fn = vi
      .fn<() => string>()
      .mockImplementationOnce(() => {
        throw new Error("sync")
      })
      .mockReturnValueOnce("fine")
    const run = createSingleFlight(fn)

    await expect(run()).rejects.toThrow("sync")
    expect(await run()).toBe("fine")
  })

  it("passes the arguments of the call that started the flight", async () => {
    const gate = deferred<string>()
    const fn = vi.fn((_id: string) => gate.promise)
    const run = createSingleFlight(fn)

    const a = run("first")
    run("second")
    gate.resolve("done")

    await a
    expect(fn).toHaveBeenCalledExactlyOnceWith("first")
  })

  it("accepts a plain synchronous function", async () => {
    const run = createSingleFlight(() => 7)
    expect(await run()).toBe(7)
  })
})
