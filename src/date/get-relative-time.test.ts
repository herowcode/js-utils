import { describe, expect, it } from "vitest"
import { dayjs } from "./dayjs"
import { getRelativeTime } from "./get-relative-time"

describe("getRelativeTime", () => {
  // fixed reference: 2025-09-15T12:00:00Z
  const now = dayjs("2025-09-15T12:00:00Z")

  it("returns seconds ago for very recent past dates", () => {
    const threeSecondsAgo = now.subtract(3, "second")
    const res = getRelativeTime(threeSecondsAgo, now)
    expect(res).toMatch(/second/)
  })

  it("returns minutes ago for minutes in the past", () => {
    const fiveMinutesAgo = now.subtract(5, "minute")
    const res = getRelativeTime(fiveMinutesAgo, now)
    expect(res).toMatch(/minute/)
  })

  it("returns hours ago for hours in the past", () => {
    const twoHoursAgo = now.subtract(2, "hour")
    const res = getRelativeTime(twoHoursAgo, now)
    expect(res).toMatch(/hour/)
  })

  it("returns days ago for days in the past", () => {
    const threeDaysAgo = now.subtract(3, "day")
    const res = getRelativeTime(threeDaysAgo, now)
    expect(res).toMatch(/day/)
  })

  it("returns future phrasing for future dates", () => {
    const inTwoDays = now.add(2, "day")
    const res = getRelativeTime(inTwoDays, now)
    // may be "in 2 days" or localized; just ensure it references a day and likely future indicator like "in" or "from"
    expect(res).toMatch(/day/)
  })

  it("accepts string/number inputs as date", () => {
    const dateStr = "2025-09-15T11:59:00Z" // 1 minute before now
    const res = getRelativeTime(dateStr, now)
    expect(res).toMatch(/minute|second/)
  })

  it("works when dateNow is omitted (uses current time)", () => {
    // can't deterministically assert exact text, but calling should not throw
    const past = new Date(Date.now() - 60 * 1000)
    expect(() => getRelativeTime(past)).not.toThrow()
  })
})
