import { afterEach, describe, expect, it } from "vitest"
import {
  dayjs,
  getDayjsGlobalIntl,
  resetDayjsGlobalIntl,
  setDayjsGlobalIntl,
  withDayjsGlobalIntl,
} from "./dayjs"

describe("dayjs Intl helpers", () => {
  afterEach(() => {
    resetDayjsGlobalIntl()
  })

  it("updates the global Intl configuration", () => {
    setDayjsGlobalIntl({
      locale: "en-US",
      options: { year: "2-digit" },
    })

    const config = getDayjsGlobalIntl()
    expect(config.locale).toBe("en-US")
    expect(config.options.year).toBe("2-digit")
    expect(config.options.month).toBe("long")
  })

  it("restores configuration after scoped change", () => {
    const original = getDayjsGlobalIntl()

    const temporaryLocale = withDayjsGlobalIntl({ locale: "fr" }, () => {
      return getDayjsGlobalIntl().locale
    })

    expect(temporaryLocale).toBe("fr")
    expect(getDayjsGlobalIntl().locale).toBe(original.locale)
  })

  it("formats using provided Intl overrides", () => {
    const formatted = dayjs("2023-12-25").formatIntl({
      locale: "en-US",
      options: { month: "short", day: "numeric", year: undefined },
    })

    expect(formatted).toBe("Dec 25")
  })
})
