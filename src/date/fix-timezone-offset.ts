import type { Dayjs } from "dayjs"

import { dayjs } from "./dayjs"

export function fixTimezoneOffset(utcDate: Date | string): Dayjs {
  const offset = new Date(utcDate).getTimezoneOffset()
  return dayjs(utcDate).add(offset, "minute")
}
