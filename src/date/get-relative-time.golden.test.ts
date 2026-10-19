import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getRelativeTime } from "./get-relative-time"

const NOW = new Date("2026-03-05T12:00:00.000Z")
const SECOND = 1000

describe("getRelativeTime default path golden", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    [-3 * SECOND, "a few seconds ago"],
    [-5 * 60 * SECOND, "5 minutes ago"],
    [-2 * 3600 * SECOND, "2 hours ago"],
    [-3 * 86400 * SECOND, "3 days ago"],
    [-45 * 86400 * SECOND, "a month ago"],
    [-400 * 86400 * SECOND, "a year ago"],
    [3600 * SECOND, "in an hour"],
    [2 * 86400 * SECOND, "in 2 days"],
  ])("offset %i ms -> %s", (offset, expected) => {
    expect(getRelativeTime(new Date(NOW.getTime() + offset))).toBe(expected)
  })
})
